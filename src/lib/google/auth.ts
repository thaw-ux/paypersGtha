import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
];

/**
 * Get authenticated Google OAuth2/JWT client using Service Account credentials.
 */
export function getGoogleAuth() {
  // 1. Check if JSON file path is provided
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath && fs.existsSync(credsPath)) {
    return new google.auth.GoogleAuth({
      keyFile: credsPath,
      scopes: SCOPES,
    });
  }

  // 2. Check if raw JSON string is provided in env
  const jsonKeyString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (jsonKeyString) {
    try {
      const credentials = JSON.parse(jsonKeyString);
      return new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
      });
    } catch (e) {
      console.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', e);
    }
  }

  // 3. Check if individual Email and Private Key are provided in env
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    // Handle escaped newlines in env strings
    privateKey = privateKey.replace(/\\n/g, '\n');
    return new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });
  }

  // 4. Fallback check for service-account.json in root directory
  const defaultLocalKeyPath = path.join(process.cwd(), 'service-account.json');
  if (fs.existsSync(defaultLocalKeyPath)) {
    return new google.auth.GoogleAuth({
      keyFile: defaultLocalKeyPath,
      scopes: SCOPES,
    });
  }

  // If no credentials found, throw clear descriptive error
  throw new Error(
    'Google Service Account credentials not found. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, or place service-account.json in the project root.'
  );
}

/**
 * Get Google Drive API instance
 */
export async function getDriveClient() {
  const auth = getGoogleAuth();
  return google.drive({ version: 'v3', auth });
}

/**
 * Get Google Sheets API instance
 */
export async function getSheetsClient() {
  const auth = getGoogleAuth();
  return google.sheets({ version: 'v4', auth });
}
