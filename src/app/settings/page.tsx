'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  HardDrive,
  FileSpreadsheet,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Wrench,
} from 'lucide-react';

export default function SettingsPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/line/webhook`
    : 'https://your-domain.com/api/line/webhook';

  const checkStatus = async () => {
    setLoading(true);
    setInitResult(null);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();
      if (data.success) {
        setDiagnostics(data.diagnostics);
      }
    } catch (err) {
      console.warn('Diagnostics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitDatabase = async () => {
    setIsInitializing(true);
    setInitResult(null);
    try {
      const res = await fetch('/api/setup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setInitResult(`สำเร็จ: ${data.message}`);
        await checkStatus();
      } else {
        throw new Error(data.error || 'Initialization failed');
      }
    } catch (err: any) {
      setInitResult(`เกิดข้อผิดพลาด: ${err.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            การตั้งค่า & สถานะการเชื่อมต่อ (Settings & Diagnostics)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบความพร้อมของระบบ Google Workspace, Gemini AI และ LINE OA Webhook
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>ตรวจสอบสถานะใหม่</span>
        </button>
      </div>

      {/* Connection Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Gemini AI Engine</h3>
                <p className="text-[11px] text-slate-400">OCR & Multimodal Document Extractor</p>
              </div>
            </div>
            {diagnostics?.gemini?.status === 'connected' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> ต้องตั้งค่า Key
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
            {diagnostics?.gemini?.details || 'กำลังตรวจสอบ...'}
          </div>
        </div>

        {/* Google Sheets Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Sheets Database</h3>
                <p className="text-[11px] text-slate-400">ฐานข้อมูลบันทึกธุรกรรม Real-time</p>
              </div>
            </div>
            {diagnostics?.sheets?.status === 'connected' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> ยังไม่เชื่อมต่อ
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
            {diagnostics?.sheets?.details || 'กำลังตรวจสอบ...'}
          </div>
        </div>

        {/* Google Drive Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Drive Cloud Storage</h3>
                <p className="text-[11px] text-slate-400">จัดเก็บรูปภาพและเอกสาร PDF แยกปี/เดือน</p>
              </div>
            </div>
            {diagnostics?.drive?.status === 'connected' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> เชื่อมต่อแล้ว
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> ตรวจสอบสิทธิ์
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
            {diagnostics?.drive?.details || 'กำลังตรวจสอบ...'}
          </div>
        </div>

        {/* LINE OA Webhook Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-green-50 text-green-600 border border-green-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">LINE Official Account Webhook</h3>
                <p className="text-[11px] text-slate-400">ช่องทางรับรูปและตอบกลับ Flex Messages</p>
              </div>
            </div>
            {diagnostics?.line?.status === 'configured' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> ตั้งค่าคีย์แล้ว
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> ขาด Channel Token/Secret
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="font-mono truncate mr-2">{webhookUrl}</span>
            <button
              onClick={() => copyToClipboard(webhookUrl)}
              className="p-1 text-brand-600 hover:text-brand-700"
              title="Copy URL"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* One-Click Database Initialization */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-brand-100 text-brand-700 rounded-2xl">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">ตัวช่วยสร้างฐานข้อมูลอัตโนมัติ (Database Auto-Init)</h3>
            <p className="text-xs text-slate-500">
              สร้าง Header Columns ใน Google Sheet และสร้างโฟลเดอร์ <code>Expenses/2026/08</code> ใน Google Drive อัตโนมัติ
            </p>
          </div>
        </div>

        {initResult && (
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl text-xs text-brand-900 font-medium">
            {initResult}
          </div>
        )}

        <div>
          <button
            onClick={handleInitDatabase}
            disabled={isInitializing}
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isInitializing ? 'animate-spin' : ''}`} />
            <span>{isInitializing ? 'กำลังเตรียมฐานข้อมูล...' : 'เริ่มสร้าง Header Columns ใน Google Sheet'}</span>
          </button>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-card space-y-6">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">คู่มือการเชื่อมต่อสำหรับใช้งานจริง (Setup Guide)</h3>
          <p className="text-xs text-slate-500">ขั้นตอนการตั้งค่า 3 ส่วนหลักเพื่อให้ระบบทำงานสมบูรณ์แบบ 100%</p>
        </div>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">1</span>
              Google Cloud Service Account (สำหรับ Google Drive & Google Sheets)
            </h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-2">
              <li>สร้าง Service Account ใน Google Cloud Console และดาวน์โหลดไฟล์ JSON Key</li>
              <li>เปิดสิทธิ์ API: <b>Google Drive API</b> และ <b>Google Sheets API</b></li>
              <li>สร้าง Google Sheet เปล่า และแชร์สิทธิ์แบบ <b>Editor</b> ให้กับอีเมล Service Account (เช่น <code>xxx@project.iam.gserviceaccount.com</code>)</li>
              <li>สร้างโฟลเดอร์ใน Google Drive และแชร์สิทธิ์แบบ <b>Editor</b> ให้กับอีเมล Service Account เช่นเดียวกัน</li>
              <li>คัดลอก Sheet ID และ Drive Folder ID ใส่ใน <code>.env</code></li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">2</span>
              Google Gemini API (สำหรับ OCR เอกสาร)
            </h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-2">
              <li>ขอ API Key ฟรีได้จาก <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-brand-600 underline">Google AI Studio</a></li>
              <li>นำ Key ที่ได้มากรอกในช่อง <code>GEMINI_API_KEY=...</code> ในไฟล์ <code>.env</code></li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">3</span>
              LINE Official Account (LINE Messaging API)
            </h4>
            <ul className="list-disc list-inside text-slate-600 space-y-1 pl-2">
              <li>เข้าไปที่ <a href="https://developers.line.biz/" target="_blank" rel="noreferrer" className="text-brand-600 underline">LINE Developers Console</a> สร้าง Messaging API Channel</li>
              <li>คัดลอก <b>Channel Secret</b> และ <b>Channel Access Token (long-lived)</b> ใส่ใน <code>.env</code></li>
              <li>ในหน้า Messaging API ให้กรอก Webhook URL เป็น <code>{webhookUrl}</code> แล้วกด <b>Verify</b> และเปิด <b>Use Webhook</b></li>
              <li>ในหน้า LINE Official Account Manager ให้ปิด Auto-reply messages และเปิด Webhook mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
