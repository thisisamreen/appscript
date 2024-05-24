function validateAllSchedules() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  sheets.forEach(function(sheet) {
    var sheetName = sheet.getName();
    if (sheetName.endsWith("_asset_selection")) { 
      console.log("working on sheet:"+sheetName)
      validateAndFillSchedule(ss.getSheetByName(sheetName));
    }
  });
}


function validateAndFillSchedule(sheet) {
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  
  // Initialize empty object for each asset type
  var invalidAssets = {};

  // Fill "merged" cells for all columns (assuming the first 4 columns)
  for (var col = 0; col < 4; col++) {
    var lastValue = null;
    for (var row = 1; row < values.length; row++) {
      if (values[row][col] !== '') {
        lastValue = values[row][col];
      } else if (lastValue !== null) {
        values[row][col] = lastValue;
      }
    }
  }

  // Continue with the validation logic...
  validateSchedules(values, invalidAssets);
  var sheetName = sheet.getName();
  // Log or handle invalid assets...
  reportErrors(invalidAssets, sheetName);
}

function validateSchedules(values, invalidAssets) {
  var scheduleMap = {}; //store the total scheduled minutes for each asset type and day
  // Construct scheduleMap and invalidAssets, using dynamic values
  var lastProcessed = {}; // Track the last processed start and stop times for each asset type and day

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var assetType = row[0];
    var day = row[1];
    var startTime = row[2]; // Already a Date object
    var stopTime = row[3]; // Already a Date object
    var timeKey = startTime.toString() + '-' + stopTime.toString(); // Unique key for start-stop time combination

    if (!scheduleMap[assetType]) {
      scheduleMap[assetType] = {};
      lastProcessed[assetType] = {};
    }
    if (!scheduleMap[assetType][day]) {
      scheduleMap[assetType][day] = 0;
      lastProcessed[assetType][day] = '';
    }

    // Check if the current row's times are the same as the last processed times for this asset type and day
    if (lastProcessed[assetType][day] !== timeKey) {
      var minutesScheduled = calculateMinutes(startTime, stopTime);
      scheduleMap[assetType][day] += minutesScheduled;
      lastProcessed[assetType][day] = timeKey; // Update the last processed time key
    }
  }
  // Validate the schedules for each asset type and day
  for (var asset in scheduleMap) {
    for (var day in scheduleMap[asset]) {
      if (scheduleMap[asset][day] < 1439) {
        if (!invalidAssets[asset]) {
          invalidAssets[asset] = []; // Initialize as an empty array if it doesn't exist
        }
        invalidAssets[asset].push(day);
        Logger.log(asset + ' on ' + day + ' is scheduled for less than 1439 minutes: ' + scheduleMap[asset][day] + ' minutes');
      }
    }
  }
}


function reportErrors(invalidAssets, sheetName) {
  var sitesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("sites_in_automation");
  var headerRow = sitesSheet.getRange(1, 1, 1, sitesSheet.getLastColumn()).getValues()[0];
  var errorColumnIndex = headerRow.indexOf('Errors in asset selection') + 1; // Find the "Error" column index. Add 1 because arrays are 0-based but Sheets columns are 1-based.
  if (errorColumnIndex <= 0) {
    console.log("'Error' column was not found.");
    return; // Exit if the "Error" column does not exist.
  }
  
  console.log("sheet name is :"+ sheetName);
  var sitesRange = sitesSheet.getDataRange(); // Adjust if not using the whole range
  var sitesValues = sitesRange.getValues();
  var errorMessagelist = [];
  // Iterate over the "Site-Names" column to find "suh-hyd"
  var errorMessage = "";
  
  for (var i = 0; i < sitesValues.length; i++) {
    
    if (sitesValues[i][1] === sheetName.replace('_asset_selection', '')) { // Assuming "Site-Names" is in the second column
      console.log("These are invalid:"+invalidAssets)
      // Write the error message in the "Error" column, assumed to be column B
      for (var asset in invalidAssets) {
    // for (var day in scheduleMap[asset]) {
        errorMessage = asset + ' on ' + invalidAssets[asset] + ' is scheduled for less than 1439 minutes';
        errorMessagelist.push(errorMessage);
        console.log("error msg:"+errorMessage);
      }
      sitesSheet.getRange(i + 1, errorColumnIndex).setValue(errorMessagelist);

       // Adjust column index as necessary
      break; // Exit loop after updating
    }
    else {
      continue;
    }
  }
}

// Helper function to calculate the difference in minutes between two times
function calculateMinutes(startTime, stopTime) {
  var startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  var stopMinutes = stopTime.getHours() * 60 + stopTime.getMinutes();
  
  var diff = stopMinutes - startMinutes;
  if (diff < 0) { diff += 1440; } // Adjust for overnight schedules
  return diff;
}
// function onOpen() {
//   var ui = SpreadsheetApp.getUi();
//   // Creates a custom menu in the Google Sheets UI
//   ui.createMenu('Schedule Validation')
//     .addItem('Validate All Sites', 'validateAllSchedules') // Adds an item to run validateAllSites
//     .addToUi(); // Adds the menu to the UI
// }

