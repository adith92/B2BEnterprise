import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getGoogleSession, getOAuth2Client, setGoogleSession } from '@/lib/google-oauth';

// High-fidelity local mock spreadsheets when in mock mode
const MOCK_SPREADSHEETS = [
  {
    id: '1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE',
    name: 'Tagihan Listrik Sekolahan (Mei 2026)',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    webViewLink: 'https://docs.google.com/spreadsheets/d/1WQmUVowk6y7KoP_zUrB64wi8Q60aZE54MZ45fvP12cE/edit?usp=sharing',
    modifiedTime: '2026-05-28T00:00:00.000Z',
    isMock: true,
  },
  {
    id: 'mock-spreadsheet-2',
    name: 'Laporan Kas Operasional Sekolah 2026',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    webViewLink: 'https://docs.google.com/spreadsheets/d/mock-spreadsheet-2/edit',
    modifiedTime: '2026-05-27T15:30:00.000Z',
    isMock: true,
  },
  {
    id: 'mock-spreadsheet-3',
    name: 'Rencana Anggaran Pendapatan & Belanja Sekolah (RAPBS) 2026',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    webViewLink: 'https://docs.google.com/spreadsheets/d/mock-spreadsheet-3/edit',
    modifiedTime: '2026-05-25T08:15:00.000Z',
    isMock: true,
  },
];

export async function GET() {
  try {
    const session = await getGoogleSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please connect your Google account first.' },
        { status: 401 }
      );
    }

    if (session.isMock) {
      // Stateful mock backup: return the mock spreadsheets list
      return NextResponse.json({
        success: true,
        files: MOCK_SPREADSHEETS,
        isMock: true,
      });
    }

    const oauth2Client = getOAuth2Client();
    if (!oauth2Client) {
      // In case oauth2 client fails to initialize but session exists, fallback to mock list
      return NextResponse.json({
        success: true,
        files: MOCK_SPREADSHEETS,
        isMock: true,
      });
    }

    oauth2Client.setCredentials({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expiry_date: session.expiry_date,
    });

    // Check if token has expired and we can refresh it
    if (session.expiry_date && session.expiry_date < Date.now() && session.refresh_token) {
      try {
        console.log('Google access token expired. Attempting token refresh...');
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);

        // Update the session in cookie with the refreshed token
        const updatedSession = {
          ...session,
          access_token: credentials.access_token || session.access_token,
          expiry_date: credentials.expiry_date || Date.now() + ((credentials as any).expiry_in || 3600) * 1000,
        };
        await setGoogleSession(updatedSession);
        console.log('Successfully refreshed expired Google access token.');
      } catch (refreshError) {
        console.error('Failed to refresh Google access token:', refreshError);
        return NextResponse.json(
          { success: false, error: 'Session expired. Please log in again.' },
          { status: 401 }
        );
      }
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Search for spreadsheets in Google Drive
    const response = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
      fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
      pageSize: 30,
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];

    return NextResponse.json({
      success: true,
      files,
      isMock: false,
    });
  } catch (error: any) {
    console.error('Error fetching spreadsheets from Google Drive:', error);
    
    // In case of any API error (e.g. invalid credentials or network failure), 
    // we can return a friendly error or a fallback mock list if desired. Let's return the error,
    // but check if it's an auth error to provide helpful instruction.
    const statusCode = error.code || 500;
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to list spreadsheets from Google Drive.',
        code: statusCode
      },
      { status: statusCode === 401 ? 401 : 500 }
    );
  }
}
