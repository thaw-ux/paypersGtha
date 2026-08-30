'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  HardDrive,
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'แดชบอร์ดภาพรวม',
    sublabel: 'Financial Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'รายการเอกสาร & ธุรกรรม',
    sublabel: 'Transactions Database',
    href: '/transactions',
    icon: Receipt,
  },
  {
    label: 'สแกนบิลด้วย AI',
    sublabel: 'Live AI OCR Scanner',
    href: '/scan',
    icon: ScanLine,
  },
  {
    label: 'รายงานภาษี & บัญชี',
    sublabel: 'Tax & VAT Reports',
    href: '/tax-reports',
    icon: FileSpreadsheet,
  },
  {
    label: 'ตั้งค่า & เชื่อมต่อระบบ',
    sublabel: 'Integrations & Health',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-primary flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl tracking-tight text-slate-900">Paypers</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">ระบบจัดการเอกสารการเงิน</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-100/80 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="leading-tight">{item.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                    {item.sublabel}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Workspace Cloud Badge */}
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-lg shadow-indigo-950/10">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Google Workspace Sync</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
            จัดเก็บไฟล์รูปภาพใน <b>Google Drive</b> และบันทึกข้อมูลแบบเรียลไทม์ลง <b>Google Sheets</b> ของคุณ
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-200">Cloud Live</span>
            </div>
            <Link
              href="/settings"
              className="text-brand-300 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
            >
              ตรวจสอบ <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Paypers AI v1.0</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> LINE OA Active
          </span>
        </div>
      </aside>
    </>
  );
}
