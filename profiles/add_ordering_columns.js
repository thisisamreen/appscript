function addOrderingColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Access the index sheet and read the required data
  const indexSheet = ss.getSheetByName('sites_in_automation');
  const data = indexSheet.getRange(2, 1, indexSheet.getLastRow()-1, 3).getValues(); // Adjust range according to actual data start row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
  // data.forEach(row => {
    const siteId = row[1];


    if (siteId === "suh-hyd" || siteId === "aph-ban") {
      console.log("Skipping siteId:", siteId);
      continue; // Skip the rest of the loop for this iteration
    }
    const sheetName = siteId + '_config';
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      deleteSpecificColumns(sheet);

      console.log(' Sheet name ' + sheetName);
      
      const lastColumn = sheet.getLastColumn();

      // Add new columns
      sheet.insertColumnAfter(lastColumn); // For ordering_criteria
      sheet.insertColumnAfter(lastColumn + 1); // For ordering_params

      // Set headers for the new columns
      const criteriaHeaderCell = sheet.getRange(1, lastColumn + 1);
      criteriaHeaderCell.setValue("ordering_criteria");

      const paramsHeaderCell = sheet.getRange(1, lastColumn + 2);
      paramsHeaderCell.setValue("ordering_params");

      const valuesHeaderCell = sheet.getRange(1, lastColumn + 3);
      valuesHeaderCell.setValue("ordering_values");
      var unmergedData = unmergeData(sheet); 
      // Apply dropdown data validation for ordering_criteria
      setupDropdownForCriteria(sheet, lastColumn + 1,unmergedData);
      setupDefaultParams(sheet, lastColumn + 2,unmergedData);
      setupDefaultValues(sheet, lastColumn + 3,unmergedData);
      
      const orderingColumns = ["ordering_criteria", "ordering_params", "ordering_values"];
      for (let i = orderingColumns.length - 1; i >= 0; i--) {
          mergeColumnsBasedOnDeviceType(sheet,orderingColumns[i]);
        }

    }
  }
    }
    

function setupDropdownForCriteria(sheet, column,unmergedData) {
  const dropdownRange = sheet.getRange(2, column, sheet.getLastRow()-1); // Start from row 2
  const criteria = ["AscendingParameter", "DescendingParameter"];
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(criteria, true).build();
  dropdownRange.setDataValidation(rule);
  dropdownRange.setValue("AscendingParameter");
}
function setupDefaultParams(sheet, column, unmergedData) {
  const paramsRange = sheet.getRange(2, column, sheet.getLastRow()- 1);
  const defaultValue = "[(param_name, weight)]"; // Adjust the default value format as necessary
  paramsRange.setValue(defaultValue); // Set the default value for all cells in the column
 
}
function setupDefaultValues(sheet, column, unmergedData) {
  const paramsRange = sheet.getRange(2, column, sheet.getLastRow() - 1);
  const defaultValue = "[(run_minutes, 1)]"; // Adjust the default value format as necessary
  paramsRange.setValue(defaultValue); // Set the default value for all cells in the column
}

function findColumnLetter(headers, columnName) {
  const columnIndex = headers.indexOf(columnName);
  const columnLetter = columnIndexToLetter(columnIndex + 1);
  return columnLetter;
}

function columnIndexToLetter(columnIndex) {
  let columnLetter = '';
  while (columnIndex > 0) {
    const modulo = (columnIndex - 1) % 26;
    columnLetter = String.fromCharCode(65 + modulo) + columnLetter;
    columnIndex = Math.floor((columnIndex - modulo) / 26);
  }
  return columnLetter;
}

// function mergeCells(sheet,columnName,unmergedData) {
//   const headers = sheet.getRange("1:1").getValues()[0];
//   const lastRow = sheet.getLastRow();
//   const columnLetter = findColumnLetter(headers,columnName)



//   const data = sheet.getRange('C2:C' + lastRow).getValues(); // Fetch device types from column C
//   let startRow = 2; // Start merging from the second row

