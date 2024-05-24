function validateOptimizationParameters(spreadsheet,siteId) {
  // const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Copy of aph-ahm_automation"); // Adjust the sheet name as necessary
  var sheetName = `${siteId}_config`;
  var sheet = spreadsheet.getSheetByName(sheetName);
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0]; // Assuming the first row contains headers

  // Find indexes of the columns
  const optParaIndex = headers.indexOf("optimization_param");
  const optValueIndex = headers.indexOf("optimization_value");
  console.log("validating the optimization_value column");
  // Loop through each row starting from the second row
  for (let i = 1; i < values.length; i++) {
    const optPara = values[i][optParaIndex];
    const optValue = values[i][optValueIndex];

    // Split the strings by commas and count the number of elements
    const optParaArray = optPara.split(",");
    const optValueArray = optValue.split(",");

    // Compare the lengths of the arrays
    if (optParaArray.length !== optValueArray.length) {
      // Highlight the cells or take other action if lengths do not match
      sheet.getRange(i + 1, optParaIndex + 1).setBackground("red"); // Highlight "opt_para" cell
      sheet.getRange(i + 1, optValueIndex + 1).setBackground("red"); // Highlight "opt_value" cell
      sheet.getRange(i + 1, optParaIndex + 1, 1, 2).setNote('Mismatch: Number of parameters and values do not match.');
    } else {
      // Optionally clear any previous highlighting if now corrected
      sheet.getRange(i + 1, optParaIndex + 1).setBackground(null);
      sheet.getRange(i + 1, optValueIndex + 1).setBackground(null);
      sheet.getRange(i + 1, optParaIndex + 1, 1, 2).setNote('');

    }
  }
}
