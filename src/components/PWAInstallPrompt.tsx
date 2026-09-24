'use client';

import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="bg-sky-50 border-b border-sky-200 px-4 py-2.5 flex items-center justify-between text-xs text-sky-900">
      <div className="flex items-center gap-2">
        <span className="p-1 rounded-lg bg-sky-200 text-sky-800">
          <Download className="w-3.5 h-3.5" />
        </span>
        <span>
          <strong>Pasang Aplikasi Cemiloo</strong> di HP untuk jualan cepat offline!
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-2.5 py-1 bg-cemiloo-600 hover:bg-cemiloo-700 text-white font-semibold rounded-lg shadow-sm text-xs transition"
        >
          Install
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-sky-600 hover:text-sky-900"
          aria-label="Tutup prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
