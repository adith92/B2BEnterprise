import { NextRequest, NextResponse } from 'next/server';
import { getOAuth2Client, setGoogleSession, isMockMode, MOCK_USER } from '@/lib/google-oauth';
import { google } from 'googleapis';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // If code is missing, redirect to dashboard with an error parameter
    return NextResponse.redirect(new URL('/dashboard?error=missing_code', request.url));
  }

  try {
    if (isMockMode() || code.startsWith('mock_')) {
      // Create high-fidelity stateful mock session
      const mockSession = {
        access_token: 'mock_access_token_kas_sekolah_123',
        isMock: true,
        user: MOCK_USER,
      };

      await setGoogleSession(mockSession);
      console.log('Successfully established mock session in cookie.');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      throw new Error('OAuth client not initialized.');
    }

    // Exchange the authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user profile information using standard google oauth2 api
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!tokens.access_token) {
      throw new Error('No access token received from Google.');
    }

    const session = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      isMock: false,
      user: {
        id: userInfo.id || 'unknown-id',
        email: userInfo.email || 'unknown-email',
        name: userInfo.name || 'Google Connected User',
        picture: userInfo.picture || undefined,
      },
    };

    await setGoogleSession(session);
    console.log(`Successfully established live session for user: ${session.user.email}`);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: any) {
    console.error('Error in Google auth callback:', error);
    const errMsg = error.message || 'auth_failed';
    return NextResponse.redirect(new URL(`/dashboard?error=${encodeURIComponent(errMsg)}`, request.url));
  }
}
