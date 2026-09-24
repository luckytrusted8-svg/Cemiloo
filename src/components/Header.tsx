'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Database, LogOut, ArrowDownCircle, Download } from 'lucide-react';
import DownloadAppModal from './DownloadAppModal';

export default function Header() {
  const { user, isSupabaseLive, logout } = useAuth();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-surface-border px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Brand & Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-sm border border-sky-100 bg-sky-50 flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
              <Image
                src="/assets/cemiloo-logo.png"
                alt="Logo Cemiloo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-cemiloo-600 transition-colors">
                  Cemil<span className="text-cemiloo-500">oo</span>
                </span>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-sky-100 text-sky-700">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium -mt-1">
                Catat Keuangan & Kasir
              </p>
            </div>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Download App Button (Chrome / Desktop / Mobile) */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-sky-50 text-cemiloo-700 border border-sky-200 hover:bg-sky-100 active:scale-95 transition"
              title="Download / Pasang Aplikasi dari Chrome"
            >
              <Download className="w-3.5 h-3.5 text-cemiloo-600" />
              <span className="hidden sm:inline">Pasang App</span>
            </button>

            {/* Quick Expense Button */}
            <Link
              href="/pengeluaran"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 active:scale-95 transition"
              title="Catat Pengeluaran Cepat"
            >
              <ArrowDownCircle className="w-4 h-4 text-rose-600" />
              <span className="hidden sm:inline">Biaya</span>
            </Link>

            {/* Database Status Indicator */}
            <div
              className={`hidden xs:flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border ${
                isSupabaseLive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isSupabaseLive ? 'Tersambung ke Supabase Live' : 'Penyimpanan Lokal Aktif (Offline Ready)'}
            >
              <Database className="w-3 h-3" />
              <span>{isSupabaseLive ? 'Supabase' : 'Lokal PWA'}</span>
            </div>

            {/* Auth status & logout */}
            {user && (
              <button
                onClick={() => logout()}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                title="Keluar / Ganti Akun"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Download / Install App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </>
  );
}
