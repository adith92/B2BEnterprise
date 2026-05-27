import { NextRequest, NextResponse } from 'next/server';
import { getSpreadsheetRows } from '@/lib/google-sheets';
import { normalizeBillingRows } from '@/lib/sheets-adapter';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sheetName = searchParams.get('sheet');

  if (!sheetName) {
    return NextResponse.json(
      { success: false, error: 'Query parameter "sheet" is required.' },
      { status: 400 }
    );
  }

  try {
    const rawRows = await getSpreadsheetRows(sheetName);
    const normalized = normalizeBillingRows(rawRows);
    return NextResponse.json({
      success: true,
      sheetName,
      totalRawRows: rawRows.length,
      totalNormalizedRecords: normalized.length,
      records: normalized,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || `Failed to fetch rows for ${sheetName}` },
      { status: 500 }
    );
  }
}
