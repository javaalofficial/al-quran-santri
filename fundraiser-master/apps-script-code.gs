function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Form Responses');
  
  // Parse POST data
  let data = {};
  try {
    // Coba parse dari postData.contents (JSON)
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      // Fallback ke parameters (untuk form-urlencoded)
      data = e.parameters;
    }
  } catch (error) {
    data = e.parameters || {};
  }
  
  // Add timestamp
  const timestamp = new Date();
  
  // Build row with all fields (adjust based on your form fields)
  const row = [
    timestamp,
    data.programType || '',
    data.firstName || '',
    data.phone || '',
    data.email || '',
    data.address || '',
    data.santriName || '',
    data.santriAge || '',
    data.pesantrenName || '',
    data.parentName || '',
    data.parentStatus || '',
    data.parentNote || '',
    data.institutionName || '',
    data.institutionLocation || '',
    data.santriCount || '',
    data.donationAmount || '',
    data.customAmount || '',
    data.message || '',
    data.terms || ''
  ];
  
  // Append to sheet
  sheet.appendRow(row);
  
  // Return success with CORS headers
  return ContentService.createTextOutput(JSON.stringify({
    result: "success",
    timestamp: timestamp
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader('Access-Control-Allow-Origin', '*')
  .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    result: "success",
    message: "Endpoint ready to receive POST requests"
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader('Access-Control-Allow-Origin', '*');
}

// Handle preflight OPTIONS request
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
