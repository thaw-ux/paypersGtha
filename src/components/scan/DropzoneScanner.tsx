'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  Percent,
  Save,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { GeminiExtractionResult, Transaction } from '@/types/transaction';
import { formatCurrency, formatThaiDate } from '@/lib/utils';
import Link from 'next/link';

export function DropzoneScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<GeminiExtractionResult | null>(null);
  const [savedTransaction, setSavedTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      setError('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG) หรือไฟล์ PDF');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setScanResult(null);
    setSavedTransaction(null);

    // Create local preview
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const startScan = async (autoSave: boolean = false) => {
    if (!file) return;
    setIsScanning(true);
    setError(null);
    setSavedTransaction(null);

    const formData = new FormData();
    formData.append('file', file);
    if (autoSave) {
      formData.append('saveImmediately', 'true');
    }

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'การอ่านเอกสารด้วย AI ล้มเหลว');
      }

      if (autoSave) {
        setSavedTransaction(data.data);
        setScanResult(data.extraction);
      } else {
        setScanResult(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสแกน');
    } finally {
      setIsScanning(false);
    }
  };

  const saveToCloud = async () => {
    if (!file || !scanResult) return;
    setIsSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('saveImmediately', 'true');

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'บันทึกล้มเหลว');

      setSavedTransaction(data.data);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 ${
          file
            ? 'border-brand-300 bg-brand-50/30'
            : 'border-slate-300 hover:border-brand-400 bg-white hover:bg-slate-50/80 shadow-card'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
          }}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 mx-auto flex items-center justify-center shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {file ? file.name : 'ลากไฟล์ใบเสร็จ / สลิปโอนเงิน มาวางที่นี่'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              รองรับไฟล์รูปภาพ JPG, PNG หรือเอกสาร PDF (เช่น บิล 7-11, ปั๊มน้ำมัน, สลิปธนาคาร, ใบกำกับภาษี)
            </p>
          </div>

          {file && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>ขนาดไฟล์: {(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Scan Buttons */}
      {file && !isScanning && !scanResult && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => startScan(false)}
            className="px-6 py-3 rounded-2xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 inline-flex items-center gap-2 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>อ่านข้อมูลด้วย Gemini AI</span>
          </button>
          <button
            onClick={() => startScan(true)}
            className="px-6 py-3 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md inline-flex items-center gap-2 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>อ่านและบันทึกเข้า Google Drive & Sheets ทันที</span>
          </button>
        </div>
      )}

      {/* Scanning Indicator */}
      {isScanning && (
        <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-card space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">Gemini AI กำลังวิเคราะห์เอกสาร...</h4>
            <p className="text-xs text-slate-500 mt-1">
              กำลังอ่านชื่อร้านค้า, ยอดรวมสุทธิ, ภาษีมูลค่าเพิ่ม (VAT 7%), เลขประจำตัวผู้เสียภาษี 13 หลัก
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification after Save */}
      {savedTransaction && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl text-emerald-900 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">บันทึกข้อมูลเรียบร้อยแล้ว!</h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                จัดเก็บไฟล์ลง Google Drive และบันทึกแถวข้อมูลลง Google Sheets เรียบร้อย (ID: {savedTransaction.id})
              </p>
            </div>
          </div>
          <Link
            href="/transactions"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-4 h-4" /> ดูในตาราง
          </Link>
        </div>
      )}

      {/* Scan Results Split Review Box */}
      {scanResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
          {/* Left: Original Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center bg-slate-900 p-4 rounded-2xl text-white">
            <div className="w-full text-xs text-slate-400 mb-2 flex items-center justify-between">
              <span>ภาพเอกสารต้นฉบับ</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {scanResult.document_type}
              </span>
            </div>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Receipt Preview"
                className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
              />
            ) : (
              <div className="p-12 text-slate-500 text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">ไฟล์เอกสาร PDF</p>
              </div>
            )}
          </div>

          {/* Right: AI Extracted Fields */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                    AI OCR Result
                  </span>
                  <h3 className="font-bold text-slate-900 text-lg mt-1">
                    {scanResult.merchant_name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">ยอดรวมสุทธิ</span>
                  <span className="text-2xl font-bold font-mono text-rose-600">
                    {formatCurrency(scanResult.grand_total, true)}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">วันที่ / เวลา</span>
                  <span className="font-semibold text-slate-800">
                    {formatThaiDate(scanResult.transaction_date)} {scanResult.transaction_time}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">หมวดหมู่</span>
                  <span className="font-semibold text-brand-700">{scanResult.category}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">ช่องทางชำระ</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {scanResult.payment_method}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">ยอดก่อนภาษี</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {formatCurrency(scanResult.subtotal, true)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">VAT 7%</span>
                  <span className="font-semibold text-brand-700 font-mono">
                    {formatCurrency(scanResult.vat_amount, true)}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">เลขผู้เสียภาษี (Tax ID)</span>
                  <span className="font-semibold font-mono text-slate-800">
                    {scanResult.tax_id || '-'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              {scanResult.items && scanResult.items.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">รายการสินค้าในบิล:</span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {scanResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600">
                        <span>• {it.name} {it.quantity && it.quantity > 1 ? `x${it.quantity}` : ''}</span>
                        <span className="font-mono">{formatCurrency(it.total, true)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Summary note */}
              <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-100 text-xs text-brand-900">
                <b>💡 สรุปรายการ:</b> {scanResult.thai_summary}
              </div>
            </div>

            {/* Bottom Actions */}
            {!savedTransaction && (
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    setScanResult(null);
                    setFile(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={saveToCloud}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-primary text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 inline-flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'กำลังจัดเก็บ...' : 'ยืนยัน & บันทึกลง Google Drive + Sheets'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
