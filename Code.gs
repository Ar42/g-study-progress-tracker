/**
 * G Study Tracker — Google Apps Script backend.
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → Manage deployments
 *         → (edit the existing deployment) → Version: "New version" → Deploy.
 * Editing the existing deployment keeps the same /exec URL, so the app needs no change.
 *
 * Improvements over the previous version:
 *  - LockService: concurrent requests can no longer overwrite each other's rows.
 *  - Partial updates: only fields present in the payload are written (missing
 *    fields are left alone instead of being blanked).
 *  - Written cells are formatted as plain text, so Sheets never re-interprets
 *    "2026-06-09" as a locale date or "15" as a number.
 *  - Unknown sheet names are rejected instead of silently writing to the active sheet.
 *  - doGet?action=read&sheet=NAME returns fresh rows as JSON (the app prefers this
 *    over the CSV export, which can lag behind writes).
 *
 * v2 (Study Log):
 *  - Generic writes: every payload field whose name matches a column title
 *    (ignoring case, spaces and underscores) is written — "createdAt" → "Created At".
 *    Existing BCS / IT fields map exactly as before.
 *  - The "IT" and "Study Log" tabs are created with their header row on first write.
 *  - The read endpoint reports SCRIPT_VERSION, and returns `missing: true` (not an
 *    error) for a known tab that hasn't been created yet.
 *
 * v3 (study timer + targets):
 *  - New known tabs "Study Sessions" (the active timer) and "Settings" (targets).
 *  - "Session Id" column for "Study Log".
 *  - ensureColumns(): before a write to a known tab, any missing header from
 *    KNOWN_TABS is APPENDED after the last column. Existing columns are never
 *    moved, renamed or removed.
 */

var SCRIPT_VERSION = 3;

/** Tabs the script may create on first write, with their header rows. */
var KNOWN_TABS = {
  "IT": ["Id", "Name", "Status", "Comments", "Started Date", "Target To Complete Date", "Completed Date", "Links"],
  "Study Log": ["Id", "Date", "Category", "Subject Id", "Subject", "Topic Id", "Topic", "Minutes", "Description", "Created At", "Session Id"],
  "Study Sessions": ["Id", "Category", "Subject Id", "Subject", "Topic Id", "Topic", "Status", "Segments", "Note", "Updated At"],
  "Settings": ["Id", "Value"]
};

/** Request plumbing that must never be written into a cell. */
var NON_DATA_KEYS = { domain: true, sheetName: true, id1: true, id2: true };

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalizeKey(header) {
  return header === null || header === undefined ? "" : header.toString().toLowerCase().replace(/[\s_]+/g, "");
}

function resolveSheet(name, createIfKnown) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet && createIfKnown && KNOWN_TABS[name]) {
    var headers = KNOWN_TABS[name];
    sheet = spreadsheet.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  if (!sheet) throw new Error("Sheet '" + name + "' not found");
  return sheet;
}

/** Appends any KNOWN_TABS header missing from row 1 of a known tab (never reorders). */
function ensureColumns(sheet, name) {
  var wanted = KNOWN_TABS[name];
  if (!wanted) return;
  var lastCol = sheet.getLastColumn();
  var present = {};
  if (lastCol > 0) {
    var row = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    for (var i = 0; i < row.length; i++) present[normalizeKey(row[i])] = true;
  }
  var missing = [];
  for (var j = 0; j < wanted.length; j++) {
    if (!present[normalizeKey(wanted[j])]) missing.push(wanted[j]);
  }
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]).setFontWeight("bold");
  }
}

/* ------------------------------------------------------------------ READ */

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action !== "read") {
    return json({ status: "success", message: "Google Apps Script Web App is active and healthy." });
  }
  try {
    var name = params.sheet || "Sheet1";
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
    if (!sheet) {
      if (KNOWN_TABS[name]) return json({ status: "success", rows: [], missing: true, version: SCRIPT_VERSION });
      throw new Error("Sheet '" + name + "' not found");
    }
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var rows = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues() : [];
    return json({ status: "success", rows: rows, version: SCRIPT_VERSION });
  } catch (err) {
    return json({ status: "error", message: err.toString(), version: SCRIPT_VERSION });
  }
}

