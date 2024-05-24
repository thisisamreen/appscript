function validateAssetSelectionByName(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    console.log("Sheet not found: " + sheetName);
    return;
  }
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
  var deviceTypeToCheck = {};
  var invalidAssets = [];

  // Step 1: Identify device types that require validation
  values.slice(1).forEach(function(row) { // Skip header row
    
    var operationalStatus = String(row[columnIndex['Operational status']]).toLowerCase() === 'true';
    var assetSelectionEnabled = String(row[columnIndex['asset_selection_enabled']]).toLowerCase() === 'true';
    
    if (operationalStatus && assetSelectionEnabled) {
      var deviceType = row[columnIndex['device type']];
      deviceTypeToCheck[deviceType] = true;
    }
  });
  
 // Step 2: Validate all assets for the identified device types
  values.slice(1).forEach(function(row) { // Skip header row
    var deviceType = row[columnIndex['device type']];
    var operationalStatus = String(row[columnIndex['Operational status']]).toLowerCase() === 'true';
    var assetSelectionEnabled = String(row[columnIndex['asset_selection_enabled']]).toLowerCase() === 'true';
    
    if (deviceTypeToCheck[deviceType] && operationalStatus && !assetSelectionEnabled) {
      var assetName = row[columnIndex['Asset name']];
      invalidAssets.push(assetName);
    }

  });
  console.log("Sheet NAme is "+sheetName);
  var sitesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("sites_in_automation");
  var headerRow = sitesSheet.getRange(1, 1, 1, sitesSheet.getLastColumn()).getValues()[0];
  var errorColumnIndex = headerRow.indexOf('Errors in config') + 1; // Find the "Error" column index. Add 1 because arrays are 0-based 
  var sitesRange = sitesSheet.getDataRange(); // Adjust if not using the whole range
  var sitesValues = sitesRange.getValues();

  // Iterate over the "Site-Names" column to find "suh-hyd"
  var errorMessage = invalidAssets.length > 0 ? "Asset Selection must be enabled for all assets of an asset type.Discrepancy found for: " + invalidAssets.join(", ") : "valid";
  for (var i = 0; i < sitesValues.length; i++) {
    // console.log("siteValues[i][1]:"+sitesValues[i][1]);
    if (sitesValues[i][1] === sheetName.replace('_config', '')) { 
      sitesSheet.getRange(i + 1, errorColumnIndex).setValue(errorMessage); // Adjust column index as necessary
      break; // Exit loop after updating
    }
  }
}

function validateAllSites() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    if (sheetName.endsWith('_config')) { // Checks if the sheet name follows the naming convention
      console.log("working on sheet : "+sheet.getName())
      validateAssetSelectionByName(sheetName);
      
    }
  });
}


function reportErrors(invalidAssets, sheetName) {
  console.log("inside report Error");

}


// function onOpen() {
//   var ui = SpreadsheetApp.getUi();
//   // Creates a custom menu in the Google Sheets UI
//   ui.createMenu('Asset-Selection Validation')
//     .addItem('Validate All Sites', 'validateAllSites') // Adds an item to run validateAllSites
//     .addToUi(); // Adds the menu to the UI
// }

