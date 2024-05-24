//add documentation

function onEditDeploymentStatus(e){
  const activeSheet = e.source.getActiveSheet(); 
  var editedRange = e.range;
  var sheet = editedRange.getSheet();
  var editedRow = editedRange.getRow();
  var editedCol = editedRange.getColumn();

  // Check if the edit was made in the 'sites_in_automation' sheet and in the 'deployment_status' column
  if (sheet.getName() === 'sites_in_automation' && editedCol === 3) {  

    var newValue = editedRange.getValue();
    var siteId = sheet.getRange(editedRow, 2).getValue(); 

      switch(newValue) {
        case 'validate_profile':
          console.log(`Triggering validation for site: ${siteId}`);
          validateForSite(siteId,editedRow);
          break;

    }
  }
}


function validateForSite(siteId,editedRow) {
  
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  var sitesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("sites_in_automation");
  var errorMessagelist = [];
  sitesSheet.getRange(editedRow, 3).setValue('validating');

  validateAndFillSchedule(spreadsheet,siteId,errorMessagelist);
  validateAssetSelection(spreadsheet,siteId,errorMessagelist);
  validateParamsForOperationalAssets(spreadsheet,siteId,errorMessagelist);
  validateOrderingValues(spreadsheet, siteId,errorMessagelist);

  removeWhitespaces(spreadsheet,siteId,errorMessagelist);
  validateSafetyNet(spreadsheet,siteId);
  // validateOptimizationParameters(spreadsheet,siteId,errorMessagelist);
  const errorMessages = errorMessagelist.join('\n');

  sitesSheet.getRange(editedRow , 5).setValue(errorMessages);
  // Update deployment status based on errors
  const statusCell = sitesSheet.getRange(editedRow, 3);
  if (errorMessagelist.length === 0) {
    statusCell.setValue('validated');
  } else {
    statusCell.setValue('validation_failed');
  }
}


function highlightCellWithError(sheet, rowIndex, colIndex, errorMessage) {
  const cell = sheet.getRange(rowIndex + 1, colIndex + 1); // 1-based index
  cell.setBackground("yellow");
  cell.setNote(errorMessage);
  console.log(`Note added at row ${rowIndex + 1}, column ${colIndex + 1} with message: ${errorMessage}`);
}
  function validateAndFillSchedule(spreadsheet,siteId,errorMessagelist) {
    var sheetName = `${siteId}_asset_selection`;
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      console.log(`Sheet ${sheetName} not found`);
      return;
    }
    var dataRange = sheet.getDataRange();
    var values = dataRange.getValues();
    
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
    console.log("validating asset schedules");
    validateSchedules(sheet,values, invalidAssets);
    errorMessagelist = reportErrors(invalidAssets, sheetName,errorMessagelist);
    return errorMessagelist;
    
  }

  function calculateMinutes(startTime, stopTime){
    var startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    var stopMinutes = stopTime.getHours() * 60 + stopTime.getMinutes();
    
    var diff = stopMinutes - startMinutes;
    if (diff < 0) { diff += 1440; } // Adjust for overnight schedules
    return diff;
  }

  function validateSchedules(sheet,values, invalidAssets) {
    var scheduleMap = {}; //store the total scheduled minutes for each asset type and day
    // Construct scheduleMap and invalidAssets, using dynamic values
    var lastProcessed = {}; // Track the last processed start and stop times for each asset type and day
    // Clear previous highlights and notes
    const dataRange = sheet.getDataRange();
    clearHighlightsAndNotes(sheet, dataRange);
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var assetType = row[0];
      var day = row[1];
      var startTime = row[2]; // Already a Date object
      var stopTime = row[3]; 
      // var startTime = parseDate(row[2]);
      // var stopTime = parseDate(row[3]);
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
            invalidAssets[asset] = []; 
          }
          invalidAssets[asset].push(day);
          for (let i = 1; i < values.length; i++) {
            if (values[i][0] === asset && values[i][1] === day) {
              const errorMessage = `Error: Schedule for ${asset} on ${day} is less than 1439 minutes`;
              highlightMergedCells( sheet, i, 2, errorMessage); // Highlight start time
              highlightMergedCells( sheet, i, 3, errorMessage); // Highlight stop time
          
          }
          }
      }
    }
  }
  }

  function parseDate(input) {
    if (input instanceof Date) {
      return input; 
    }
    var date = new Date(input);
    if (!isNaN(date.getTime())) {
      return date; 
    }
    throw new Error('Invalid date: ' + input);  
  }
  function highlightMergedCells(sheet, rowIndex, colIndex, errorMessage) {
    const cell = sheet.getRange(rowIndex + 1, colIndex + 1); // 1-based index
    const mergedRanges = cell.getMergedRanges();
    if (mergedRanges.length > 0) {
      const range = mergedRanges[0];
      if (errorMessage) {
        range.setBackground("yellow");
        range.setNote(errorMessage);
      } else {
        range.setBackground(null);
        range.clearNote();
      }
    } else {
      if (errorMessage) {
        cell.setBackground("yellow");
        cell.setNote(errorMessage);
      } else {
        cell.setBackground(null);
        cell.clearNote();
      }
    }
  }
  function clearHighlightsAndNotes(sheet, range) {
    range.setBackground(null);
    range.setNote('');
  }

  function reportErrors(invalidAssets, sheetName,errorMessagelist) {
    var sitesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("sites_in_automation");
 
    var sitesRange = sitesSheet.getDataRange(); 
    var sitesValues = sitesRange.getValues();
    var errorMessage = "";
    
    for (var i = 0; i < sitesValues.length; i++) {
      
      if (sitesValues[i][1] === sheetName.replace('_asset_selection', '')) { 
        for (var asset in invalidAssets) {
          errorMessage = asset + ' on ' + invalidAssets[asset] + ' is scheduled for less than 1439 minutes';
          errorMessagelist.push(errorMessage);
        }
        break; 
      }
      
        continue;
      
    }
    
    return errorMessagelist;
  }

