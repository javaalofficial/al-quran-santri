/**
 * Google Apps Script untuk form HTML dengan CORS support
 *
 * Setup:
 * 1. Buat Google Sheet kosong
 * 2. Extensions → Apps Script
 * 3. Paste kode ini
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone, even anonymous
 * 5. Copy URL dan ganti di form.html baris 504
 *
 * Opsional: tambah field hidden di form:
 * - e_gs_SheetName: nama sheet (default: Form Responses)
 * - e_gs_order: urutan kolom, comma-separated
 * - e_gs_exclude: kolom yang di-skip, comma-separated
 */

// Email notification (set false jika tidak perlu)
let emailNotification = false;
let emailAddress = "ganti_ke_email_anda@gmail.com";

// Internal flags
let isNewSheet = false;
let postedData = [];
const EXCLUDE_PROPERTY = 'e_gs_exclude';
const ORDER_PROPERTY = 'e_gs_order';
const SHEET_NAME_PROPERTY = 'e_gs_SheetName';

/**
 * GET request handler - untuk test
 */
function doGet(e) {
  return ContentService.createTextOutput("Yepp this is the webhook URL, request received")
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * POST request handler - main webhook
 */
function doPost(e) {
  // Ambil data dari form (support both JSON dan form-encoded)
  let params = {};
  
  // Cek apakah ada postData (JSON body)
  if (e.postData && e.postData.contents) {
    try {
      params = JSON.parse(e.postData.contents);
    } catch (err) {
      // Fallback ke parameter
      params = e.parameter;
    }
  } else {
    // Form-encoded data
    params = e.parameter;
  }
  
  // Tanggal timestamp
  let currentDate = new Date();
  params.timestamp = currentDate.toISOString();
  
  // Simpan ke sheet
  insertToSheet(params);
  
  // Response dengan CORS headers
  return ContentService.createTextOutput(JSON.stringify({
    result: "success",
    timestamp: currentDate
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeader('Access-Control-Allow-Origin', '*')
  .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handle preflight OPTIONS request
 */
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Flatten nested object (untuk handle array/object dalam form)
 */
const flattenObject = (ob) => {
  let toReturn = {};
  for (let i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    
    if ((typeof ob[i]) !== 'object' || ob[i] === null) {
      toReturn[i] = ob[i];
      continue;
    }
    
    let flatObject = flattenObject(ob[i]);
    for (let x in flatObject) {
      if (!flatObject.hasOwnProperty(x)) continue;
      toReturn[i + '.' + x] = flatObject[x];
    }
  }
  return toReturn;
};

/**
 * Get headers dari sheet atau buat baru
 */
const getHeaders = (formSheet, keys) => {
  let headers = [];
  
  // Ambil header existing
  if (!isNewSheet) {
    headers = formSheet.getRange(1, 1, 1, formSheet.getLastColumn()).getValues()[0];
  }
  
  // Filter headers baru yang belum ada
  const newHeaders = keys.filter(h => !headers.includes(h));
  headers = [...headers, ...newHeaders];
  
  // Atur urutan jika ada e_gs_order
  headers = getColumnsOrder(headers);
  
  // Exclude kolom kontrol
  headers = excludeColumns(headers);
  
  // Filter out control columns
  headers = headers.filter(header => 
    !header.includes(EXCLUDE_PROPERTY) && 
    !header.includes(ORDER_PROPERTY) && 
    !header.includes(SHEET_NAME_PROPERTY)
  );
  
  return headers;
};

/**
 * Build values array sesuai header order
 */
const getValues = (headers, flat) => {
  const values = [];
  headers.forEach(h => values.push(flat[h] || ''));
  return values;
};

/**
 * Insert row ke sheet
 */
const insertRowData = (sheet, row, values) => {
  const currentRow = sheet.getRange(row, 1, 1, values.length);
  currentRow.setValues([values])
    .setHorizontalAlignment("center");
};

/**
 * Set headers di baris pertama
 */
const setHeaders = (sheet, values) => {
  if (sheet.getLastRow() === 0) {
    insertRowData(sheet, 1, values);
  }
};

/**
 * Insert data ke baris baru
 */
const setValues = (sheet, values) => {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  sheet.insertRowAfter(lastRow);
  insertRowData(sheet, lastRow + 1, values);
};

/**
 * Cari atau buat sheet berdasarkan nama
 */
const getFormSheet = (sheetName) => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    isNewSheet = true;
  }
  
  return sheet;
};

/**
 * Main insert logic
 */
const insertToSheet = (data) => {
  // Simpan data mentah untuk ordering/exclude
  postedData = data;
  
  const flat = flattenObject(data);
  const keys = Object.keys(flat);
  
  // Tentukan nama sheet (default dari field atau "Form Responses")
  const sheetName = data[SHEET_NAME_PROPERTY] || "Form Responses";
  
  const formSheet = getFormSheet(sheetName);
  const headers = getHeaders(formSheet, keys);
  const values = getValues(headers, flat);
  
  setHeaders(formSheet, headers);
  setValues(formSheet, values);
  
  // Kirim email notifikasi jika aktif
  if (emailNotification) {
    sendNotification(data, SpreadsheetApp.getActiveSpreadsheet().getUrl());
  }
};

/**
 * dapatkan sheet name dari form field atau default
 */
const getSheetName = (data) => data[SHEET_NAME_PROPERTY] || "Form Responses";

/**
 * Urutan kolom custom via e_gs_order
 */
const getColumnsOrder = (headers) => {
  if (!postedData[ORDER_PROPERTY]) return headers;
  
  let sortingArr = postedData[ORDER_PROPERTY]
    .split(',')
    .map(el => el.trim())
    .filter(h => headers.includes(h));
  
  // Filter out yang sudah di-sort
  headers = headers.filter(h => !sortingArr.includes(h));
  
  return [...sortingArr, ...headers];
};

/**
 * Exclude kolom via e_gs_exclude
 */
const excludeColumns = (headers) => {
  if (!postedData[EXCLUDE_PROPERTY]) return headers;
  
  const columnsToExclude = postedData[EXCLUDE_PROPERTY]
    .split(',')
    .map(el => el.trim());
  
  return headers.filter(header => !columnsToExclude.includes(header));
};

/**
 * Kirim email notifikasi
 */
const sendNotification = (data, url) => {
  try {
    const formName = data.form_name || data[SHEET_NAME_PROPERTY] || 'Unknown Form';
    MailApp.sendEmail({
      to: emailAddress,
      subject: `New Form Submission: ${formName}`,
      body: `A new submission received via "${formName}" form.\n\n` +
            `View in sheet: ${url}\n\n` +
            `Data:\n${JSON.stringify(data, null, 2)}`,
      name: 'Form Webhook'
    });
  } catch (err) {
    console.error('Email notification failed:', err);
  }
};
