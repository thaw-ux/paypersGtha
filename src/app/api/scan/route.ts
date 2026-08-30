import { NextRequest, NextResponse } from 'next/server';
import { GeminiParserService } from '@/lib/gemini/parser.service';
import { DriveService } from '@/lib/google/drive.service';
import { SheetsService } from '@/lib/google/sheets.service';
import { Transaction } from '@/types/transaction';
import { generateTransactionId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const saveImmediately = formData.get('saveImmediately') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided in request' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'image/jpeg';
    const timestamp = new Date();

    // 1. Run Gemini AI OCR Parser
    const extractionResult = await GeminiParserService.parseReceiptImage(buffer, mimeType);

    // If only preview is requested, return parsed data immediately
    if (!saveImmediately) {
      return NextResponse.json({
        success: true,
        data: extractionResult,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
    }

    // 2. Upload to Google Drive
    let driveFileId: string | null = null;
    let driveViewUrl: string | null = null;

    try {
      const filename = `${timestamp.toISOString().slice(0, 10).replace(/-/g, '')}_${timestamp.getTime()}_${file.name}`;
      const uploadRes = await DriveService.uploadFile(buffer, filename, mimeType, timestamp);
      driveFileId = uploadRes.fileId;
      driveViewUrl = uploadRes.webViewLink || `/api/drive/view/${uploadRes.fileId}`;
    } catch (driveErr) {
      console.warn('Drive upload warning:', driveErr);
      // Fallback: store Base64 data URL so the receipt photo is always visible
      driveViewUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    // 3. Save to Google Sheets
    const txnId = generateTransactionId();
    const transaction: Transaction = {
      id: txnId,
      timestamp: timestamp.toISOString(),
      date: extractionResult.transaction_date,
      time: extractionResult.transaction_time,
      type: extractionResult.type,
      category: extractionResult.category,
      merchant: extractionResult.merchant_name,
      taxId: extractionResult.tax_id,
      subtotal: extractionResult.subtotal,
      vat: extractionResult.vat_amount,
      wht: extractionResult.withholding_tax,
      grandTotal: extractionResult.grand_total,
      paymentMethod: extractionResult.payment_method,
      documentType: extractionResult.document_type,
      items: extractionResult.items,
      driveFileId,
      driveViewUrl,
      source: 'web_app',
      createdBy: 'Web Admin',
      status: 'completed',
      notes: extractionResult.thai_summary,
    };

    await SheetsService.appendTransaction(transaction);

    return NextResponse.json({
      success: true,
      data: transaction,
      extraction: extractionResult,
    });
  } catch (error: any) {
    console.error('Error scanning receipt:', error);
    return NextResponse.json({ success: false, error: error.message || 'Scanning failed' }, { status: 500 });
  }
}
