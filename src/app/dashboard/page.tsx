'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { FinancialStats, Transaction } from '@/types/transaction';
import { formatThaiDate } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, txnsRes] = await Promise.all([
        fetch('/api/summary'),
        fetch('/api/transactions'),
      ]);

      const statsData = await statsRes.json();
      const txnsData = await txnsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      } else {
        throw new Error(statsData.error || 'Failed to fetch summary');
      }

      if (txnsData.success) {
        setRecentTxns(txnsData.data);
      }
    } catch (err: any) {
      console.warn('Dashboard fetch error:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-700 to-indigo-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Financial Engine Ready</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ภาพรวมการเงิน & รายจ่ายธุรกิจ
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              จัดการใบเสร็จ สลิปโอนเงิน และใบกำกับภาษีอัตโนมัติด้วย AI ผ่าน LINE OA ซิงค์เข้า Google Drive และ Google Sheets เรียลไทม์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/scan"
              className="px-5 py-3 rounded-2xl bg-white text-brand-900 hover:bg-brand-50 font-bold text-xs shadow-md transition-all hover:scale-105 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>สแกนบิลด้วย AI</span>
            </Link>
            <Link
              href="/tax-reports"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs backdrop-blur-sm transition-all inline-flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>รายงานภาษีซื้อ</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Error Alert if Google Sheets / Drive credentials not configured */}
      {error && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm">ยังไม่ได้ตั้งค่า Google Service Account หรือไม่มีข้อมูลในชีท</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {error}. กรุณาตรวจสอบไฟล์ <code>.env</code> และแชร์สิทธิ์ Google Sheet ให้กับ Service Account
              </p>
            </div>
          </div>
          <Link
            href="/settings"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap transition-colors"
          >
            ไปที่หน้าตั้งค่า & เชื่อมต่อ
          </Link>
        </div>
      )}

      {/* Financial Metric KPI Cards */}
      <MetricCards stats={stats} loading={loading} />

      {/* Visual Analytics Charts */}
      <AnalyticsCharts stats={stats} loading={loading} />

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">รายการธุรกรรมล่าสุด (Recent Transactions)</h2>
            <p className="text-xs text-slate-500">บันทึกผ่าน LINE OA และ Web Application</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <TransactionTable
          initialTransactions={recentTxns}
          onRefresh={fetchData}
        />
      </div>
    </div>
  );
}
