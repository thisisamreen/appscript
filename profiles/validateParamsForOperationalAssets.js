function validateParamsForOperationalAssets(spreadsheet,siteId) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName =   "aph-ahm_config"       //`${siteId}_config`;
  var sheet = spreadsheet.getSheetByName(sheetName);
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const headers = values[0];

  // Column indices
  const statusIndex = headers.indexOf("Operational status");
  const selectionEnabledIndex = headers.indexOf("asset_selection_enabled");

  // Columns to check based on conditions
  const generalParameters = [];
  const specificParameters = ["ordering_params", "ordering_values"];
  // Define dropdown columns if they need special handling
  const dropdownColumns = ["Operational status", "asset_selection_enabled","valve_enabled", "fault tolerance","ordering_criteria"];

  // Populate generalParameters excluding specific ones and ignored ones
  headers.forEach((header, index) => {
    if (!["Asset name", "Asset Id", "Operational status", "asset_selection_enabled","valve_enabled", "fault tolerance","ordering_criteria","ordering_params", "ordering_values"].includes(header)) {
      generalParameters.push(index);
    }
  });
  console.log("validating configurations for operational assets");
  // Loop through all rows, starting from the second row (index 1)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const operationalStatus = String(row[statusIndex]).toUpperCase() === "TRUE";
    const selectionEnabled = String(row[selectionEnabledIndex]).toUpperCase() === "TRUE";

    // Check general parameters if operational status is true
    if (operationalStatus ) {
      generalParameters.forEach((colIndex) => {
        if (!row[colIndex]) {
          highlightCell(sheet, i, colIndex, true);
        } else {
          highlightCell(sheet, i, colIndex, false);
        }
      });
    }

    // Check specific parameters if both operational status and selection enabled are true
    if (operationalStatus && selectionEnabled) {
      specificParameters.forEach((param) => {
        const colIndex = headers.indexOf(param);
        if (!row[colIndex]) {
          highlightCell(sheet, i, colIndex, true);
        } else {
          highlightCell(sheet, i, colIndex, false);
        }
      });
    }
  }
}

function highlightCell(sheet, rowIndex, colIndex, shouldHighlight) {
  const cell = sheet.getRange(rowIndex + 1, colIndex + 1); // 1-based index
  if (shouldHighlight) {
    cell.setBackground("yellow");
    cell.setNote('This parameter must not be empty');
  } else {
    cell.setBackground(null);
    cell.setNote('');
  }
}
