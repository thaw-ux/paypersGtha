export type TransactionType = 'expense' | 'income';

export type DocumentType = 
  | 'tax_invoice'      // ใบกำกับภาษี (เต็มรูป/อย่างย่อ)
  | 'receipt'          // ใบเสร็จรับเงิน
  | 'bank_slip'        // สลิปโอนเงินธนาคาร
  | 'text_note'        // บันทึกข้อความสั้น
  | 'other';           // เอกสารอื่นๆ

export type PaymentMethod = 
  | 'cash'             // เงินสด
  | 'bank_transfer'    // โอนเงินผ่านธนาคาร
  | 'credit_card'      // บัตรเครดิต/เดบิต
  | 'promptpay'        // พร้อมเพย์
  | 'other';

export type ExpenseCategory = 
  | 'ค่าเดินทาง'
  | 'ค่าอาหาร/รับรอง'
  | 'ค่าซอฟต์แวร์/ไอที'
  | 'ค่าอุปกรณ์สำนักงาน'
  | 'ค่าสาธารณูปโภค'
  | 'ค่าบริการวิชาชีพ'
  | 'ค่าเช่า/สถานที่'
  | 'ค่าการตลาด/โฆษณา'
  | 'ค่าใช้จ่ายทั่วไป'
  | 'รายได้จากการขาย'
  | 'รายได้จากการบริการ'
  | 'รายได้อื่นๆ';

export interface TransactionItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
}

export interface Transaction {
  id: string;                      // UUID or TXN-YYYYMMDD-XXXX
  timestamp: string;               // ISO 8601 creation timestamp
  date: string;                    // YYYY-MM-DD (Date on receipt)
  time: string;                    // HH:mm:ss (Time on receipt)
  type: TransactionType;           // expense or income
  category: string;                // Expense or Income Category
  merchant: string;                // Merchant / Store / Company name
  taxId?: string | null;           // 13-digit Thai Tax ID (เลขประจำตัวผู้เสียภาษี)
  subtotal: number;                // Amount before tax
  vat: number;                     // 7% VAT amount
  wht: number;                     // Withholding tax amount (หัก ณ ที่จ่าย 1%, 3%, 5%)
  grandTotal: number;              // Net grand total
  paymentMethod: PaymentMethod;    // Payment method
  documentType: DocumentType;      // Document type
  items?: TransactionItem[];       // Line items
  driveFileId?: string | null;     // Google Drive File ID
  driveViewUrl?: string | null;    // View URL or proxy URL
  source: 'line_oa' | 'web_app' | 'manual';
  createdBy: string;               // LINE User ID or User name
  status: 'completed' | 'pending_review' | 'deleted';
  notes?: string;                  // AI Thai summary or notes
}

export interface GeminiExtractionResult {
  type: TransactionType;
  document_type: DocumentType;
  merchant_name: string;
  tax_id: string | null;
  transaction_date: string;        // YYYY-MM-DD
  transaction_time: string;        // HH:mm:ss
  subtotal: number;
  vat_amount: number;
  withholding_tax: number;
  grand_total: number;
  payment_method: PaymentMethod;
  category: string;
  items: TransactionItem[];
  thai_summary: string;
  confidence_score?: number;
}

export interface FinancialStats {
  totalExpense: number;
  totalIncome: number;
  netProfit: number;
  totalVatClaimable: number;
  totalWht: number;
  transactionCount: number;
  categoryBreakdown: { category: string; amount: number; percentage: number; count: number }[];
  monthlyTrends: { month: string; expense: number; income: number }[];
  paymentMethodBreakdown: { method: string; amount: number }[];
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
  category?: string;
  status?: string;
  search?: string;
  documentType?: string;
}