function validateAssetSelection(spreadsheet,siteId,errorMessagelist) {
  var sheetName = `${siteId}_config`;
  var sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    console.log("Sheet not found: " + sheetName);
    return;
  }
  
  var range = sheet.getDataRange(); 
  clearHighlightsAndNotes(sheet, range);

  var values = range.getValues();
  var headers = values[0]; 
  var columnIndex = {};
  headers.forEach(function(name, index) {
    columnIndex[name] = index;
  });
  console.log("validating asset_selection_enabled for operational assets");
  var errorMessage = "";
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

    // values.slice(1).forEach(function(row) { // Skip header row
    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) { // Skip header row
      var row = values[rowIndex];
      
      var operationalStatus = String(row[columnIndex['Operational status']]).toLowerCase() === 'true';
      var assetSelectionEnabled = String(row[columnIndex['asset_selection_enabled']]).toLowerCase() === 'true';
      
      if (operationalStatus && assetSelectionEnabled) {
        var deviceType = row[columnIndex['device type']];
        deviceTypeToCheck[deviceType] = true;
      }
    }
    
    // values.slice(1).forEach(function(row) { // Skip header row
    for (let rowIndex = 1; rowIndex < values.length; rowIndex++) { // Skip header row
      var row = values[rowIndex];
      var deviceType = row[columnIndex['device type']];
      var operationalStatus = String(row[columnIndex['Operational status']]).toLowerCase() === 'true';
      var assetSelectionEnabled = String(row[columnIndex['asset_selection_enabled']]).toLowerCase() === 'true';
      
      if (deviceTypeToCheck[deviceType] && operationalStatus && !assetSelectionEnabled) {
        var assetName = row[columnIndex['Asset name']];
        invalidAssets.push(assetName);
        errorMessage = "Asset Selection must be enabled for all assets of an asset type.";
        highlightCellWithError(sheet, rowIndex,columnIndex['asset_selection_enabled'], errorMessage);
      }

    }
    if (invalidAssets.length > 0) {
      var errorMessage = "Asset Selection must be enabled for all assets of an asset type. Discrepancy found for: " + invalidAssets.join(", ");
      errorMessagelist.push(errorMessage);
      } 
    // errorMessage = invalidAssets.length > 0 ? "Asset Selection must be enabled for all assets of an asset type.Discrepancy found for: " + invalidAssets.join(", ") : "";
    // errorMessagelist.push(errorMessage);
  
  return errorMessagelist;
}

function removeWhitespaces(spreadsheet, siteId) {
  var sheetsToValidate = [
    `${siteId}_config`,
    `${siteId}_automation`,
    `${siteId}_asset_selection`
    ];
    sheetsToValidate.forEach(function(sheetName) {
      var sheet = spreadsheet.getSheetByName(sheetName);
      
      if (sheet) {
        const range = sheet.getDataRange();
        const values = range.getValues();
        const updatedValues = values.map(row => {
          return row.map(cell => {
            if (typeof cell === 'string') {
              return cell.trim(); // Remove trailing whitespace
            }
            return cell; // Return cell as is if it's not a string
          });
        });

        range.setValues(updatedValues);
        console.log(`Whitespace removed for sheet: ${sheetName}`);
      } else {
        console.log(`Sheet not found: ${sheetName}`);
      }
    });
}

