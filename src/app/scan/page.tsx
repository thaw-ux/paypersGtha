'use client';

import React from 'react';
import { Sparkles, Receipt, ShieldCheck, Zap, FileSpreadsheet, HardDrive } from 'lucide-react';
import { DropzoneScanner } from '@/components/scan/DropzoneScanner';

export default function ScanPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Multimodal Gemini OCR Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          สแกนและอ่านเอกสารการเงินด้วย AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          อัปโหลดรูปภาพใบเสร็จ สลิปโอนเงิน หรือใบกำกับภาษี ระบบจะใช้ Gemini AI สกัดชื่อร้านค้า, ยอดเงิน, VAT 7%, เลขประจำตัวผู้เสียภาษี 13 หลัก และจัดเก็บเข้า Google Drive และ Google Sheets อัตโนมัติ
        </p>
      </div>

      {/* Main Scanner Dropzone */}
      <DropzoneScanner />

      {/* Feature Highlights / Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 border border-brand-100 flex-shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">รองรับเอกสารภาษาไทยทุกชนิด</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              บิล 7-Eleven, Makro, Lotus&apos;s, ปั๊มน้ำมัน ปตท./บางจาก, สลิปโอนเงินธนาคาร (KBank, SCB, PromptPay), ใบกำกับภาษีเต็มรูป/อย่างย่อ
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">แยกโฟลเดอร์ Google Drive อัตโนมัติ</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              จัดโครงสร้างไฟล์ตามปี/เดือน เช่น <code>Expenses/2026/08/...</code> ปลอดภัยใน Cloud ส่วนตัวของคุณเอง
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900">Sync ตรงเข้า Google Sheets</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              บันทึกคอลัมน์มาตรฐานพร้อมคำนวณ VAT 7% และหัก ณ ที่จ่าย เพื่อนำไปทำบัญชีต่อได้ทันที
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
