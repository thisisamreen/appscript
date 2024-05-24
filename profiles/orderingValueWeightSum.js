function validateOrderingValues(spreadsheet, siteId,errorMessagelist) {
  var sheetName = `${siteId}_config`;
  var sheet = spreadsheet.getSheetByName(sheetName);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0]; // Assuming the first row contains headers

  // Find the index of the 'ordering_values' column
  const orderingValuesIndex = headers.indexOf("ordering_values");

  const selectionEnabledIndex = headers.indexOf("asset_selection_enabled");

  if (selectionEnabledIndex === -1) {
    Logger.log("asset_selection_enabled not found");
    return; // Exit the function if required columns are not found
  }
  if (orderingValuesIndex === -1) {
    Logger.log("ordering_values column not found");
    return; // Exit the function if column is not found
  }
  console.log("validating the weight sum");
  // Loop through each row starting from the second row
  var errorMessage = "";
  for (let i = 1; i < values.length; i++) {
    
    const assetSelectionEnabled = String(values[i][selectionEnabledIndex]).toUpperCase() === "TRUE";
    if (assetSelectionEnabled) {
      const orderingValues = values[i][orderingValuesIndex];
    // Parse the weights from the ordering_values string
      let weightSum = 0;
      let regex = /\(([^,]+,\s*(\d*\.?\d+))\)/g; // Regex to capture weights in the tuples
      let match;
      
      while ((match = regex.exec(orderingValues)) !== null) {
        const weight = parseFloat(match[2]); // Extract the weight (second captured group) and convert to float
        if (!isNaN(weight)) {
          weightSum += weight;
        }
      }

      // Check if the sum of weights equals 1
      if (weightSum.toFixed(2) !== "1.00") {
        // Highlight the cell and add a note if weights do not sum up to 1
        const cell = sheet.getRange(i + 1, orderingValuesIndex + 1); // 1-based index
        cell.setBackground("red");
        errorMessage = `Weights must sum up to 1. Current sum: ${weightSum}`;
        errorMessagelist.push(errorMessage);
        cell.setNote(errorMessage);

      } else {
        // Optionally clear any previous highlighting if now corrected
        const cell = sheet.getRange(i + 1, orderingValuesIndex + 1);
        cell.setBackground(null);
        cell.setNote('');
      }
    }
  }

}
