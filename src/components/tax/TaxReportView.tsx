'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Building,
  Percent,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatCurrency, formatThaiDate } from '@/lib/utils';

export function TaxReportView({ transactions }: { transactions: Transaction[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  // Filter transactions for input VAT report
  const monthTxns = transactions.filter(
    (t) => t.date.startsWith(selectedMonth) && t.status !== 'deleted'
  );

  // Items with VAT (ภาษีซื้อ)
  const vatTxns = monthTxns.filter((t) => t.vat > 0);

  // Items with WHT (ภาษีหัก ณ ที่จ่าย)
  const whtTxns = monthTxns.filter((t) => t.wht > 0);

  // Calculate totals
  const totalBaseVatAmount = vatTxns.reduce((sum, t) => sum + (t.subtotal || 0), 0);
  const totalVatAmount = vatTxns.reduce((sum, t) => sum + (t.vat || 0), 0);
  const totalWhtAmount = whtTxns.reduce((sum, t) => sum + (t.wht || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const exportVatCSV = () => {
    const headers = [
      'ลำดับ',
      'วันที่ตามเอกสาร',
      'เลขที่ใบกำกับภาษี/ID',
      'ชื่อผู้ประกอบการ/ร้านค้า',
      'เลขประจำตัวผู้เสียภาษี (13 หลัก)',
      'มูลค่าสินค้า/บริการ (บาท)',
      'ภาษีมูลค่าเพิ่ม 7% (บาท)',
      'ยอดรวมสุทธิ (บาท)',
    ];

    const rows = vatTxns.map((t, index) => [
      index + 1,
      `"${t.date}"`,
      `"${t.id}"`,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.taxId || '-'}"`,
      t.subtotal,
      t.vat,
      t.grandTotal,
    ]);

    // Summary row
    rows.push([
      'รวมทั้งสิ้น',
      '',
      '',
      '',
      '',
      totalBaseVatAmount,
      totalVatAmount,
      totalBaseVatAmount + totalVatAmount,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Input_VAT_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>เลือกเดือนภาษี:</span>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-medium rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl inline-flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> พิมพ์รายงาน
          </button>
          <button
            onClick={exportVatCSV}
            className="px-4 py-2 text-xs font-bold text-white bg-brand-primary hover:bg-brand-700 rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> ส่งออกรายงานภาษีซื้อ (CSV)
          </button>
        </div>
      </div>

      {/* Tax KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-card">
          <span className="text-xs text-slate-400 font-medium">มูลค่าฐานภาษีซื้อรวม (Subtotal)</span>
          <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(totalBaseVatAmount, true)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">ยอดก่อน VAT ประจำเดือน {selectedMonth}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-200 bg-gradient-to-br from-white to-brand-50/40 shadow-card">
          <span className="text-xs text-brand-600 font-semibold flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> ภาษีซื้อรวม (Claimable VAT 7%)
          </span>
          <h3 className="text-2xl font-bold font-mono text-brand-700 mt-1">
            {formatCurrency(totalVatAmount, true)}
          </h3>
          <p className="text-[11px] text-brand-500 mt-1">นำไปยื่นแบบ ภ.พ.30 หรือขอคืนภาษีได้</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/40 shadow-card">
          <span className="text-xs text-amber-600 font-semibold">ภาษีหัก ณ ที่จ่ายรวม (WHT)</span>
          <h3 className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {formatCurrency(totalWhtAmount, true)}
          </h3>
          <p className="text-[11px] text-amber-600 mt-1">ยื่นแบบ ภ.ง.ด. 3 หรือ ภ.ง.ด. 53</p>
        </div>
      </div>

      {/* Input VAT Report Table (รายงานภาษีซื้อ) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="font-bold text-slate-900 text-base">รายงานภาษีซื้อ (Input Tax Report)</h3>
            <p className="text-xs text-slate-500">
              สำหรับใช้ประกอบการยื่นแบบ ภ.พ. 30 ประจำงวดเดือน {selectedMonth}
            </p>
          </div>
          <span className="px-3 py-1 bg-brand-100 text-brand-800 text-xs font-semibold rounded-full">
            {vatTxns.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4 text-center w-12">ลำดับ</th>
                <th className="py-3 px-4">วัน/เดือน/ปี</th>
                <th className="py-3 px-4">เลขที่เอกสาร</th>
                <th className="py-3 px-4">ชื่อผู้ขายสินค้า / ผู้ให้บริการ</th>
                <th className="py-3 px-4">เลขประจำตัวผู้เสียภาษี</th>
                <th className="py-3 px-4 text-right">มูลค่าสินค้า (บาท)</th>
                <th className="py-3 px-4 text-right">ภาษีมูลค่าเพิ่ม 7%</th>
                <th className="py-3 px-4 text-right">ยอดรวมสุทธิ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vatTxns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่พบรายการภาษีซื้อในงวดเดือนที่เลือก
                  </td>
                </tr>
              ) : (
                vatTxns.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{formatThaiDate(t.date)}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{t.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.merchant}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{t.taxId || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(t.subtotal, false)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-brand-700">
                      {formatCurrency(t.vat, false)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(t.grandTotal, true)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {vatTxns.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50/90 font-bold border-t border-slate-200 text-xs">
                  <td colSpan={5} className="py-3.5 px-4 text-right text-slate-700">
                    รวมทั้งสิ้น (Total)
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(totalBaseVatAmount, false)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-brand-700">
                    {formatCurrency(totalVatAmount, false)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(totalBaseVatAmount + totalVatAmount, true)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
