'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  Package,
} from 'lucide-react';
import { DataService } from '@/lib/dataService';
import { formatRupiah } from '@/lib/utils';
import { DashboardSummary, ChartDayData, Product } from '@/types/database';
import { useToast } from '@/context/ToastContext';

export default function DashboardPage() {
  const { success, error } = useToast();
  const [period, setPeriod] = useState<'hari_ini' | 'minggu_ini' | 'bulan_ini'>('hari_ini');
  const [summary, setSummary] = useState<DashboardSummary>({
    pemasukan: 0,
    pengeluaran: 0,
    untung_bersih: 0,
    transaksi_count: 0,
    item_terjual: 0,
  });
  const [chartData, setChartData] = useState<ChartDayData[]>([]);
  const [topProducts, setTopProducts] = useState<{ product: Product; totalQty: number; totalSales: number }[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [sum, chart, top, low] = await Promise.all([
        DataService.getDashboardSummary(period),
        DataService.get7DaysTrend(),
        DataService.getTopSellingProducts(5),
        DataService.getLowStockProducts(),
      ]);
      setSummary(sum);
      setChartData(chart);
      setTopProducts(top);
      setLowStockProducts(low);
    } catch (err: any) {
      error(err.message || 'Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period, error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickRestock = async (product: Product, amount: number) => {
    try {
      await DataService.quickAdjustStock(product.id, amount);
      success(`Stok ${product.name} ditambah +${amount}`);
      loadData(true);
    } catch (err: any) {
      error(err.message || 'Gagal menambah stok');
    }
  };

  // Find max value for chart bar scaling
  const maxChartVal = Math.max(
    ...chartData.map((d) => Math.max(d.masuk, d.keluar)),
    10000
  );

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-gradient-to-r from-sky-500 to-cemiloo-600 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-200" />
            </span>
            <h1 className="text-lg font-bold">Halo, Juragan Cemiloo!</h1>
          </div>
          <p className="text-xs text-sky-100 mt-0.5">
            Jajanan Ringan, Rasa Bikin Happy! Pantau arus kas & stok usahamu di sini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/catat"
            className="flex-1 sm:flex-none btn-touch px-4 py-2 bg-white text-cemiloo-700 hover:bg-sky-50 font-bold text-sm shadow rounded-xl active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 mr-1.5 text-cemiloo-600" />
            Buka Kasir POS
          </Link>
          <button
            onClick={() => loadData(true)}
            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition text-white"
            title="Muat ulang data"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Period Filter Toggle */}
      <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm">
        <span className="text-xs font-semibold text-gray-500 px-2 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cemiloo-500" /> Periode:
        </span>
        <div className="flex gap-1">
          {(
            [
              { key: 'hari_ini', label: 'Hari Ini' },
              { key: 'minggu_ini', label: '7 Hari' },
              { key: 'bulan_ini', label: 'Bulan Ini' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setPeriod(item.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                period === item.key
                  ? 'bg-cemiloo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pemasukan */}
        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Pemasukan</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">
            {formatRupiah(summary.pemasukan)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>{summary.transaksi_count} transaksi</span>
            <span className="font-semibold text-emerald-600">{summary.item_terjual} porsi terjual</span>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Pengeluaran</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">
            {formatRupiah(summary.pengeluaran)}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>Bahan baku & operasional</span>
            <Link href="/pengeluaran" className="text-rose-600 font-bold hover:underline flex items-center gap-0.5">
              + Catat
            </Link>
          </div>
        </div>

        {/* Untung Bersih */}
        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-card relative overflow-hidden sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Untung Bersih</span>
            <span className={`p-2 rounded-xl ${summary.untung_bersih >= 0 ? 'bg-sky-50 text-cemiloo-600' : 'bg-rose-50 text-rose-600'}`}>
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className={`text-2xl font-black mt-2 ${summary.untung_bersih >= 0 ? 'text-cemiloo-600' : 'text-rose-600'}`}>
            {formatRupiah(summary.untung_bersih)}
          </p>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <span>Margin keuntungan riil periode terpilih</span>
          </div>
        </div>
      </div>

      {/* Alert Produk Stok Menipis */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-200 text-amber-900">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Perhatian: {lowStockProducts.length} Produk Stok Menipis!
                </h3>
                <p className="text-xs text-amber-800">
                  Stok di bawah batas minimum, segera lakukan restock jajanan.
                </p>
              </div>
            </div>
            <Link
              href="/produk"
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStockProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">{p.name}</h4>
                  <p className="text-[11px] text-gray-500">
                    Sisa: <span className="font-bold text-rose-600">{p.stok}</span> / Min: {p.stok_minimum}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickRestock(p, 10)}
                    className="px-2 py-1 text-[11px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg active:scale-95 transition"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleQuickRestock(p, 20)}
                    className="px-2 py-1 text-[11px] font-bold bg-sky-100 hover:bg-sky-200 text-cemiloo-800 rounded-lg active:scale-95 transition"
                  >
                    +20
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Trend Chart & Top Selling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Trend 7 Hari Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Tren Penjualan 7 Hari Terakhir</h3>
              <p className="text-xs text-gray-500">Perbandingan pemasukan & pengeluaran harian</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cemiloo-500 inline-block" />
                <span className="text-gray-600">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
                <span className="text-gray-600">Keluar</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Representation */}
          <div className="flex items-end justify-between h-44 gap-2 pt-4 px-1 border-b border-surface-border pb-2">
            {chartData.map((d, index) => {
              const masukHeight = Math.max(8, Math.round((d.masuk / maxChartVal) * 110));
              const keluarHeight = Math.max(4, Math.round((d.keluar / maxChartVal) * 110));

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-12 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md pointer-events-none z-20 whitespace-nowrap shadow-md">
                    <div>Masuk: {formatRupiah(d.masuk)}</div>
                    <div>Keluar: {formatRupiah(d.keluar)}</div>
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    {/* Bar Masuk */}
                    <div
                      style={{ height: `${masukHeight}px` }}
                      className="w-1/2 max-w-[18px] bg-cemiloo-500 group-hover:bg-cemiloo-600 rounded-t-md transition-all"
                    />
                    {/* Bar Keluar */}
                    <div
                      style={{ height: `${keluarHeight}px` }}
                      className="w-1/2 max-w-[18px] bg-rose-300 group-hover:bg-rose-400 rounded-t-md transition-all"
                    />
                  </div>

                  <span className="text-[11px] font-semibold text-gray-700">{d.day}</span>
                  <span className="text-[9px] text-gray-400">{d.dateStr}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Produk Terlaris */}
        <div className="bg-white rounded-2xl p-4 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Menu Terlaris</h3>
              <p className="text-xs text-gray-500">Paling banyak dibeli pelanggan</p>
            </div>
            <Package className="w-4 h-4 text-cemiloo-500" />
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Belum ada data penjualan tercatat.</p>
            ) : (
              topProducts.map((item, idx) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-200 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center ${
                        idx === 0
                          ? 'bg-amber-400 text-white'
                          : idx === 1
                          ? 'bg-slate-300 text-gray-800'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-gray-500">{formatRupiah(item.product.harga_jual)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-cemiloo-600">
                      {item.totalQty} <span className="text-[10px] font-normal text-gray-500">pcs</span>
                    </span>
                    <p className="text-[10px] text-gray-400">{formatRupiah(item.totalSales)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
