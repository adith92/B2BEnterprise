import { NextResponse } from 'next/server';
import { clearGoogleSession } from '@/lib/google-oauth';

export async function POST() {
  try {
    await clearGoogleSession();
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Error during Google auth logout:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

// Support GET logout just in case for simple anchor link invocation
export async function GET() {
  try {
    await clearGoogleSession();
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (error: any) {
    console.error('Error during Google auth logout:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}
