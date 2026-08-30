'use client';

import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { TaxReportView } from '@/components/tax/TaxReportView';
import { Transaction } from '@/types/transaction';

export default function TaxReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTxns = async () => {
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
      setError(err.message || 'ไม่สามารถดึงข้อมูลสำหรับทำรายงานภาษีได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxns();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          รายงานภาษีซื้อ & บัญชี (Tax & VAT Reports)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          สรุปรายงานภาษีมูลค่าเพิ่ม 7% (ภ.พ. 30) และรายงานภาษีหัก ณ ที่จ่าย (ภ.ง.ด. 3, 53) เพื่อส่งต่อสำนักงานบัญชี
        </p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-card space-y-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">กำลังเตรียมข้อมูลรายงานภาษี...</p>
        </div>
      ) : (
        <TaxReportView transactions={transactions} />
      )}
    </div>
  );
}
