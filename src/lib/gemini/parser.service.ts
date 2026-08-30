import { getGeminiClient, CANDIDATE_MODELS } from './client';
import { RECEIPT_EXTRACTION_PROMPT, TEXT_NOTE_EXTRACTION_PROMPT } from './prompts';
import { GeminiExtractionResult } from '@/types/transaction';

export class GeminiParserService {
  /**
   * Parse Receipt / Tax Invoice / Bank Slip Image
   */
  static async parseReceiptImage(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg'
  ): Promise<GeminiExtractionResult> {
    const genAI = getGeminiClient();
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType || 'image/jpeg',
      },
    };

    let rawText = '';
    let lastError: any = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent([RECEIPT_EXTRACTION_PROMPT, imagePart]);
        rawText = result.response.text();
        if (rawText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed:`, err.message || err);
      }
    }

    if (!rawText && lastError) {
      throw new Error(`Gemini OCR failed: ${lastError.message || 'All models failed'}`);
    }

    return this.cleanAndParseJSON(rawText);
  }

  /**
   * Parse Natural Language Thai Text Note
   */
  static async parseTextNote(text: string): Promise<GeminiExtractionResult> {
    const genAI = getGeminiClient();
    const currentDate = new Date().toISOString().slice(0, 10);
    const currentTime = new Date().toTimeString().slice(0, 8);
    const promptWithContext = `${TEXT_NOTE_EXTRACTION_PROMPT}\n\nCurrent Date: ${currentDate}, Current Time: ${currentTime}\n\nUser Message: "${text}"`;

    let rawText = '';
    let lastError: any = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });
        const result = await model.generateContent(promptWithContext);
        rawText = result.response.text();
        if (rawText) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!rawText && lastError) {
      throw new Error(`Gemini text parsing failed: ${lastError.message}`);
    }

    return this.cleanAndParseJSON(rawText);
  }

  /**
   * Clean JSON response and map fallback defaults
   */
  private static cleanAndParseJSON(text: string): GeminiExtractionResult {
    let cleanJson = text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanJson);
      const today = new Date().toISOString().slice(0, 10);
      const timeNow = new Date().toTimeString().slice(0, 8);

      const grandTotal = typeof parsed.grand_total === 'number' ? parsed.grand_total : parseFloat(parsed.grand_total) || 0;
      let subtotal = typeof parsed.subtotal === 'number' ? parsed.subtotal : parseFloat(parsed.subtotal) || 0;
      let vat = typeof parsed.vat_amount === 'number' ? parsed.vat_amount : parseFloat(parsed.vat_amount) || 0;
      const wht = typeof parsed.withholding_tax === 'number' ? parsed.withholding_tax : parseFloat(parsed.withholding_tax) || 0;

      if (subtotal === 0 && grandTotal > 0) {
        if (vat > 0) {
          subtotal = Math.round((grandTotal - vat) * 100) / 100;
        } else {
          subtotal = grandTotal;
        }
      }

      return {
        type: parsed.type === 'income' ? 'income' : 'expense',
        document_type: parsed.document_type || 'receipt',
        merchant_name: parsed.merchant_name || 'ไม่ระบุร้านค้า',
        tax_id: parsed.tax_id || null,
        transaction_date: parsed.transaction_date || today,
        transaction_time: parsed.transaction_time || timeNow,
        subtotal,
        vat_amount: vat,
        withholding_tax: wht,
        grand_total: grandTotal,
        payment_method: parsed.payment_method || 'other',
        category: parsed.category || 'ค่าใช้จ่ายทั่วไป',
        items: Array.isArray(parsed.items) ? parsed.items : [],
        thai_summary: parsed.thai_summary || `บันทึกรายการ ${parsed.merchant_name || ''} ยอดรวม ${grandTotal} บาท`,
      };
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', text, e);
      throw new Error(`AI extraction error: Unable to parse structured JSON data from OCR.`);
    }
  }

  /**
   * Health Check
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const genAI = getGeminiClient();
      let lastErr = '';
      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent('ping');
          if (result.response.text()) return { success: true };
        } catch (e: any) {
          lastErr = e.message || String(e);
        }
      }
      return { success: false, error: lastErr || 'Gemini test failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gemini API test failed' };
    }
  }
}
