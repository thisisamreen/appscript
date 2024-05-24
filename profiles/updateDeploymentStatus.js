function updateDeploymentStatusDropdown() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = 'sites_in_automation';
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.error(`Sheet ${sheetName} not found`);
    return;
  }

  // var newOptions = ["validate_profile", "validated", "validation_failed"];
  var newOptions = ["validating"];
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var headers = values[0];

  // Find the index of the "deployment status" column
  var deploymentStatusIndex = headers.indexOf("deployment_status");
  if (deploymentStatusIndex === -1) {
    console.error("Deployment status column not found");
    return;
  }

  // Get the existing validation rule for the first cell in the "deployment status" column
  var existingRule = sheet.getRange(2, deploymentStatusIndex + 1).getDataValidation();
  var existingValues = [];
  
  if (existingRule) {
    existingValues = existingRule.getCriteriaValues()[0];
  }

  // Combine existing values with new options, ensuring no duplicates
  var combinedOptions = Array.from(new Set([...existingValues, ...newOptions]));

  // Create the new data validation rule
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(combinedOptions)
    .setAllowInvalid(false)
    .build();

  // Loop through the column and apply the new data validation rule
  for (var i = 1; i < values.length; i++) {
    var cell = sheet.getRange(i + 1, deploymentStatusIndex + 1); // 1-based index
    var existingValue = values[i][deploymentStatusIndex];

    // Apply the data validation rule to the cell
    cell.setDataValidation(rule);

    // Set the existing value as the default selected value
    if (combinedOptions.includes(existingValue)) {
      cell.setValue(existingValue);
    } else {
      cell.setValue('');
    }
  }
}
