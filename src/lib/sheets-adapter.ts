export type BillingRecord = {
  rowNumber: number;
  category?: string;
  isPaid?: boolean;
  description?: string;
  customerName?: string;
  customerId?: string;
  amount?: number;
  store?: string;
  printable?: boolean;
  dueDate?: string;
  raw: Record<string, string>;
};

/**
 * Normalizes raw Google Sheets rows (2D array) into standard BillingRecord array.
 * Preserves the 1-based row number from Google Sheets.
 */
export const normalizeBillingRows = (rawRows: any[][]): BillingRecord[] => {
  if (!rawRows || rawRows.length === 0) return [];

  // 1. Identify the header row dynamically
  const headerKeywords = [
    'sudah',
    'status',
    'lunas',
    'paid',
    'bayar',
    'description',
    'deskripsi',
    'keterangan',
    'listrik',
    'tagihan',
    'nominal',
    'amount',
    'biaya',
    'jumlah',
    'cetak',
    'print',
    'toko',
    'store',
    'tempo',
    'due',
  ];

  let bestHeaderRowIndex = 0;
  let maxScore = 0;

  // Scan the first 10 rows to find the one that looks most like a header row
  const scanLimit = Math.min(rawRows.length, 10);
  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows[r];
    let score = 0;
    if (!row) continue;

    for (const val of row) {
      if (!val) continue;
      const lowerVal = String(val).toLowerCase().trim();
      if (headerKeywords.some((keyword) => lowerVal.includes(keyword))) {
        score++;
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestHeaderRowIndex = r;
    }
  }

  const headerRow = rawRows[bestHeaderRowIndex] || [];
  const colCount = Math.max(...rawRows.map((r) => r.length), 0);

  // Build clean column labels
  const colLabels: string[] = [];
  for (let c = 0; c < colCount; c++) {
    const headerVal = headerRow[c];
    colLabels[c] = headerVal ? String(headerVal).trim() : `Column ${c + 1}`;
  }

  // Detect column mapping based on keywords
  let isPaidColIndex = -1;
  let descriptionColIndex = -1;
  let amountColIndex = -1;
  let printColIndex = -1;
  let storeColIndex = -1;
  let dueDateColIndex = -1;

  for (let c = 0; c < colCount; c++) {
    const label = colLabels[c].toLowerCase();

    if (
      label.includes('sudah') ||
      label.includes('status') ||
      label.includes('lunas') ||
      label.includes('paid') ||
      label.includes('bayar')
    ) {
      if (isPaidColIndex === -1) isPaidColIndex = c;
    } else if (
      label.includes('description') ||
      label.includes('deskripsi') ||
      label.includes('keterangan') ||
      label.includes('listrik') ||
      label.includes('rincian')
    ) {
      if (descriptionColIndex === -1) descriptionColIndex = c;
    } else if (
      label.includes('tagihan') ||
      label.includes('nominal') ||
      label.includes('amount') ||
      label.includes('biaya') ||
      label.includes('jumlah') ||
      label.includes('total')
    ) {
      if (amountColIndex === -1) amountColIndex = c;
    } else if (label.includes('cetak') || label.includes('print')) {
      if (printColIndex === -1) printColIndex = c;
    } else if (label.includes('toko') || label.includes('store') || label.includes('channel')) {
      if (storeColIndex === -1) storeColIndex = c;
    } else if (label.includes('tempo') || label.includes('due') || label.includes('jatuh')) {
      if (dueDateColIndex === -1) dueDateColIndex = c;
    }
  }

  const records: BillingRecord[] = [];

  // Parse records starting AFTER the detected header row
  for (let i = bestHeaderRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNumber = i + 1; // Google Sheets is 1-indexed

    if (!row || row.length === 0) continue;

    // Check if the row is entirely empty
    const isEmpty = row.every((val) => !val || String(val).trim() === '');
    if (isEmpty) continue;

    // Build raw record map for all columns in this row
    const rawRecordMap: Record<string, string> = {};
    for (let c = 0; c < colCount; c++) {
      const val = row[c];
      rawRecordMap[colLabels[c]] = val ? String(val).trim() : '';
    }

    // Helper to check if a value means 'paid'
    const parsePaid = (val: any): boolean => {
      if (!val) return false;
      const s = String(val).trim().toLowerCase();
      return (
        s === 'true' ||
        s === 'sudah' ||
        s === 'lunas' ||
        s === 'paid' ||
        s === '√' ||
        s === 'v' ||
        s === 'yes' ||
        s === 'ya' ||
        s === '1'
      );
    };

    // Helper to parse currency/amount numbers
    const parseAmount = (val: any): number => {
      if (!val) return 0;
      // Strip currency, dots, commas (handling Indonesian formats e.g. Rp 1.500.000 or Rp 1,500,000)
      const cleanString = String(val)
        .replace(/rp/gi, '')
        .replace(/\s/g, '');

      // Check if it's formatted like 1.500.000 (Indonesian format where dots are thousands separator)
      // or 1,500,000.00 (Standard format where comma is thousands and dot is decimal)
      let parsedNum = 0;
      if (cleanString.includes('.') && cleanString.includes(',')) {
        // Standard US/UK format
        parsedNum = parseFloat(cleanString.replace(/,/g, ''));
      } else if (cleanString.includes('.') && !cleanString.includes(',')) {
        // If it looks like Indonesian format e.g. 150.000
        // We count the occurrences of dots to determine if they are thousand separators
        const dotCount = (cleanString.match(/\./g) || []).length;
        if (dotCount > 1 || (dotCount === 1 && cleanString.length - cleanString.indexOf('.') > 3)) {
          // Thousands separator dots
          parsedNum = parseFloat(cleanString.replace(/\./g, ''));
        } else {
          // Single dot which could be a decimal separator
          parsedNum = parseFloat(cleanString);
        }
      } else if (cleanString.includes(',')) {
        // If only commas are present, it could be decimal or thousands. E.g. 150,000 (thousands) or 15,5 (decimal)
        const commaCount = (cleanString.match(/,/g) || []).length;
        if (commaCount > 1 || (commaCount === 1 && cleanString.length - cleanString.indexOf(',') > 3)) {
          parsedNum = parseFloat(cleanString.replace(/,/g, ''));
        } else {
          // Replace comma with dot for JS parseFloat
          parsedNum = parseFloat(cleanString.replace(/,/g, '.'));
        }
      } else {
        parsedNum = parseFloat(cleanString);
      }

      return isNaN(parsedNum) ? 0 : parsedNum;
    };

    // Identify categories (e.g. if row only has 1 or 2 fields and they look like section title, like 'LISTRIK')
    const nonPrefixedVals = row.filter((val) => val && String(val).trim() !== '');
    let category: string | undefined;
    if (nonPrefixedVals.length === 1 && descriptionColIndex !== -1 && row[descriptionColIndex]) {
      // If it's a single cell row containing text, it might be a section category header
      category = String(row[descriptionColIndex]).trim();
    }

    const record: BillingRecord = {
      rowNumber,
      category,
      isPaid: isPaidColIndex !== -1 ? parsePaid(row[isPaidColIndex]) : false,
      description: descriptionColIndex !== -1 ? String(row[descriptionColIndex] || '').trim() : undefined,
      amount: amountColIndex !== -1 ? parseAmount(row[amountColIndex]) : 0,
      printable: printColIndex !== -1 ? parsePaid(row[printColIndex]) : undefined,
      store: storeColIndex !== -1 ? String(row[storeColIndex] || '').trim() : undefined,
      dueDate: dueDateColIndex !== -1 ? String(row[dueDateColIndex] || '').trim() : undefined,
      raw: rawRecordMap,
    };

    records.push(record);
  }

  // Backfill categories to rows below them
  let currentCategory = '';
  for (const record of records) {
    if (record.category) {
      currentCategory = record.category;
    } else {
      record.category = currentCategory || undefined;
    }
  }

  // Filter out the category-only rows from the final billing records list if they have no amount/description
  return records.filter((r) => r.description && r.description !== r.category);
};
