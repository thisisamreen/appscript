function reorderSiteSheets() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var siteInAutomationSheet = spreadsheet.getSheetByName('sites_in_automation');
  var siteIds = siteInAutomationSheet.getRange('B2:B' + siteInAutomationSheet.getLastRow()).getValues();
  
  // Flatten the array of arrays to a simple array
  siteIds = siteIds.flat();
  
  // Reverse the order to start moving sheets from the bottom to the top
  siteIds.reverse().forEach(function(siteId) {
    // Trim to remove any accidental whitespace
    siteId = siteId.trim();
    
    // Define the sheet names based on the site ID
    var sheetNames = [siteId + '_asset_selection',siteId + '_automation', siteId + '_config'];
    
    // Move each sheet to the first position
    sheetNames.forEach(function(sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        spreadsheet.setActiveSheet(sheet);
        spreadsheet.moveActiveSheet(1);
      }
    });
  });
  moveSheetToFirstPosition('sites_in_automation')
}

function moveSheetToFirstPosition(sheetName) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (sheet) {
    spreadsheet.setActiveSheet(sheet);
    spreadsheet.moveActiveSheet(1); // Move the active sheet to the first position
  } else {
    Logger.log("Sheet not found: " + sheetName);
  }
}
