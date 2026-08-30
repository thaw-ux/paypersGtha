# Role & Project Objective
You are a Principal Full-Stack Engineer and AI Solutions Architect.
Build a production-ready, self-hosted Financial & Expense Tracking System inspired by Paypers.ai.
The system uses:
1. **Google Drive** as the primary storage for receipt photos, bank transfer slips, and invoice PDFs.
2. **Google Sheets** as the primary database for recording, querying, and updating transaction records.
3. **Dual Client Interfaces**:
   - **LINE OA (LINE Messaging API):** Ingests receipts/slips/text notes via chat and responds with interactive LINE Flex Messages.
   - **Web Application Dashboard (Next.js + Tailwind CSS):** Modern admin web UI to browse transactions, edit Google Sheet rows in real-time, preview receipts from Google Drive, view analytical charts, and export tax reports.
4. **Google Gemini API (`gemini-1.5-flash` / `gemini-1.5-pro`):** OCR & Multimodal AI engine with strict JSON schema outputs.

---

## 1. Technical Stack & Architecture
- **Framework:** Next.js 14+ (App Router, TypeScript, Tailwind CSS, Lucide Icons, Shadcn/UI patterns)
- **AI Engine:** Google Gemini API (`@google/genai` or `@google/generative-ai`)
- **Messaging:** `@line/bot-sdk` (LINE Webhook + Push/Reply Messages + Flex Message Builder)
- **Google Workspace SDK:** `googleapis` (Authenticated via a single Google Cloud Service Account with Drive & Sheets scopes)
- **Charts / Visuals:** Recharts or Chart.js for financial analytics
- **Architecture Pattern:** Serverless API Routes / Background Task Queue pattern for non-blocking LINE Webhook responses.

---

## 2. Core Functional Modules

### Module A: Google Workspace Adapter (Sheets as DB + Drive as Storage)
1. **Google Drive Service (`lib/drive.service.ts`):**
   - Automatically check/create folder structure: `Expenses/{YYYY}/{MM}` under a configured `PARENT_FOLDER_ID`.
   - Upload file buffer (from LINE content API or Web upload) with standardized file naming: `{YYYYMMDD}_{HHmmss}_{Merchant}_{Amount}.[ext]`.
   - Store the Drive `fileId`, `webViewLink`, and provide a secure backend proxy endpoint `/api/drive/view/[fileId]` so private Google Drive images can be rendered in the web dashboard without making Drive files public.
2. **Google Sheets Service (`lib/sheets.service.ts`):**
   - Define canonical columns in Row 1:
     `[ID, Timestamp, Date, Time, Type, Category, Merchant, Tax_ID, Subtotal, VAT, WHT, Grand_Total, Payment_Method, Items_JSON, Drive_File_ID, Image_Proxy_URL, Source, Created_By, Status, Notes]`
   - Implement standard CRUD operations:
     - `appendTransaction(data)`: Appends a new row.
     - `getTransactions(queryFilters)`: Fetches and parses rows into typed JavaScript objects.
     - `updateTransaction(id, updatedData)`: Finds row by `ID` (UUID) and updates values.
     - `deleteTransaction(id)`: Soft-deletes (sets Status to 'deleted') or removes the row.

### Module B: Gemini AI Multimodal Parser (`lib/gemini.service.ts`)
- Use Gemini API with structured JSON Schema mode.
- Input: Image Buffer (Receipt/Slip/Tax Invoice) OR Text string (e.g. "เติมน้ำมัน 1,200 บาท จ่ายเงินสด").
- Output Schema:
  ```json
  {
    "type": "expense" | "income",
    "document_type": "tax_invoice" | "receipt" | "bank_slip" | "text_note" | "other",
    "merchant_name": "string",
    "tax_id": "string (13-digit Thai Tax ID if found, else null)",
    "transaction_date": "YYYY-MM-DD",
    "transaction_time": "HH:mm:ss",
    "subtotal": 0.0,
    "vat_amount": 0.0,
    "withholding_tax": 0.0,
    "grand_total": 0.0,
    "payment_method": "cash" | "bank_transfer" | "credit_card" | "promptpay" | "other",
    "category": "ค่าเดินทาง" | "ค่าอาหาร/รับรอง" | "ค่าซอฟต์แวร์/ไอที" | "ค่าอุปกรณ์สำนักงาน" | "ค่าสาธารณูปโภค" | "ค่าบริการวิชาชีพ" | "ทั่วไป",
    "items": [
      { "name": "string", "quantity": 1, "unit_price": 0.0, "total": 0.0 }
    ],
    "thai_summary": "string"
  }