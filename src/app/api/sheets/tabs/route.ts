import { NextResponse } from 'next/server';
import { getSpreadsheetTabs } from '@/lib/google-sheets';

export async function GET() {
  try {
    const tabs = await getSpreadsheetTabs();
    return NextResponse.json({ success: true, tabs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tabs' },
      { status: 500 }
    );
  }
}
