import { google } from 'googleapis';

const getSheetsClient = () => {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.warn(
      '⚠️ Google Sheets API credentials (GOOGLE_SHEETS_CLIENT_EMAIL/PRIVATE_KEY) are missing. Using mock data fallback.'
    );
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

// High quality mock data representing "Mei 2026 - Tagihan" structure
const MOCK_TABS = ['Mei 2026 - Tagihan', 'April 2026 - Tagihan', 'Maret 2026 - Tagihan'];
const MOCK_ROWS: Record<string, any[][]> = {
  'Mei 2026 - Tagihan': [
    [],
    ['Sudah', 'Description', 'Tagihan', 'Cetak', 'Jatuh Tempo'],
    ['LISTRIK GEDUNG A', '', '', '', ''],
    ['FALSE', 'R. POS SATPAM', 'Rp 150.000', 'TRUE', '2026-05-10'],
    ['TRUE', 'DAPUR UTAMA', 'Rp 450.000', 'FALSE', '2026-05-10'],
    ['FALSE', 'KELAS VII A', 'Rp 250.000', 'TRUE', '2026-05-10'],
    ['FALSE', 'KELAS VII B', 'Rp 250.000', 'TRUE', '2026-05-10'],
    ['LISTRIK GEDUNG B', '', '', '', ''],
    ['TRUE', 'GEDUNG UTAMA', 'Rp 1.200.000', 'TRUE', '2026-05-10'],
    ['FALSE', 'LAB KOMPUTER', 'Rp 850.000', 'FALSE', '2026-05-10'],
    ['FALSE', 'PERPUSTAKAAN', 'Rp 350.000', 'TRUE', '2026-05-10'],
    ['TELKOM & WIFI', '', '', '', ''],
    ['TRUE', 'INTERNET RUANG GURU', 'Rp 450.000', 'FALSE', '2026-05-10'],
    ['FALSE', 'INTERNET LAB', 'Rp 600.000', 'TRUE', '2026-05-10'],
  ],
  'April 2026 - Tagihan': [
    [],
    ['Sudah', 'Description', 'Tagihan', 'Cetak', 'Jatuh Tempo'],
    ['LISTRIK GEDUNG A', '', '', '', ''],
    ['TRUE', 'R. POS SATPAM', 'Rp 145.000', 'TRUE', '2026-04-10'],
    ['TRUE', 'DAPUR UTAMA', 'Rp 420.000', 'FALSE', '2026-04-10'],
    ['TRUE', 'KELAS VII A', 'Rp 240.000', 'TRUE', '2026-04-10'],
    ['TRUE', 'KELAS VII B', 'Rp 240.000', 'TRUE', '2026-04-10'],
    ['LISTRIK GEDUNG B', '', '', '', ''],
    ['TRUE', 'GEDUNG UTAMA', 'Rp 1.150.000', 'TRUE', '2026-04-10'],
    ['TRUE', 'LAB KOMPUTER', 'Rp 800.000', 'FALSE', '2026-04-10'],
    ['TRUE', 'PERPUSTAKAAN', 'Rp 320.000', 'TRUE', '2026-04-10'],
  ]
};

/**
 * Fetch all available tab/sheet names in the configured spreadsheet.
 */
export const getSpreadsheetTabs = async (): Promise<string[]> => {
  const sheets = getSheetsClient();
  if (!sheets) {
    return MOCK_TABS;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;


  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is missing in environment variables.');
  }

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetsList = response.data.sheets || [];
    return sheetsList
      .map((s) => s.properties?.title)
      .filter((title): title is string => !!title);
  } catch (error: any) {
    console.error('Error fetching spreadsheet tabs:', error);
    throw new Error(`Failed to fetch spreadsheet metadata: ${error.message || error}`);
  }
};

/**
 * Fetch all raw rows (2D array) from a specific tab.
 */
