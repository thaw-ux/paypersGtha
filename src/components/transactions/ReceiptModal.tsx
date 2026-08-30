'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Save,
  Trash2,
  FileText,
  Building,
  Calendar,
  Clock,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Tag,
  CreditCard,
  Plus,
  Trash,
} from 'lucide-react';
import { Transaction, TransactionItem } from '@/types/transaction';
import { formatCurrency, formatThaiDate } from '@/lib/utils';

interface ReceiptModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedTxn: Transaction) => void;
  onDelete: (id: string) => void;
}

export function ReceiptModal({
  transaction,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ReceiptModalProps) {
  if (!isOpen || !transaction) return null;

  const [formData, setFormData] = useState<Transaction>({ ...transaction });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field: keyof Transaction, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calculate grand total if subtotal/vat/wht changes
      if (field === 'subtotal' || field === 'vat' || field === 'wht') {
        const sub = field === 'subtotal' ? parseFloat(value) || 0 : next.subtotal;
        const vat = field === 'vat' ? parseFloat(value) || 0 : next.vat;
        const wht = field === 'wht' ? parseFloat(value) || 0 : next.wht;
        next.grandTotal = Math.round((sub + vat - wht) * 100) / 100;
      }
      return next;
    });
  };

  const handleItemChange = (index: number, field: keyof TransactionItem, value: any) => {
    const nextItems = [...(formData.items || [])];
    nextItems[index] = { ...nextItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? parseFloat(value) || 1 : nextItems[index].quantity || 1;
      const u = field === 'unitPrice' ? parseFloat(value) || 0 : nextItems[index].unitPrice || 0;
      nextItems[index].total = Math.round(q * u * 100) / 100;
    }
    setFormData((prev) => ({ ...prev, items: nextItems }));
  };

  const handleAddItem = () => {
    const nextItems = [...(formData.items || []), { name: '', quantity: 1, unitPrice: 0, total: 0 }];
    setFormData((prev) => ({ ...prev, items: nextItems }));
  };

  const handleRemoveItem = (index: number) => {
    const nextItems = (formData.items || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: nextItems }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/transactions/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update');

      setSaveStatus('success');
      onUpdate(formData);
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMessage(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`คุณต้องการลบรายการ "${formData.merchant}" ใช่หรือไม่?`)) return;
    try {
      await fetch(`/api/transactions/${formData.id}`, { method: 'DELETE' });
      onDelete(formData.id);
      onClose();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    }
  };

  const imageSrc = formData.driveFileId
    ? `/api/drive/view/${formData.driveFileId}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-100 text-brand-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-lg">
                  {formData.merchant || 'รายละเอียดเอกสาร'}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-600">
                  {formData.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                บันทึกเมื่อ {formatThaiDate(formData.timestamp)} ผ่าน {formData.source}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-xs font-medium inline-flex items-center gap-1.5"
              title="ลบรายการ"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">ลบรายการ</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content: Split 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* Left Column: Image Preview (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-900 flex flex-col justify-between items-center text-white min-h-[350px]">
            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>ภาพเอกสารจาก Google Drive</span>
              {formData.driveViewUrl && (
                <a
                  href={formData.driveViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1"
                >
                  เปิดใน Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex-1 w-full flex items-center justify-center bg-slate-950/60 rounded-2xl overflow-hidden border border-slate-800 p-2 relative group">
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={formData.merchant}
                  className="max-h-[420px] w-auto object-contain rounded-lg group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">ไม่มีรูปภาพแนบในรายการนี้</p>
                  <p className="text-xs text-slate-600 mt-1">(สร้างจากข้อความหรือบันทึกด้วยมือ)</p>
                </div>
              )}
            </div>

            {formData.notes && (
              <div className="w-full mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                <span className="font-semibold text-slate-200">🤖 สรุปจาก AI:</span> {formData.notes}
              </div>
            )}
          </div>

          {/* Right Column: Editable Form (7 cols) */}
          <form onSubmit={handleSave} className="lg:col-span-7 p-6 space-y-4 bg-white overflow-y-auto">
            {saveStatus === 'success' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                บันทึกการแก้ไขลง Google Sheets เรียบร้อยแล้ว!
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ประเภทธุรกรรม
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="expense">💸 รายจ่าย (Expense)</option>
                  <option value="income">💰 รายรับ (Income)</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-brand-600" /> หมวดหมู่
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  placeholder="เช่น ค่าเดินทาง, ค่าอาหาร/รับรอง"
                />
              </div>

              {/* Merchant */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brand-600" /> ชื่อร้านค้า / บริษัทคู่ค้า
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) => handleChange('merchant', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-900"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-600" /> วันที่ตามเอกสาร
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-brand-600" /> เวลาในเอกสาร
                </label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={(e) => handleChange('time', e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  placeholder="HH:mm:ss"
                />
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  เลขประจำตัวผู้เสียภาษี (13 หลัก)
                </label>
                <input
                  type="text"
                  value={formData.taxId || ''}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="01055xxxxxxxx"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-brand-600" /> ช่องทางชำระเงิน
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="bank_transfer">โอนเงินธนาคาร (Bank Transfer)</option>
                  <option value="promptpay">พร้อมเพย์ (PromptPay)</option>
                  <option value="credit_card">บัตรเครดิต/เดบิต (Credit Card)</option>
                  <option value="cash">เงินสด (Cash)</option>
                  <option value="other">อื่นๆ (Other)</option>
                </select>
              </div>
            </div>

            {/* Financial Amounts (Subtotal, VAT, WHT, Grand Total) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-brand-600" /> ยอดเงินและการคำนวณภาษี
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ก่อนภาษี (Subtotal)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => handleChange('subtotal', e.target.value)}
                    className="w-full text-xs font-semibold rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">VAT 7%</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vat}
                    onChange={(e) => handleChange('vat', e.target.value)}
                    className="w-full text-xs font-semibold text-brand-700 rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">หัก ณ ที่จ่าย (WHT)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.wht}
                    onChange={(e) => handleChange('wht', e.target.value)}
                    className="w-full text-xs font-semibold text-amber-700 rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">ยอดสุทธิ (Total)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.grandTotal}
                    onChange={(e) => handleChange('grandTotal', e.target.value)}
                    className="w-full text-xs font-bold text-rose-600 rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">รายการสินค้า/บริการย่อย</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[11px] text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> เพิ่มรายการ
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {(formData.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="ชื่อสินค้า/บริการ"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-brand-500"
                    />
                    <input
                      type="number"
                      placeholder="จำนวน"
                      value={item.quantity || 1}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-14 px-2 py-1 text-xs border border-slate-200 rounded-lg text-center"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="ราคารวม"
                      value={item.total}
                      onChange={(e) => handleItemChange(idx, 'total', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg text-right font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ (Notes)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:ring-2 focus:ring-brand-500"
                placeholder="ระบุข้อความหรือหมายเหตุเพิ่มเติม..."
              />
            </div>

            {/* Submit Bar */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                ปิด
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 text-xs font-semibold bg-brand-primary text-white hover:bg-brand-700 rounded-xl transition-all shadow-md shadow-brand-500/20 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
