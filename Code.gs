function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Normalize headers to lowercase, remove spaces
  var headerMap = {};
  for (var i = 0; i < headers.length; i++) {
    var key = headers[i].toString().toLowerCase().replace(/\s+/g, "");
    headerMap[key] = i + 1; // 1-based index for column
  }
  
  // Parse payload
  var requestData;
  try {
    requestData = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Invalid JSON input: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var action = requestData.action;
  var payload = requestData.payload;
  
  if (!action || !payload) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Missing action or payload parameter"
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Find row by ID helper
  function findRowById(id) {
    var colIndex = headerMap["id"];
    if (!colIndex) return -1;
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return -1;
    var values = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
    for (var r = 0; r < values.length; r++) {
      if (values[r][0].toString().trim() === id.toString().trim()) {
        return r + 2; // 1-based sheet row index (accounting for header)
      }
    }
    return -1;
  }
  
  // Helper to map payload fields to sheet columns and set cells
  function writePayloadToRow(rowNum, data) {
    var fieldKeys = {
      "id": data.id,
      "name": data.name,
      "parentid": data.parentId,
      "status": data.status,
      "prelimarks": data.preliMarks,
      "comments": data.comments,
      "starteddate": data.startedDate,
      "targettocompletedate": data.targetToCompleteDate,
      "completeddate": data.completedDate,
      "links": typeof data.links === "object" ? JSON.stringify(data.links) : data.links
    };
    
    for (var key in fieldKeys) {
      var colNum = headerMap[key];
      if (colNum !== undefined && fieldKeys[key] !== undefined) {
        sheet.getRange(rowNum, colNum).setValue(fieldKeys[key]);
      }
    }
  }

  try {
    if (action === "CREATE") {
      if (!payload.id) {
        throw new Error("Payload missing 'id' for CREATE");
      }
      var existingRow = findRowById(payload.id);
      if (existingRow !== -1) {
        throw new Error("Row with ID " + payload.id + " already exists");
      }
      
      var nextRow = sheet.getLastRow() + 1;
      writePayloadToRow(nextRow, payload);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "CREATE",
        message: "Created row successfully at row " + nextRow
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === "UPDATE") {
      if (!payload.id) {
        throw new Error("Payload missing 'id' for UPDATE");
      }
      var rowNum = findRowById(payload.id);
      if (rowNum === -1) {
        throw new Error("Row with ID " + payload.id + " not found");
      }
      
      writePayloadToRow(rowNum, payload);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "UPDATE",
        message: "Updated row " + rowNum + " successfully"
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === "DELETE") {
      if (!payload.id) {
        throw new Error("Payload missing 'id' for DELETE");
      }
      var rowNum = findRowById(payload.id);
      if (rowNum === -1) {
        throw new Error("Row with ID " + payload.id + " not found");
      }
      
      sheet.deleteRow(rowNum);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "DELETE",
        message: "Deleted row " + rowNum + " successfully"
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else if (action === "SWAP") {
      // payload expects: { id1: "...", id2: "..." }
      var id1 = payload.id1;
      var id2 = payload.id2;
      
      if (!id1 || !id2) {
        throw new Error("Payload missing 'id1' or 'id2' for SWAP");
      }
      
      var row1 = findRowById(id1);
      var row2 = findRowById(id2);
      
      if (row1 === -1 || row2 === -1) {
        throw new Error("One or both rows not found: id1(" + id1 + ") at row " + row1 + ", id2(" + id2 + ") at row " + row2);
      }
      
      // Swap entire row values
      var range1 = sheet.getRange(row1, 1, 1, sheet.getLastColumn());
      var range2 = sheet.getRange(row2, 1, 1, sheet.getLastColumn());
      
      var values1 = range1.getValues()[0];
      var values2 = range2.getValues()[0];
      
      range1.setValues([values2]);
      range2.setValues([values1]);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "SWAP",
        message: "Swapped row " + row1 + " and row " + row2 + " successfully"
      })).setMimeType(ContentService.MimeType.JSON);
      
    } else {
      throw new Error("Unsupported action: " + action);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