/* ----------------------------------------------------------------- WRITE */

/** Extra column titles a payload field may also be written to. */
var COLUMN_ALIASES = { links: ["link"] };

function serialize(field, value) {
  if (value === null || value === undefined) return "";
  if (field === "is_subject") return value === true || value === "TRUE" ? "TRUE" : "FALSE";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error("No postData received");

    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var payload = request.payload;
    if (!action || !payload) throw new Error("Missing action or payload");

    var domain = request.domain || payload.domain || "BCS";
    var sheetName = request.sheetName || (domain === "IT" ? "IT" : "Sheet1");

    lock.waitLock(30000);

    var sheet = resolveSheet(sheetName, true);
    ensureColumns(sheet, sheetName);
    var lastCol = sheet.getLastColumn();
    if (lastCol < 1) throw new Error("Target sheet has no columns");

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var colOf = {};
    for (var i = 0; i < headers.length; i++) {
      var key = normalizeKey(headers[i]);
      if (key && colOf[key] === undefined) colOf[key] = i; // 0-based
    }

    function findRow(id) {
      var idCol = colOf["id"];
      var lastRow = sheet.getLastRow();
      if (idCol === undefined || lastRow < 2) return -1;
      var target = String(id).trim();
      var ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getDisplayValues();
      for (var r = 0; r < ids.length; r++) {
        if (String(ids[r][0]).trim() === target) return r + 2;
      }
      return -1;
    }

    /**
     * Writes only the cells for fields present in the payload; every other cell
     * in the row (including anything the app doesn't know about) is untouched.
     */
    function writeRow(rowNum, data) {
      for (var field in data) {
        if (!Object.prototype.hasOwnProperty.call(data, field) || NON_DATA_KEYS[field]) continue;
        var keys = [normalizeKey(field)].concat(COLUMN_ALIASES[field] || []);
        for (var k = 0; k < keys.length; k++) {
          var col = colOf[keys[k]];
          if (col === undefined) continue;
          var cell = sheet.getRange(rowNum, col + 1);
          cell.setNumberFormat("@");
          cell.setValue(serialize(field, data[field]));
          break; // write each field to one column only
        }
      }
    }

    if (action === "CREATE") {
      if (!payload.id) throw new Error("Payload missing 'id' for CREATE");
      if (findRow(payload.id) !== -1) throw new Error("Row with ID " + payload.id + " already exists");
      var nextRow = sheet.getLastRow() + 1;
      writeRow(nextRow, payload);
      SpreadsheetApp.flush();
      return json({ status: "success", action: action, message: "Created row " + nextRow });
    }

    if (action === "UPDATE") {
      if (!payload.id) throw new Error("Payload missing 'id' for UPDATE");
      var rowNum = findRow(payload.id);
      if (rowNum === -1) throw new Error("Row with ID " + payload.id + " not found");
      writeRow(rowNum, payload);
      SpreadsheetApp.flush();
      return json({ status: "success", action: action, message: "Updated row " + rowNum });
    }

    if (action === "DELETE") {
      if (!payload.id) throw new Error("Payload missing 'id' for DELETE");
      var delRow = findRow(payload.id);
      if (delRow === -1) throw new Error("Row with ID " + payload.id + " not found");
      sheet.deleteRow(delRow);
      SpreadsheetApp.flush();
      return json({ status: "success", action: action, message: "Deleted row " + delRow });
    }

    if (action === "SWAP") {
      if (!payload.id1 || !payload.id2) throw new Error("Payload missing 'id1' or 'id2' for SWAP");
      var row1 = findRow(payload.id1);
      var row2 = findRow(payload.id2);
      if (row1 === -1 || row2 === -1) throw new Error("One or both rows not found");
      var range1 = sheet.getRange(row1, 1, 1, lastCol);
      var range2 = sheet.getRange(row2, 1, 1, lastCol);
      var values1 = range1.getValues();
      var values2 = range2.getValues();
      range1.setValues(values2);
      range2.setValues(values1);
      SpreadsheetApp.flush();
      return json({ status: "success", action: action, message: "Swapped rows " + row1 + " and " + row2 });
    }

    throw new Error("Unsupported action: " + action);
  } catch (err) {
    return json({ status: "error", message: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch (ignored) {}
  }
}
