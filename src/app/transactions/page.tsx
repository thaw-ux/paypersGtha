'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Receipt,
  Plus,
  RefreshCw,
  Sparkles,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { Transaction } from '@/types/transaction';
import Link from 'next/link';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลรายการได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              รายการเอกสาร & ธุรกรรมทั้งหมด
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700">
              {transactions.length} รายการ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ฐานข้อมูลรายการค่าใช้จ่าย รายรับ และใบกำกับภาษี ซิงค์แบบ Real-time กับ Google Sheets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTransactions}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>

          <Link
            href="/scan"
            className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>สแกนบิลใหม่</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Component */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-card space-y-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลจาก Google Sheets...</p>
        </div>
      ) : (
        <TransactionTable
          initialTransactions={transactions}
          onRefresh={fetchTransactions}
        />
      )}
    </div>
  );
}
