import { NextRequest, NextResponse } from 'next/server';
import { SheetsService } from '@/lib/google/sheets.service';
import { DriveService } from '@/lib/google/drive.service';
import { GeminiParserService } from '@/lib/gemini/parser.service';

export async function GET() {
  const results = {
    gemini: { configured: !!process.env.GEMINI_API_KEY, status: 'unknown', details: '' },
    sheets: { configured: !!process.env.GOOGLE_SPREADSHEET_ID, status: 'unknown', details: '' },
    drive: { configured: !!process.env.GOOGLE_DRIVE_FOLDER_ID, status: 'unknown', details: '' },
    line: {
      channelSecretConfigured: !!process.env.LINE_CHANNEL_SECRET,
      tokenConfigured: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      status: !!(process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN) ? 'configured' : 'missing_keys',
    },
  };

  // Test Gemini
  if (results.gemini.configured) {
    try {
      const geminiTest = await GeminiParserService.testConnection();
      results.gemini.status = geminiTest.success ? 'connected' : 'error';
      results.gemini.details = geminiTest.error || 'Gemini API is ready';
    } catch (e: any) {
      results.gemini.status = 'error';
      results.gemini.details = e.message;
    }
  } else {
    results.gemini.status = 'missing_key';
    results.gemini.details = 'GEMINI_API_KEY is not set in environment';
  }

  // Test Google Sheets
  if (results.sheets.configured) {
    try {
      const sheetsTest = await SheetsService.testConnection();
      results.sheets.status = sheetsTest.success ? 'connected' : 'error';
      results.sheets.details = sheetsTest.error || `Connected to "${sheetsTest.sheetTitle}" (${sheetsTest.rowCount} records)`;
    } catch (e: any) {
      results.sheets.status = 'error';
      results.sheets.details = e.message;
    }
  } else {
    results.sheets.status = 'missing_config';
    results.sheets.details = 'GOOGLE_SPREADSHEET_ID is not set';
  }

  // Test Google Drive
  try {
    const driveTest = await DriveService.testConnection();
    results.drive.status = driveTest.success ? 'connected' : 'error';
    results.drive.details = driveTest.error || `Connected (${driveTest.rootFolderName})`;
  } catch (e: any) {
    results.drive.status = 'error';
    results.drive.details = e.message;
  }

  return NextResponse.json({ success: true, diagnostics: results });
}

export async function POST() {
  try {
    // 1. Initialize Google Sheet canonical headers
    const sheetInit = await SheetsService.initializeSheet();

    // 2. Initialize dated folder structure in Google Drive
    const driveFolderId = await DriveService.getDatedExpenseFolder(new Date());

    return NextResponse.json({
      success: true,
      message: 'System workspace initialized successfully',
      sheet: sheetInit,
      driveFolderId,
    });
  } catch (error: any) {
    console.error('Setup initialization error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
