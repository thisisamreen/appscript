function validateSafetyNet(spreadsheet,siteId) {
  console.log("validating saftey_net_enabled");
  const configSheet = spreadsheet.getSheetByName(`${siteId}_config`); // Adjust the sheet name as necessary
  const assetSelectionSheet = spreadsheet.getSheetByName(`${siteId}_asset_selection`); // Adjust the sheet name as necessary
  const configRange = configSheet.getDataRange();
  const configValues = configRange.getValues();
  
  const assetSelectionRange = assetSelectionSheet.getDataRange();
  const assetSelectionValues = assetSelectionRange.getValues();
  var headers = assetSelectionValues[0]; 
  var columnIndex = {};
  headers.forEach(function(name, index) {
    columnIndex[name] = index;
  });

  for (var col = 0; col < headers.length; col++) {
    var lastValue = null;
    for (var row = 1; row < assetSelectionValues.length; row++) {
      if (assetSelectionValues[row][col] !== '') {
        lastValue = assetSelectionValues[row][col];
      } else if (lastValue !== null) {
        assetSelectionValues[row][col] = lastValue;
      }
    }
  }


  // Assuming headers are in the first row and columns might be dynamic
  const faultToleranceIndex = configValues[0].indexOf("fault tolerance");
  const operationalStatusIndex = configValues[0].indexOf("Operational status");
  const deviceTypeIndex = configValues[0].indexOf("device type");
  const safetyNetEnabledIndex = assetSelectionValues[0].indexOf("safety_net_enabled");
  const dayIndex = assetSelectionValues[0].indexOf("Day");
  const assetSelectionDeviceTypeIndex = assetSelectionValues[0].indexOf("device type");

  if (faultToleranceIndex === -1 || operationalStatusIndex === -1 || safetyNetEnabledIndex === -1 || deviceTypeIndex === -1 || assetSelectionDeviceTypeIndex === -1) {
    Logger.log("One or more columns not found");
    return; // Exit the function if columns are not found
  }
  
  // Loop through the config sheet to get assets with both fault tolerance and operational status as TRUE
  for (let i = 1; i < configValues.length; i++) {
    const faultTolerance = configValues[i][faultToleranceIndex];
    const operationalStatus = configValues[i][operationalStatusIndex];
    const deviceType = configValues[i][deviceTypeIndex];
    if (faultTolerance === true && operationalStatus === true) {
      // Loop through asset selection sheet to find matching device type and validate safety_net_enabled
      console.log(`assetSelectionValues.length :${assetSelectionValues.length}`);
      for (let j = 1; j < assetSelectionValues.length; j++) {
        const assetSelectionDeviceType = assetSelectionValues[j][assetSelectionDeviceTypeIndex];
        const safetyNetEnabled = assetSelectionValues[j][safetyNetEnabledIndex];
        const day = assetSelectionValues[j][dayIndex];
        console.log(`Day : ${day}`);
        console.log(`assetSelectionDeviceType. :${assetSelectionDeviceType}`);
        console.log(`safetyNetEnabled : ${safetyNetEnabled}`);
        if (deviceType === assetSelectionDeviceType) {
          const cell = assetSelectionSheet.getRange(j + 1, safetyNetEnabledIndex + 1);
          if (safetyNetEnabled !== false) {
            // Add highlighting or a note to indicate the issue
            
            cell.setBackground("red");
            cell.setNote('Safety Net should be FALSE when both Operational Status and Fault Tolerance are TRUE');
            Logger.log("Added note for Device Type: " + deviceType);
          } else {
            cell.setBackground(null);
            cell.clearNote();
          }
        }
      }
    }
  }
}
