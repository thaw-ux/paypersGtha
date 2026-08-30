'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Plus, ScanLine, Sparkles, Calendar } from 'lucide-react';
import { formatThaiDate } from '@/lib/utils';

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left section: Mobile menu button + Title / Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden focus:outline-none"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/50">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          <span>วันนี้: <b>{formatThaiDate(todayStr, true)}</b></span>
        </div>
      </div>

      {/* Right section: Quick Action Buttons */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/scan"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/70 transition-all hover:shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-600 animate-pulse" />
          <span>สแกนบิลด้วย AI</span>
        </Link>

        <Link
          href="/transactions?action=new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-700 transition-all shadow-sm shadow-brand-500/20 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">เพิ่มรายการใหม่</span>
          <span className="sm:hidden">เพิ่ม</span>
        </Link>
      </div>
    </header>
  );
}
