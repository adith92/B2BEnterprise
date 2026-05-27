import { NextRequest, NextResponse } from 'next/server';
import { updateRowInSheet } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheetName, rowNumber, updatedValues } = body;

    if (!sheetName) {
      return NextResponse.json(
        { success: false, error: 'sheetName is required.' },
        { status: 400 }
      );
    }

    if (!rowNumber || isNaN(Number(rowNumber)) || Number(rowNumber) <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid rowNumber greater than 0 is required.' },
        { status: 400 }
      );
    }

    if (!updatedValues || typeof updatedValues !== 'object') {
      return NextResponse.json(
        { success: false, error: 'updatedValues object is required.' },
        { status: 400 }
      );
    }

    await updateRowInSheet(sheetName, Number(rowNumber), updatedValues);

    return NextResponse.json({
      success: true,
      message: `Successfully updated row ${rowNumber} in sheet "${sheetName}".`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/sheets/update-row:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update row' },
      { status: 500 }
    );
  }
}
