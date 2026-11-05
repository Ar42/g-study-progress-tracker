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
 */

var IT_HEADERS = ["Id", "Name", "Status", "Comments", "Started Date", "Target To Complete Date", "Completed Date", "Links"];

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function normalizeKey(header) {
  return header === null || header === undefined ? "" : header.toString().toLowerCase().replace(/[\s_]+/g, "");
}

function resolveSheet(name, createIfIT) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet && name === "IT" && createIfIT) {
    sheet = spreadsheet.insertSheet("IT");
    sheet.getRange(1, 1, 1, IT_HEADERS.length).setValues([IT_HEADERS]);
  }
  if (!sheet) throw new Error("Sheet '" + name + "' not found");
  return sheet;
}

/* ------------------------------------------------------------------ READ */

function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.action !== "read") {
    return json({ status: "success", message: "Google Apps Script Web App is active and healthy." });
  }
  try {
    var sheet = resolveSheet(params.sheet || "Sheet1", false);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var rows = lastRow > 0 && lastCol > 0 ? sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues() : [];
    return json({ status: "success", rows: rows });
  } catch (err) {
    return json({ status: "error", message: err.toString() });
  }
}

/* ----------------------------------------------------------------- WRITE */

// payload field → normalised sheet header(s)
var FIELD_COLUMNS = {
  id: ["id"],
  name: ["name"],
  parentId: ["parentid"],
  status: ["status"],
  preliMarks: ["prelimarks"],
  comments: ["comments"],
  startedDate: ["starteddate"],
  targetToCompleteDate: ["targettocompletedate"],
  completedDate: ["completeddate"],
  links: ["links", "link"],
  is_subject: ["issubject"]
};

function serialize(field, value) {
  if (value === null || value === undefined) return "";
  if (field === "links") return typeof value === "string" ? value : JSON.stringify(value);
  if (field === "is_subject") return value === true || value === "TRUE" ? "TRUE" : "FALSE";
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
      for (var field in FIELD_COLUMNS) {
        if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
        var aliases = FIELD_COLUMNS[field];
        for (var a = 0; a < aliases.length; a++) {
          var col = colOf[aliases[a]];
          if (col === undefined) continue;
          var cell = sheet.getRange(rowNum, col + 1);
          cell.setNumberFormat("@");
          cell.setValue(serialize(field, data[field]));
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
