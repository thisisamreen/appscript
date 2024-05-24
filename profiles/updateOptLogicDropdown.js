function updateDropdownOptionsBatch() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Access the index sheet and read the required data
  const indexSheet = ss.getSheetByName('sites_in_automation');
  const data = indexSheet.getRange(2, 1, indexSheet.getLastRow()-1, 3).getValues(); // Adjust range according to actual data start row
  for (let i = 0; i < 16; i++) {
    const row = data[i];
  // data.forEach(row => {
    const siteId = row[1];


    if (siteId === "suh-hyd") {
      console.log("Skipping siteId:", siteId);
      continue; // Skip the rest of the loop for this iteration
    }
    const sheetName = siteId + '_asset_selection';
    const sheet = ss.getSheetByName(sheetName);
    console.log(`Working on sheet : ${sheetName}`);
    if (sheet) {
      const range = sheet.getDataRange();
      const values = range.getValues();
      const headers = values[0]; // Assuming the first row contains headers

      const optimizationLogicIndex = headers.indexOf("optimization_logic");
      const commandIndex = headers.indexOf("Command");

      if (optimizationLogicIndex === -1 || commandIndex === -1) {
        Logger.log("One or more columns not found");
        return; // Exit the function if columns are not found
      }

      // Define the new dropdown options
      const additionalOptions = [
        "asl_zone_division_on_parameter_value",
        "asl_fixed_number_of_assets_running",
        "asl_design_flow_pump_selector"
      ];

      // Prepare requests for batch update
      let requests = [];
      const optimizationParamIndex = headers.indexOf("optimization_param");
      for (let i = 1; i < values.length; i++) {
        const commandValue = values[i][commandIndex];
        if (commandValue === 'start_action' || commandValue === 'stop_action') {
          const rowIndex = i + 1; // Convert to 1-based index used in A1 notation

          // Combine old options with new, avoiding duplicates
          let cell = sheet.getRange(rowIndex, optimizationLogicIndex + 1);
          let validationRule = cell.getDataValidation();
          let existingOptions = validationRule ? validationRule.getCriteriaValues()[0] : [];
          let newOptions = Array.from(new Set([...existingOptions, ...additionalOptions]));

          // Define the request for this row
          requests.push({
            setDataValidation: {
              range: {
                sheetId: sheet.getSheetId(),
                startRowIndex: i,
                endRowIndex: i + 1,
                startColumnIndex: optimizationLogicIndex,
                endColumnIndex: optimizationLogicIndex + 1
              },
              rule: {
                condition: {
                  type: 'ONE_OF_LIST',
                  values: newOptions.map(option => ({ userEnteredValue: option }))
                },
                showCustomUi: true,
                strict: true
              }
            }
          });

          // Add a request to set the default value
          requests.push({
            repeatCell: {
              range: {
                sheetId: sheet.getSheetId(),
                startRowIndex: i,
                endRowIndex: i + 1,
                startColumnIndex: optimizationLogicIndex,
                endColumnIndex: optimizationLogicIndex + 1
              },
              cell: {
                userEnteredValue: {
                  stringValue: "asl_zone_division_on_parameter_value"
                }
              },
              fields: 'userEnteredValue'  // Specify that you are updating the cell's value
            }
          });
        }
        //update Cell formula for optimization_param
        requests.push({
    repeatCell: {
      range: {
        sheetId: sheet.getSheetId(),
        startRowIndex: i,
        endRowIndex: i + 1,
        startColumnIndex: optimizationParamIndex,
        endColumnIndex: optimizationParamIndex + 1
      },
      cell: {
        userEnteredValue: {
          formulaValue: '=IF(O' + (i + 1) + '="tonnage_injection", "min_sp,off_trig_sp,on_trig_sp,chw_in_trig,off_trig_sp_offset,chiller_delta", IF(OR(O' + (i + 1) + '="single_objective_rl", O' + (i + 1) + '="multi_objective_rl", O' + (i + 1) + '="q_based_rl"), "observable,target,recommendations_enabled,recommendations_range_delta,sample_time", IF(O' + (i + 1) + '="oat", "mode,threshold,param_step_size,step_size,min_sp,tmp_min,tmp_max,hum_max", IF(O' + (i + 1) + '="asl_zone_division_on_parameter_value", "param,sample_time,min_asset", IF(O' + (i + 1) + '="asl_fixed_number_of_assets_running", "num_of_assets", IF(O' + (i + 1) + '="asl_design_flow_pump_selector", "delta_t,min_flow_per_tr,max_flow_per_tr,design_freq,design_flow,design_power, sample_time", IF(ISBLANK(O' + (i + 1) + '), "", "Error: Check R7 value")))))))'
        }
      },
      fields: 'userEnteredValue'  // Specify that you are updating the cell's formula
    }
  });
        }
      

      // Perform the batch update
      if (requests.length > 0) {
        const batchUpdateRequest = {requests: requests};
        const batchUpdateResponse = Sheets.Spreadsheets.batchUpdate(batchUpdateRequest, ss.getId());
      console.log(`Updated sheet`)
    }
  }
  }
}


