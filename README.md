# 🧾 Paypers AI - Self-Hosted Financial & Expense Management

ระบบจัดการใบเสร็จ สลิปโอนเงิน และเอกสารการเงินอัตโนมัติด้วย **Gemini AI** บันทึกรูปเข้า **Google Drive** และเก็บข้อมูลลง **Google Sheets** รองรับการใช้งาน 2 ทาง: **LINE OA** และ **Web Application Dashboard**

---

## 🌟 ฟีเจอร์เด่น (Key Features)

1. **📱 LINE OA Integration (ส่งบิลผ่านแชท LINE):**
   - ส่งรูปใบเสร็จ, สลิปโอนเงิน, ใบกำกับภาษี หรือพิมพ์ข้อความใน LINE
   - Gemini AI อ่านข้อมูล: ชื่อร้านค้า, ยอดเงิน, VAT 7%, หัก ณ ที่จ่าย, เลขประจำตัวผู้เสียภาษี 13 หลัก และรายการสินค้า
   - อัปโหลดรูปภาพลง Google Drive แยกโฟลเดอร์ตามปี/เดือนอัตโนมัติ (เช่น `/Expenses/2026/08/`)
   - บันทึกลง Google Sheet แบบ Real-time ทันที
   - ตอบกลับด้วย **LINE Flex Message** สวยงาม พร้อมปุ่มเปิดดูและแก้ไขในเว็บ
   - พิมพ์คำสั่งสรุปยอด เช่น *"สรุปวันนี้"*, *"สรุปเดือนนี้"* ในแชทได้ทันที

2. **💻 Web Application Dashboard:**
   - **แดชบอร์ดภาพรวม (Overview):** สรุปยอดรายจ่ายรวม, รายรับรวม, กำไรสุทธิ, ภาษีซื้อที่ขอคืนได้ (VAT 7%) และกราฟแนวโน้มรายรับ-รายจ่าย
   - **รายการเอกสาร & ธุรกรรม (Transactions Explorer):** ค้นหา กรองหมวดหมู่ กรองชนิดเอกสาร พร้อมระบบ **Split-View Modal** (ซ้ายดูรูปจาก Google Drive ขวาแก้ไขข้อมูลใน Sheet)
   - **สแกนบิลด้วย AI (AI Live Scanner):** ลากไฟล์วางบนหน้าเว็บ มี Live AI OCR Preview ให้ตรวจทานก่อนกดยืนยันบันทึก
   - **รายงานภาษี & บัญชี (Tax Reports):** ตารางรายงานภาษีซื้อ (Input Tax ภ.พ.30) และรายงานภาษีหัก ณ ที่จ่าย (WHT ภ.ง.ด.3, 53) พร้อมปุ่ม Export CSV และสั่ง Print
   - **ตั้งค่า & การเชื่อมต่อ (Settings & Health Check):** ตรวจสอบสถานะการเชื่อมต่อ และปุ่มกดสร้าง Header Columns ใน Google Sheet อัตโนมัติ

---

## 🚀 วิธีการติดตั้งและเริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables (`.env`)
คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local` หรือ `.env`:
```bash
cp .env.example .env.local
```

กรอกข้อมูลสำคัญ 4 ส่วน:
```env
# 1. Google Gemini AI Key (ขอฟรีได้ที่ https://aistudio.google.com/)
GEMINI_API_KEY=AIzaSy...

# 2. Google Cloud Service Account (เปิดสิทธิ์ Google Drive API & Google Sheets API)
GOOGLE_SERVICE_ACCOUNT_EMAIL=paypers-service@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# 3. Google Sheet & Drive IDs
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SHEET_NAME=Transactions
GOOGLE_DRIVE_FOLDER_ID=your_drive_folder_id_here

# 4. LINE Messaging API (ได้จาก https://developers.line.biz/)
LINE_CHANNEL_SECRET=your_line_channel_secret_here
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token_here

# 5. App Host URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. แชร์สิทธิ์ Google Sheet และ Google Drive
- นำอีเมล Service Account (เช่น `xxx@your-project.iam.gserviceaccount.com`) ไปกด **Share (แชร์)** ใน Google Sheet และ Google Drive Folder โดยให้สิทธิ์เป็น **Editor**

### 4. รันโปรแกรมในเครื่อง (Development Mode)
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

### 5. เชื่อมต่อ LINE Webhook
- ไปที่หน้า **Settings** (`/settings`) ในเว็บ
- คัดลอก URL Webhook (เช่น `https://your-domain.com/api/line/webhook`) ไปกรอกใน LINE Developers Console ในแท็บ **Messaging API** -> **Webhook URL** -> กด **Verify** -> เปิด **Use Webhook**
