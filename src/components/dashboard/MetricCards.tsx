'use client';

import React from 'react';
import { TrendingDown, TrendingUp, DollarSign, Receipt, Percent, FileCheck } from 'lucide-react';
import { FinancialStats } from '@/types/transaction';
import { formatCurrency } from '@/lib/utils';

export function MetricCards({ stats, loading }: { stats: FinancialStats | null; loading?: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
            <div className="w-8 h-8 bg-slate-200 rounded-lg mb-3" />
            <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
            <div className="h-7 bg-slate-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'รายจ่ายรวม',
      subtitle: 'Total Expenses',
      amount: stats.totalExpense,
      icon: TrendingDown,
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-50 border-rose-100',
      amountColor: 'text-rose-600',
      tag: `${stats.transactionCount} รายการ`,
    },
    {
      title: 'รายรับรวม',
      subtitle: 'Total Income',
      amount: stats.totalIncome,
      icon: TrendingUp,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-100',
      amountColor: 'text-emerald-600',
      tag: 'รายรับทั้งหมด',
    },
    {
      title: 'ยอดคงเหลือสุทธิ',
      subtitle: 'Net Balance',
      amount: stats.netProfit,
      icon: DollarSign,
      iconColor: stats.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600',
      iconBg: stats.netProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100',
      amountColor: stats.netProfit >= 0 ? 'text-indigo-900' : 'text-rose-600',
      tag: stats.netProfit >= 0 ? 'กำไร' : 'ขาดทุน',
    },
    {
      title: 'ภาษีซื้อ (VAT 7%)',
      subtitle: 'Claimable Input Tax',
      amount: stats.totalVatClaimable,
      icon: Percent,
      iconColor: 'text-brand-600',
      iconBg: 'bg-brand-50 border-brand-100',
      amountColor: 'text-brand-700',
      tag: 'ขอคืนภาษีได้',
    },
    {
      title: 'หัก ณ ที่จ่าย (WHT)',
      subtitle: 'Withholding Tax',
      amount: stats.totalWht,
      icon: FileCheck,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-100',
      amountColor: 'text-amber-700',
      tag: 'ภ.ง.ด. 3, 53',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card hover:shadow-lg hover:border-brand-200 transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl border ${card.iconBg} ${card.iconColor} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/50">
                  {card.tag}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500">{card.title}</p>
              <p className="text-[10px] text-slate-400 font-normal mb-1">{card.subtitle}</p>
            </div>
            <div className="mt-2">
              <h3 className={`text-xl font-bold tracking-tight ${card.amountColor}`}>
                {formatCurrency(card.amount, true)}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
}
