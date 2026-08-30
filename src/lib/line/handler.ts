import { WebhookEvent } from '@line/bot-sdk';
import { getLineClient, downloadLineContent } from './client';
import { createReceiptFlexMessage, createSummaryFlexMessage, createHelpFlexMessage } from './flex-templates';
import { GeminiParserService } from '../gemini/parser.service';
import { DriveService } from '../google/drive.service';
import { SheetsService } from '../google/sheets.service';
import { Transaction } from '@/types/transaction';
import { generateTransactionId } from '../utils';

export class LineWebhookHandler {
  private static get dashboardUrl(): string {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  /**
   * Main entry point for LINE Webhook Events
   */
  static async handleEvents(events: WebhookEvent[]) {
    const results = await Promise.allSettled(
      events.map((event) => this.processSingleEvent(event))
    );
    return results;
  }

  private static async processSingleEvent(event: WebhookEvent) {
    if (event.type !== 'message') {
      return;
    }

    const lineClient = getLineClient();
    const replyToken = event.replyToken;
    const userId = event.source.userId || 'Unknown LINE User';

    try {
      if (event.message.type === 'image') {
        await this.handleImageMessage(event.message as { id: string; type: string }, replyToken, userId);
      } else if (event.message.type === 'text') {
        await this.handleTextMessage(event.message as { id: string; text: string; type: string }, replyToken, userId);
      }
    } catch (error: any) {
      console.error('Error handling LINE event:', error);
      if (replyToken) {
        await lineClient.replyMessage({
          replyToken,
          messages: [
            {
              type: 'text',
              text: `⚠️ เกิดข้อผิดพลาดในการประมวลผล: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}`,
            },
          ],
        });
      }
    }
  }

  /**
   * Handle incoming receipt / slip photo from LINE
   */
  private static async handleImageMessage(
    message: { id: string; type: string },
    replyToken: string,
    userId: string
  ) {
    const lineClient = getLineClient();
    const messageId = message.id;

    // 1. Download image stream from LINE Content API
    const imageBuffer = await downloadLineContent(messageId);

    // 2. Run Gemini OCR extraction and Drive Upload in parallel
    const timestamp = new Date();
    const [extractedData, driveUploadResult] = await Promise.all([
      GeminiParserService.parseReceiptImage(imageBuffer, 'image/jpeg'),
      (async () => {
        try {
          const filename = `${timestamp.toISOString().slice(0, 10).replace(/-/g, '')}_${timestamp.getTime()}_receipt.jpg`;
          return await DriveService.uploadFile(imageBuffer, filename, 'image/jpeg', timestamp);
        } catch (e) {
          console.warn('Drive upload warning:', e);
          return { fileId: null, webViewLink: null };
        }
      })(),
    ]);

    // 3. Construct Transaction Object
    const txnId = generateTransactionId();
    const transaction: Transaction = {
      id: txnId,
      timestamp: timestamp.toISOString(),
      date: extractedData.transaction_date,
      time: extractedData.transaction_time,
      type: extractedData.type,
      category: extractedData.category,
      merchant: extractedData.merchant_name,
      taxId: extractedData.tax_id,
      subtotal: extractedData.subtotal,
      vat: extractedData.vat_amount,
      wht: extractedData.withholding_tax,
      grandTotal: extractedData.grand_total,
      paymentMethod: extractedData.payment_method,
      documentType: extractedData.document_type,
      items: extractedData.items,
      driveFileId: driveUploadResult.fileId || null,
      driveViewUrl: driveUploadResult.webViewLink || (driveUploadResult.fileId ? `/api/drive/view/${driveUploadResult.fileId}` : null),
      source: 'line_oa',
      createdBy: userId,
      status: 'completed',
      notes: extractedData.thai_summary,
    };

    // 4. Save to Google Sheets
    await SheetsService.appendTransaction(transaction);

    // 5. Reply to user with Rich LINE Flex Message
    const flexMessage = createReceiptFlexMessage(transaction, this.dashboardUrl);
    await lineClient.replyMessage({
      replyToken,
      messages: [flexMessage as any],
    });
  }

  /**
   * Handle text messages (Commands or Natural Thai Expense recording)
   */
  private static async handleTextMessage(
    message: { id: string; text: string; type: string },
    replyToken: string,
    userId: string
  ) {
    const lineClient = getLineClient();
    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    // Case 1: Help / Guide
    if (['วิธีใช้', 'ช่วยเหลือ', 'help', 'menu', 'คำสั่ง'].includes(lowerText)) {
      const helpMsg = createHelpFlexMessage();
      await lineClient.replyMessage({
        replyToken,
        messages: [helpMsg as any],
      });
      return;
    }

    // Case 2: Financial Summary Commands (e.g. "สรุป", "สรุปวันนี้", "สรุปเดือนนี้", "ยอดรวม")
    if (lowerText.startsWith('สรุป') || lowerText.includes('ยอดรวม') || lowerText === 'summary') {
      const now = new Date();
      let yearMonth = '';
      let periodName = 'ทั้งหมด';

      if (lowerText.includes('วันนี้')) {
        const todayStr = now.toISOString().slice(0, 10);
        const todayTxns = (await SheetsService.getTransactions()).filter((t) => t.date === todayStr && t.status !== 'deleted');
        
        let exp = 0, inc = 0, vat = 0, wht = 0;
        todayTxns.forEach((t) => {
          if (t.type === 'expense') {
            exp += t.grandTotal;
            vat += t.vat || 0;
            wht += t.wht || 0;
          } else {
            inc += t.grandTotal;
          }
        });

        const summaryMsg = createSummaryFlexMessage(
          {
            totalExpense: exp,
            totalIncome: inc,
            netProfit: inc - exp,
            totalVat: vat,
            totalWht: wht,
            count: todayTxns.length,
            periodName: 'วันนี้',
          },
          this.dashboardUrl
        );

        await lineClient.replyMessage({
          replyToken,
          messages: [summaryMsg as any],
        });
        return;
      }

      if (lowerText.includes('เดือนนี้') || lowerText === 'สรุป' || lowerText === 'summary') {
        yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
        periodName = `ประจำเดือน ${now.getMonth() + 1}/${now.getFullYear() + 543}`;
      }

      const stats = await SheetsService.getFinancialStats(yearMonth);
      const summaryMsg = createSummaryFlexMessage(
        {
          totalExpense: stats.totalExpense,
          totalIncome: stats.totalIncome,
          netProfit: stats.netProfit,
          totalVat: stats.totalVatClaimable,
          totalWht: stats.totalWht,
          count: stats.transactionCount,
          periodName,
        },
        this.dashboardUrl
      );

      await lineClient.replyMessage({
        replyToken,
        messages: [summaryMsg as any],
      });
      return;
    }

    // Case 3: Natural Language Expense/Income Note (e.g. "จ่ายค่าน้ำมัน 1200 บาท", "ค่ากาแฟ 85 บาท")
    const extractedData = await GeminiParserService.parseTextNote(text);
    const timestamp = new Date();
    const txnId = generateTransactionId();

    const transaction: Transaction = {
      id: txnId,
      timestamp: timestamp.toISOString(),
      date: extractedData.transaction_date,
      time: extractedData.transaction_time,
      type: extractedData.type,
      category: extractedData.category,
      merchant: extractedData.merchant_name,
      taxId: null,
      subtotal: extractedData.subtotal,
      vat: extractedData.vat_amount,
      wht: extractedData.withholding_tax,
      grandTotal: extractedData.grand_total,
      paymentMethod: extractedData.payment_method,
      documentType: 'text_note',
      items: extractedData.items,
      driveFileId: null,
      driveViewUrl: null,
      source: 'line_oa',
      createdBy: userId,
      status: 'completed',
      notes: extractedData.thai_summary,
    };

    // Save to Google Sheets
    await SheetsService.appendTransaction(transaction);

    // Reply confirmation
    const flexMessage = createReceiptFlexMessage(transaction, this.dashboardUrl);
    await lineClient.replyMessage({
      replyToken,
      messages: [flexMessage as any],
    });
  }
}
