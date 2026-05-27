import { NextResponse } from 'next/server';
import { getGoogleSession } from '@/lib/google-oauth';

export async function GET() {
  try {
    const session = await getGoogleSession();

    if (!session) {
      return NextResponse.json({
        isAuthenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      isAuthenticated: true,
      user: session.user,
      isMock: session.isMock,
    });
  } catch (error: any) {
    console.error('Error fetching Google auth session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
