'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Download,
  X,
  Laptop,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Monitor,
  Chrome,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function DownloadAppModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<'chrome' | 'android' | 'desktop'>('chrome');

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    } else {
      // If prompt is not supported directly, show instructions
      alert(
        'Untuk menginstal langsung dari Google Chrome:\n\n1. Klik ikon Download/Komputer di ujung kanan Address Bar Chrome\nATAU\n2. Klik menu titik tiga (⋮) di Chrome ➜ "Simpan dan Bagikan" ➜ "Instal Cemiloo"'
      );
    }
  };

  // Generate & download a native Windows .bat desktop shortcut launcher
  const handleDownloadWindowsShortcut = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const batContent = `@echo off
title Membuka Cemiloo Kasir POS...
echo Membuka aplikasi Cemiloo di mode standalone Chrome...
start chrome.exe --app="${origin}" --new-window
exit
`;
    const blob = new Blob([batContent], { type: 'application/bat' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Buka-Cemiloo-Kasir.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 p-1 flex items-center justify-center shrink-0">
              <Image
                src="/assets/cemiloo-logo.png"
                alt="Logo Cemiloo"
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-black text-gray-900">
                  Download / Pasang Aplikasi Cemiloo
                </h3>
                <span className="p-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                  Chrome
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Akses cepat dari Desktop PC, Laptop, atau Layar Utama HP
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary CTA Button for Chrome Instant Install */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cemiloo-600 text-white shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-sky-100 mb-1">
                <Sparkles className="w-3 h-3 text-amber-200" /> Instalasi Cepat 1-Klik
              </span>
              <h4 className="text-sm font-extrabold text-white">
                Pasang Otomatis di Google Chrome
              </h4>
              <p className="text-xs text-sky-100 mt-0.5">
                Aplikasi akan muncul di Desktop & Taskbar tanpa browser URL bar
              </p>
            </div>

            <button
              onClick={handleInstallClick}
              className="btn-touch px-4 py-2.5 bg-white hover:bg-sky-50 text-cemiloo-700 font-extrabold text-xs rounded-xl shadow active:scale-95 transition shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-cemiloo-600" />
              Download Sekarang
            </button>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold mb-4">
          <button
            onClick={() => setActiveTab('chrome')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'chrome'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Chrome className="w-4 h-4 text-cemiloo-600" />
            Chrome PC / Laptop
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'android'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Chrome HP Android
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === 'desktop'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Monitor className="w-4 h-4 text-sky-600" />
            Shortcut Windows
          </button>
        </div>

        {/* Tab 1: Google Chrome PC / Laptop */}
        {activeTab === 'chrome' && (
          <div className="space-y-3 text-xs text-gray-700">
            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cemiloo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div>
                <strong className="text-gray-900">Lihat Address Bar Google Chrome:</strong>
                <p className="text-gray-600 mt-0.5">
                  Di ujung kanan kolom URL browser Chrome (tempat mengetik alamat website), perhatikan ikon <strong>Komputer dengan panah ke bawah (📥)</strong> yang bertuliskan <em>"Instal Cemiloo"</em>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cemiloo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div>
                <strong className="text-gray-900">Lewat Menu Chrome (Alternatif):</strong>
                <p className="text-gray-600 mt-0.5">
                  Klik titik tiga <strong>(⋮)</strong> di pojok kanan atas Chrome ➜ Pilih <strong>"Simpan dan Bagikan" (Cast, save, and share)</strong> ➜ Klik <strong>"Instal Cemiloo..."</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-cemiloo-500 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div>
                <strong className="text-gray-900">Selesai!</strong>
                <p className="text-gray-600 mt-0.5">
                  Aplikasi Cemiloo akan langsung terbuka dalam jendela mandiri layaknya software desktop dan terpasang di Desktop & Start Menu Windows Anda.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Chrome HP Android */}
        {activeTab === 'android' && (
          <div className="space-y-3 text-xs text-gray-700">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div>
                <strong className="text-gray-900">Buka Menu Titik Tiga (⋮)</strong>
                <p className="text-gray-600 mt-0.5">
                  Buka website Cemiloo di Chrome HP Android Anda, lalu tekan ikon menu titik tiga <strong>(⋮)</strong> di pojok kanan atas.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div>
                <strong className="text-gray-900">Pilih "Instal Aplikasi" / "Tambahkan ke Layar Utama"</strong>
                <p className="text-gray-600 mt-0.5">
                  Pilih menu <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke Layar Utama (Add to Home screen)</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div>
                <strong className="text-gray-900">Buka Langsung dari Layar Depan HP</strong>
                <p className="text-gray-600 mt-0.5">
                  Ikon Cemiloo akan langsung muncul di beranda HP Anda, siap digunakan jualan cepat bahkan tanpa koneksi internet lambat.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Windows Desktop Shortcut (.bat launcher) */}
        {activeTab === 'desktop' && (
          <div className="space-y-3 text-xs text-gray-700">
            <p className="text-gray-600">
              Ingin file launcher instan di komputer Windows tanpa install lewat menu browser? Anda bisa mengunduh file pintasan Windows berikut:
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="font-extrabold text-gray-900 block text-xs">
                  File Launcher Windows (Buka-Cemiloo-Kasir.bat)
                </span>
                <span className="text-[11px] text-gray-500">
                  Klik 2x file ini di Windows untuk langsung membuka kasir dalam jendela khusus Chrome.
                </span>
              </div>

              <button
                onClick={handleDownloadWindowsShortcut}
                className="btn-touch px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh .BAT
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-surface-border flex justify-end">
          <button
            onClick={onClose}
            className="btn-touch px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
