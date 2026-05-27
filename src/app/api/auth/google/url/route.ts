import { NextResponse } from 'next/server';
import { getOAuth2Client, GOOGLE_OAUTH_SCOPES, isMockMode } from '@/lib/google-oauth';

export async function GET() {
  try {
    if (isMockMode()) {
      // In mock mode, direct the user straight to the callback route with a mock authorization code
      const mockUrl = '/api/auth/google/callback?code=mock_authorization_code_123';
      return NextResponse.json({ url: mockUrl, mock: true });
    }

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      // Fallback fallback if instantiation failed unexpectedly
      const mockUrl = '/api/auth/google/callback?code=mock_authorization_code_123';
      return NextResponse.json({ url: mockUrl, mock: true });
    }

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GOOGLE_OAUTH_SCOPES,
      prompt: 'consent', // Forces approval to always receive refresh token
    });

    return NextResponse.json({ url, mock: false });
  } catch (error: any) {
    console.error('Error generating Google auth URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate authorization URL' },
      { status: 500 }
    );
  }
}