//   for (let i = 1; i <= data.length; i++) {
//     // Check if it's the last row or the next row has a different device type
//     const isLastRow = (i === data.length);
//     const isDifferentDeviceType = (i < data.length && data[i][0] !== data[i - 1][0]);
    
//     if (isLastRow || isDifferentDeviceType) {
//       const rowsToMerge = i - startRow + (isLastRow ? 1 : 0); // Consider last row if needed
//       if (rowsToMerge > 1) { // There is more than one row to merge
//         const mergeRange = columnLetter + (startRow+1) + ':' +columnLetter + (startRow+1 + rowsToMerge );
//         sheet.getRange(mergeRange).mergeVertically();
//         console.log('Merging range: ' + mergeRange); // Log the range being merged
//       }
//       startRow = i + 1; // Reset startRow to the next row after the current group
//     }
//   }
// }

function mergeColumnsBasedOnDeviceType(sheet, columnName) {
    const headers = sheet.getRange("1:1").getValues()[0];
    const deviceTypeIndex = headers.indexOf("device type") + 1; // Get 1-based index of device type
    const columnLetter = findColumnLetter(sheet, columnName);
    const lastRow = sheet.getLastRow();
    const deviceTypeRange = sheet.getRange(2, deviceTypeIndex, lastRow - 1); // Range of device types starting from row 2
    const deviceTypeMerges = deviceTypeRange.getMergedRanges(); // Get all merged ranges in the device type column

    // Loop through each merged range in the device type column
    deviceTypeMerges.forEach(merge => {
        const startRow = merge.getRow(); // Start of the merged range
        const numRows = merge.getNumRows(); // Number of rows merged
        const endRow = startRow + numRows - 1; // End of the merged range

        // Apply the same merging to the specified column
        const mergeRange = sheet.getRange(columnLetter + startRow + ':' + columnLetter + endRow);
        mergeRange.mergeVertically();
        console.log('Merging ' + columnName + ' from ' + columnLetter + startRow + ' to ' + columnLetter + endRow);
    });
}

function deleteSpecificColumns(sheet) {
  // const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Assets"); // Adjust the sheet name as necessary
  const headers = sheet.getRange("1:1").getValues()[0]; // Get all headers from the first row
  const columnsToDelete = ["ordering_criteria", "ordering_params", "ordering_values","fault tolerance", "selection_param","selection_value"];

  // Reverse loop to handle deletion from right to left to avoid index shifting issues
  for (let i = headers.length - 1; i >= 0; i--) {
    if (columnsToDelete.includes(headers[i])) {
      sheet.deleteColumn(i + 1); // Adjust because array is 0-indexed but columns are 1-indexed
    }
  }
}

function findColumnLetter(sheet, columnName) {
    const headers = sheet.getRange("1:1").getValues()[0];
    const columnIndex = headers.indexOf(columnName) + 1; // Adding 1 because columns are 1-indexed in Sheets
    return columnIndexToLetter(columnIndex);
}

function columnIndexToLetter(columnIndex) {
    let columnLetter = '';
    while (columnIndex > 0) {
        const modulo = (columnIndex - 1) % 26;
        columnLetter = String.fromCharCode(65 + modulo) + columnLetter;
        columnIndex = Math.floor((columnIndex - modulo) / 26);
    }
    return columnLetter;
}


function unmergeData(sheet){
  var range = sheet.getDataRange(); 
  var values = range.getValues();
  var headers = values[0]; // Assuming the first row contains headers
  var columnIndex = {};
  headers.forEach(function(name, index) {
    columnIndex[name] = index;
  });
  for (var col = 0; col < headers.length; col++) {
    var lastValue = null;
    for (var row = 1; row < values.length; row++) {
      if (values[row][col] !== '') {
        lastValue = values[row][col];
      } else if (lastValue !== null) {
        values[row][col] = lastValue;
      }
    }
  }
  return values;
}