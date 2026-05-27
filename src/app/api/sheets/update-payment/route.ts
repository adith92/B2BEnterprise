import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentStatusInSheet } from '@/lib/google-sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body is required and must be valid JSON.' },
        { status: 400 }
      );
    }

    const { sheetName, rowNumber, isPaid } = body;

    // Type and value validation
    if (typeof sheetName !== 'string' || !sheetName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Field "sheetName" is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    if (typeof rowNumber !== 'number' || isNaN(rowNumber) || rowNumber <= 0 || !Number.isInteger(rowNumber)) {
      return NextResponse.json(
        { success: false, error: 'Field "rowNumber" is required and must be a positive integer.' },
        { status: 400 }
      );
    }

    if (typeof isPaid !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Field "isPaid" is required and must be a boolean value.' },
        { status: 400 }
      );
    }

    // Attempt the update
    await updatePaymentStatusInSheet(sheetName.trim(), rowNumber, isPaid);

    return NextResponse.json({
      success: true,
      message: `Successfully updated payment status to ${isPaid} for row ${rowNumber} in sheet "${sheetName}".`,
      sheetName,
      rowNumber,
      isPaid,
    });
  } catch (error: any) {
    console.error('Error in POST /api/sheets/update-payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while updating payment status.' },
      { status: 500 }
    );
  }
}
