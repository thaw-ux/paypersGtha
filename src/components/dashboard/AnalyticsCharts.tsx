'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FinancialStats } from '@/types/transaction';
import { formatCurrency } from '@/lib/utils';

const CATEGORY_COLORS = [
  '#4551C3',
  '#0EA5E9',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#8B5CF6',
  '#64748B',
  '#14B8A6',
  '#F97316',
];

export function AnalyticsCharts({ stats, loading }: { stats: FinancialStats | null; loading?: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 animate-pulse" />
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 animate-pulse" />
      </div>
    );
  }

  // Format trend data for display
  const trendData = stats.monthlyTrends.map((t) => ({
    name: t.month,
    รายจ่าย: t.expense,
    รายรับ: t.income,
  }));

  // Donut chart data
  const pieData = stats.categoryBreakdown.slice(0, 6).map((c) => ({
    name: c.category,
    value: c.amount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Monthly Trend Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">แนวโน้มรายรับ - รายจ่าย (Monthly Trends)</h3>
            <p className="text-xs text-slate-500">เปรียบเทียบกระแสเงินสดแต่ละเดือน</p>
          </div>
        </div>

        {trendData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            ยังไม่มีข้อมูลแนวโน้มรายเดือน
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value, true), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="รายจ่าย" fill="#E11D48" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar dataKey="รายรับ" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category Breakdown Donut */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card flex flex-col">
        <div className="mb-4">
          <h3 className="font-bold text-slate-900 text-base">สัดส่วนค่าใช้จ่ายตามหมวดหมู่</h3>
          <p className="text-xs text-slate-500">Expense by Category</p>
        </div>

        {pieData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs flex-1">
            ยังไม่มีรายการค่าใช้จ่าย
          </div>
        ) : (
          <>
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value, true), '']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Table */}
            <div className="mt-4 space-y-2 flex-1 overflow-y-auto max-h-48 pr-1">
              {stats.categoryBreakdown.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium truncate max-w-[120px]">{cat.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900">{formatCurrency(cat.amount, true)}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({cat.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
