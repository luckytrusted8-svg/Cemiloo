'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileSpreadsheet,
  History,
} from 'lucide-react';
import { DataService } from '@/lib/dataService';

export default function BottomNav() {
  const pathname = usePathname();
  const [lowStockCount, setLowStockCount] = useState<number>(0);

  useEffect(() => {
    const checkLowStock = async () => {
      try {
        const lowProds = await DataService.getLowStockProducts();
        setLowStockCount(lowProds.length);
      } catch {
        // ignore
      }
    };
    checkLowStock();

    const interval = setInterval(checkLowStock, 5000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Produk',
      href: '/produk',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      label: 'Catat POS',
      href: '/catat',
      icon: ShoppingBag,
      isPrimaryAction: true,
    },
    {
      label: 'Laporan',
      href: '/laporan',
      icon: FileSpreadsheet,
    },
    {
      label: 'Riwayat',
      href: '/riwayat',
      icon: History,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-surface-border shadow-float pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimaryAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    isActive
                      ? 'bg-cemiloo-600 text-white shadow-sky-300 ring-4 ring-sky-100'
                      : 'bg-cemiloo-500 text-white shadow-sky-200 group-hover:bg-cemiloo-600'
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 transition-colors ${
                    isActive ? 'text-cemiloo-600' : 'text-gray-600 group-hover:text-cemiloo-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-cemiloo-600 font-bold bg-sky-50/70'
                  : 'text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
