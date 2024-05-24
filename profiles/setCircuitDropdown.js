function setCircuitTypeDropdown() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  // const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Access the index sheet and read the required data
  const indexSheet = spreadsheet.getSheetByName('sites_in_automation');
  const data = indexSheet.getRange(2, 1, indexSheet.getLastRow()-1, 3).getValues(); // Adjust range according to actual data start row

  const lastRow = indexSheet.getLastRow();
  var allowedValues = ['chillerc', 'pcwc', 'scwc', 'condc'];
  for (let i = 0; i < lastRow; i++) {
    const row = data[i];
  // data.forEach(row => {
    const siteId = row[1];


    if (siteId === "suh-hyd") {
      console.log("Skipping siteId:", siteId);
      continue; // Skip the rest of the loop for this iteration
    }
    const sheetName = siteId + '_config';
    const sheet = spreadsheet.getSheetByName(sheetName);
    console.log(`Working on sheet : ${sheetName}`);
    if (sheet) {
  // var sheet = spreadsheet.getSheetByName("Copy of aph-ahm_config");
  

      
      var dataRange = sheet.getDataRange();
      var values = dataRange.getValues();
      var headers = values[0];

      // Find the index of the "circuit type" column
      var circuitTypeIndex = headers.indexOf("circuit type");
      if (circuitTypeIndex === -1) {
        console.error("Circuit type column not found");
        return;
      }

      // Loop through the column and set data validation
      for (var j = 1; j < values.length; j++) {
        var cell = sheet.getRange(j + 1, circuitTypeIndex + 1); // 1-based index
        var existingValue = values[j][circuitTypeIndex];
        
        // Create the data validation rule
        var rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(allowedValues)
          .setAllowInvalid(false)
          .build();
        
        // Apply the data validation rule to the cell
        cell.setDataValidation(rule);

        // Set the existing value as the default selected value
        if (allowedValues.includes(existingValue)) {
          cell.setValue(existingValue);
        } else {
          cell.setValue('');
        }
      }
  }
  }
}