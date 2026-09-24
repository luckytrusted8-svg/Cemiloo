'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isSupabaseLive } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('owner@cemiloo.com');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      success('Berhasil masuk ke Dashboard Cemiloo');
      router.push('/');
    } catch (err: any) {
      error(err.message || 'Gagal login, periksa kembali email & password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-surface-border shadow-card">
        {/* Brand Logo & Heading */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-sky-50 border border-sky-100 p-2 shadow-sm flex items-center justify-center mb-3">
            <Image
              src="/assets/cemiloo-logo.png"
              alt="Logo Cemiloo"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-black text-gray-900">
            Masuk ke Cemil<span className="text-cemiloo-500">oo</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Akses pembukuan keuangan & kasir kas jajanan
          </p>
        </div>

        {/* Database indicator */}
        <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-gray-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cemiloo-600 shrink-0" />
          <span>
            {isSupabaseLive
              ? 'Tersambung dengan Supabase Auth'
              : 'Mode Standalone PWA (Akun Pemilik Lokal)'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Email Pemilik
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@cemiloo.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-touch py-3 bg-cemiloo-500 hover:bg-cemiloo-600 text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              'Sedang Masuk...'
            ) : (
              <>
                Masuk Sekarang <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