export const getSpreadsheetRows = async (sheetName: string): Promise<any[][]> => {
  const sheets = getSheetsClient();
  if (!sheets) {
    return MOCK_ROWS[sheetName] || MOCK_ROWS['Mei 2026 - Tagihan'] || [];
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is missing in environment variables.');
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A1:Z1000`, // Using quote marks for safe sheet name parsing (e.g. spaces, special chars)
    });

    return response.data.values || [];
  } catch (error: any) {
    console.error(`Error fetching rows from sheet ${sheetName}:`, error);
    throw new Error(`Failed to fetch rows from ${sheetName}: ${error.message || error}`);
  }
};

/**
 * Helper to convert 0-indexed column index to Spreadsheet Column Letter (e.g., 0 -> A, 25 -> Z, 26 -> AA)
 */
const getColumnLetter = (colIndex: number): string => {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
};

/**
 * Update payment status (isPaid) in a specific cell of a sheet.
 * This dynamically scans the columns to locate the status column (e.g. 'Sudah' / 'Status' / 'Lunas'),
 * converts the column index to a spreadsheet Column Letter,
 * and updates that specific cell at 'sheetName'!ColumnLetterRowNumber.
 * In mock mode (when JWT client is null), it updates the value inside the MOCK_ROWS data store.
 */
export const updatePaymentStatusInSheet = async (
  sheetName: string,
  rowNumber: number,
  isPaid: boolean
): Promise<void> => {
  if (!sheetName) {
    throw new Error('sheetName is required for updating payment status.');
  }
  if (!rowNumber || rowNumber <= 0) {
    throw new Error('A valid 1-based rowNumber is required for updating payment status.');
  }

  // Fetch the rows to dynamically scan for the status column
  const rows = await getSpreadsheetRows(sheetName);
  if (!rows || rows.length === 0) {
    throw new Error(`Sheet "${sheetName}" has no data or is empty.`);
  }

  let statusColIndex = -1;
  const possibleHeaders = ['sudah', 'status', 'lunas'];

  // Scan the first few rows (up to 10) to locate the status column header
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]).trim().toLowerCase();
      if (possibleHeaders.includes(val)) {
        statusColIndex = c;
        break;
      }
    }
    if (statusColIndex !== -1) {
      break;
    }
  }

  if (statusColIndex === -1) {
    throw new Error(
      `Could not dynamically locate a payment status column (e.g., 'Sudah', 'Status', 'Lunas') in sheet "${sheetName}".`
    );
  }

  const columnLetter = getColumnLetter(statusColIndex);
  const range = `'${sheetName}'!${columnLetter}${rowNumber}`;

  const sheets = getSheetsClient();
  if (!sheets) {
    // High-fidelity local mock data update in src/lib/google-sheets.ts if credentials are missing
    if (!MOCK_ROWS[sheetName]) {
      MOCK_ROWS[sheetName] = [];
    }

    // Ensure array structure matches requested row and column boundaries without breaking anything
    while (MOCK_ROWS[sheetName].length < rowNumber) {
      MOCK_ROWS[sheetName].push([]);
    }
    while (MOCK_ROWS[sheetName][rowNumber - 1].length <= statusColIndex) {
      MOCK_ROWS[sheetName][rowNumber - 1].push('');
    }

    // Update cell value
    MOCK_ROWS[sheetName][rowNumber - 1][statusColIndex] = isPaid ? 'TRUE' : 'FALSE';

    console.log(
      `[MOCK UPDATE] Successfully updated payment status to ${isPaid} in mock sheet "${sheetName}" at cell ${columnLetter}${rowNumber} (Range: ${range})`
    );
    return;
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is missing in environment variables.');
  }

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[isPaid ? 'TRUE' : 'FALSE']],
      },
    });

    console.log(
      `[LIVE UPDATE] Successfully updated payment status to ${isPaid} in sheet "${sheetName}" at cell ${columnLetter}${rowNumber} (Range: ${range})`
    );
  } catch (error: any) {
    console.error(
      `Error updating payment status in sheet "${sheetName}" at cell ${columnLetter}${rowNumber}:`,
      error
    );
    throw new Error(`Failed to update payment status in live sheet: ${error.message || error}`);
  }
};

