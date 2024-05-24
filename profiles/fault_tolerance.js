function addFaultToleranceColumn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Access the index sheet and read the required data
  const indexSheet = ss.getSheetByName('sites_in_automation');
  const data = indexSheet.getRange(2, 1, indexSheet.getLastRow()-1, 3).getValues(); // Adjust range according to actual data start row
  
  let count = 0;
  data.forEach(row => {
    const siteName = row[0];
    const siteId = row[1];
    const deploymentStatus = row[2];
    if (count>8){
      return;
    }
    // Check if the deployment status is not JOB_COMPLETED
    if (deploymentStatus !== 'JOB_COMPLETED') {
      const sheetName = siteId + '_config';
      const sheet = ss.getSheetByName(sheetName);
      
      if (sheet) {
        console.log(' Sheet name ' + sheetName);
        const rule = SpreadsheetApp.newDataValidation()
                                  .requireValueInList(['TRUE', 'FALSE'], true)
                                  .build();

        // Insert a new column at the fourth position
        sheet.insertColumnBefore(4);

        sheet.getRange(1, 4).setValue('fault tolerance');
        
        const range = sheet.getRange(2, 4, sheet.getMaxRows()-1);
 
        range.setDataValidation(rule);
        range.setValue('FALSE'); // Initialize all cells in the column as 'False'
        
        count = count+1;
        mergeFaultToleranceCells(sheet);
        console.log("Merging done");
      }
    }
  });
}

function mergeFaultToleranceCells(sheet) {
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange('C2:C' + lastRow).getValues(); // Fetch device types from column C
  let startRow = 2; // Start merging from the second row

  for (let i = 1; i <= data.length; i++) {
    // Check if it's the last row or the next row has a different device type
    const isLastRow = (i === data.length);
    const isDifferentDeviceType = (i < data.length && data[i][0] !== data[i - 1][0]);
    
    if (isLastRow || isDifferentDeviceType) {
      const rowsToMerge = i - startRow + (isLastRow ? 1 : 0); // Consider last row if needed
      if (rowsToMerge > 1) { // There is more than one row to merge
        const mergeRange = 'D' + (startRow+1) + ':D' + (startRow+1 + rowsToMerge );
        sheet.getRange(mergeRange).mergeVertically();
        console.log('Merging range: ' + mergeRange); // Log the range being merged
      }
      startRow = i + 1; // Reset startRow to the next row after the current group
    }
  }
}
