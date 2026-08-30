'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  return (
    <html lang="th">
      <head>
        <title>Paypers AI - ระบบจัดการใบเสร็จและเอกสารการเงินอัตโนมัติ</title>
        <meta
          name="description"
          content="ระบบจัดการรายรับ-รายจ่าย สลิปโอนเงิน และใบกำกับภาษีอัตโนมัติด้วย AI ผ่าน LINE และ Google Workspace"
        />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-slate-50 min-h-screen flex text-slate-900 antialiased">
        {isLoginPage ? (
          <main className="min-h-screen w-full">{children}</main>
        ) : (
          <>
            {/* Sidebar */}
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </>
        )}
      </body>
    </html>
  );
}

