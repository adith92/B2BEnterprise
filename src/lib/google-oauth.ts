import { google } from 'googleapis';
import { cookies } from 'next/headers';

// Scopes required for user profile and viewing spreadsheets in Google Drive
export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
];

export interface GoogleSessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleSessionData {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  isMock: boolean;
  user: GoogleSessionUser;
}

/**
 * Checks if the required Google OAuth environment variables are missing.
 * If they are missing, the system falls back to a robust mock mode.
 */
export const isMockMode = (): boolean => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return !clientId || !clientSecret;
};

/**
 * Returns an instance of the Google OAuth2 client.
 * Returns null if in mock mode (i.e. client ID/secret are missing).
 */
export const getOAuth2Client = (redirectUri?: string) => {
  if (isMockMode()) {
    return null;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const defRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri || defRedirectUri
  );
};

/**
 * High-fidelity mock user profile for the stateful session fallback.
 */
export const MOCK_USER: GoogleSessionUser = {
  id: 'mock-user-123456789',
  email: 'admin.keuangan@sman-kassekolah.sch.id',
  name: 'Budi Santoso (Admin Keuangan Mock)',
  picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
};

/**
 * Retrieves the current session data from the 'google_auth_token' cookie.
 * Awaits the async Next.js cookie store for flawless compatibility.
 */
export const getGoogleSession = async (): Promise<GoogleSessionData | null> => {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('google_auth_token');

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    // Attempt to parse the session data
    const decoded = JSON.parse(decodeURIComponent(sessionCookie.value));
    return decoded as GoogleSessionData;
  } catch (error) {
    console.error('Error parsing google_auth_token cookie:', error);
    return null;
  }
};

/**
 * Serializes and saves the active session inside the 'google_auth_token' cookie.
 */
export const setGoogleSession = async (session: GoogleSessionData): Promise<void> => {
  const cookieStore = await cookies();
  const serialized = encodeURIComponent(JSON.stringify(session));

  // Determine cookie expiration (default to 7 days if not provided)
  const maxAge = session.expiry_date 
    ? Math.max(0, Math.floor((session.expiry_date - Date.now()) / 1000))
    : 60 * 60 * 24 * 7; // 7 days

  cookieStore.set('google_auth_token', serialized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAge > 0 ? maxAge : 60 * 60 * 24 * 7,
  });
};

/**
 * Clears the 'google_auth_token' cookie, logging the user out.
 */
export const clearGoogleSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete('google_auth_token');
};
