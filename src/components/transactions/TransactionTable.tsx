'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Paperclip,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Transaction, TransactionType, DocumentType } from '@/types/transaction';
import { formatCurrency, formatThaiDate } from '@/lib/utils';
import { ReceiptModal } from './ReceiptModal';

interface TransactionTableProps {
  initialTransactions: Transaction[];
  onRefresh?: () => void;
}

export function TransactionTable({ initialTransactions, onRefresh }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [docFilter, setDocFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Extract distinct categories
  const categories = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean)));

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    if (t.status === 'deleted') return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (docFilter !== 'all' && t.documentType !== docFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (dateFilter && !t.date.startsWith(dateFilter)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.merchant.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.taxId && t.taxId.includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handleUpdate = (updatedTxn: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTxn.id ? updatedTxn : t))
    );
    setSelectedTxn(updatedTxn);
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Date',
      'Time',
      'Type',
      'Category',
      'Merchant',
      'Tax_ID',
      'Subtotal',
      'VAT',
      'WHT',
      'Grand_Total',
      'Payment_Method',
      'Document_Type',
      'Drive_File_ID',
      'Status',
      'Notes',
    ];

    const rows = filtered.map((t) => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.taxId || ''}"`,
      t.subtotal,
      t.vat,
      t.wht,
      t.grandTotal,
      `"${t.paymentMethod}"`,
      `"${t.documentType}"`,
      `"${t.driveFileId || ''}"`,
      `"${t.status}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Paypers_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาร้านค้า, หมวดหมู่, เลขบิล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="all">ทุกประเภท (รายรับ/รายจ่าย)</option>
            <option value="expense">💸 รายจ่าย (Expense)</option>
            <option value="income">💰 รายรับ (Income)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-brand-500 font-medium text-slate-700 max-w-[180px]"
          >
            <option value="all">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Document Type Filter */}
          <select
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
            className="w-full sm:w-auto text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 focus:ring-2 focus:ring-brand-500 font-medium text-slate-700"
          >
            <option value="all">ทุกเอกสาร</option>
            <option value="tax_invoice">🧾 ใบกำกับภาษี</option>
            <option value="receipt">📄 ใบเสร็จรับเงิน</option>
            <option value="bank_slip">🏦 สลิปโอนเงิน</option>
            <option value="text_note">✍️ ข้อความสั้น</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"
              title="รีเฟรชข้อมูลจาก Google Sheets"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 text-slate-700 hover:bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">วันที่ / เวลา</th>
                <th className="py-3.5 px-4">ร้านค้า / รายการ</th>
                <th className="py-3.5 px-4">หมวดหมู่</th>
                <th className="py-3.5 px-4">ชนิดเอกสาร</th>
                <th className="py-3.5 px-4 text-right">ยอดก่อนภาษี</th>
                <th className="py-3.5 px-4 text-right">VAT 7%</th>
                <th className="py-3.5 px-4 text-right">ยอดสุทธิ</th>
                <th className="py-3.5 px-4 text-center">Drive</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-slate-400 mt-1">
                      ส่งรูปใบเสร็จเข้า LINE หรือคลิกปุ่ม &quot;สแกนบิลด้วย AI&quot; เพื่อเพิ่มข้อมูล
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => {
                  const isExpense = txn.type === 'expense';
                  return (
                    <tr
                      key={txn.id}
                      onClick={() => {
                        setSelectedTxn(txn);
                        setIsModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{formatThaiDate(txn.date)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{txn.time || '-'}</div>
                      </td>

                      {/* Merchant & Tax ID */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]">
                          {txn.merchant}
                        </div>
                        {txn.taxId ? (
                          <div className="text-[10px] font-mono text-slate-400">
                            Tax ID: {txn.taxId}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 capitalize">{txn.source}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-50 text-brand-700 border border-brand-100">
                          {txn.category || 'ทั่วไป'}
                        </span>
                      </td>

                      {/* Document Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {txn.documentType === 'tax_invoice' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🧾 ใบกำกับภาษี
                          </span>
                        )}
                        {txn.documentType === 'receipt' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            📄 ใบเสร็จ
                          </span>
                        )}
                        {txn.documentType === 'bank_slip' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            🏦 สลิปโอนเงิน
                          </span>
                        )}
                        {txn.documentType === 'text_note' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            ✍️ ข้อความ
                          </span>
                        )}
                        {!['tax_invoice', 'receipt', 'bank_slip', 'text_note'].includes(txn.documentType) && (
                          <span className="text-[10px] text-slate-400">อื่นๆ</span>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap text-slate-600 font-mono">
                        {formatCurrency(txn.subtotal, false)}
                      </td>

                      {/* VAT 7% */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                        {txn.vat > 0 ? (
                          <span className="text-brand-600 font-semibold">
                            {formatCurrency(txn.vat, false)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold font-mono">
                        <span className={isExpense ? 'text-rose-600' : 'text-emerald-600'}>
                          {isExpense ? '-' : '+'} {formatCurrency(txn.grandTotal, true)}
                        </span>
                      </td>

                      {/* Google Drive Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {txn.driveFileId || txn.driveViewUrl ? (
                          <span
                            className="p-1 rounded-md bg-emerald-50 text-emerald-600 inline-block"
                            title="มีไฟล์รูปภาพแนบ"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(txn);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          title="ดูและแก้ไขเอกสาร"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Counter */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <span>
            แสดงทั้งหมด <b>{filtered.length}</b> จาก {transactions.length} รายการ
          </span>
          <span className="text-[11px] text-slate-400">
            * ซิงค์ข้อมูลกับ Google Sheets อัตโนมัติ
          </span>
        </div>
      </div>

      {/* Side-by-side Modal */}
      <ReceiptModal
        transaction={selectedTxn}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
