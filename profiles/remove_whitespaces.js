function trimTrailingWhitespaces() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const indexSheet = ss.getSheetByName('sites_in_automation');

  if (!indexSheet) {
    console.log("'sites_in_automation' sheet not found");
    return;
  }

  // Get site IDs and deployment status
  const range = indexSheet.getRange(2, 1, indexSheet.getLastRow() - 1, 3);
  const data = range.getValues();
  const sheetsToProcess = [];

  // Identify sheets to process
  data.forEach(row => {
    const siteId = row[1];
    const deploymentStatus = row[2];
    if (deploymentStatus !== "JOB_COMPLETED") {
      sheetsToProcess.push(siteId + "_config"); // Adjust based on your naming pattern
    }
  });

  // Process each identified sheet
  // sheetsToProcess.forEach(sheetName => {
  for (let i = 0; i < sheetsToProcess.length; i++) {
    const sheetName = sheetsToProcess[i];
    const sheet = ss.getSheetByName(sheetName);
    console.log(`working on sheet: ${sheetName}`);
    if (sheet) {
      const range = sheet.getDataRange();
      const values = range.getValues();
      const updatedValues = values.map(row => {
        console.log(`the row is : ${row}`)
        return row.map(cell => {
          if (typeof cell === 'string') {
            
            console.log(`the  value is : ${cell}!`)
            var trimmed_cell = cell.trimEnd()
            console.log(`the updated value is : ${trimmed_cell}!`)
            return trimmed_cell; // Remove trailing whitespace
          }
          return cell; // Return cell as is if it's not a string
        });
      });

      range.setValues(updatedValues); // Update the range with trimmed values
      console.log(`Processed sheet: ${sheetName}`);
    
    } else {
      console.log(`Sheet not found: ${sheetName}`);
    }
  };
}

