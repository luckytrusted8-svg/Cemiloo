'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  Search,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { DataService } from '@/lib/dataService';
import { Transaction, Expense, ProductMargin } from '@/types/database';
import { formatRupiah, formatTanggal, exportToCSV } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { exportBeautifulExcelReport } from '@/lib/excelExport';

export default function LaporanPage() {
  const { success, error } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [margins, setMargins] = useState<ProductMargin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'masuk' | 'keluar'>('all');
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'margin'>('ringkasan');
  const [searchMargin, setSearchMargin] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txs, exps, margs] = await Promise.all([
        DataService.getTransactions(),
        DataService.getExpenses(),
        DataService.getProductMargins(),
      ]);
      setTransactions(txs);
      setExpenses(exps);
      setMargins(margs);
    } catch (err: any) {
      error(err.message || 'Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DataService.subscribeToRealtimeChanges(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Filter Transactions by Date Range
  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    return transactions.filter((t) => {
      const tDate = new Date(t.tanggal).getTime();
      return tDate >= start && tDate <= end;
    });
  }, [transactions, startDate, endDate]);

  // Filter Expenses by Date Range
  const filteredExpenses = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    return expenses.filter((e) => {
      const eDate = new Date(e.tanggal).getTime();
      return eDate >= start && eDate <= end;
    });
  }, [expenses, startDate, endDate]);

  // Financial Summaries for the selected period
  const totalMasuk = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'masuk')
      .reduce((sum, t) => sum + Number(t.total_nominal), 0);
  }, [filteredTransactions]);

  const totalKeluar = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.nominal), 0);
  }, [filteredExpenses]);

  const untungBersih = totalMasuk - totalKeluar;

  // Filter Margin Products
  const filteredMargins = useMemo(() => {
    return margins.filter(
      (m) =>
        m.name.toLowerCase().includes(searchMargin.toLowerCase()) ||
        m.category_name.toLowerCase().includes(searchMargin.toLowerCase())
    );
  }, [margins, searchMargin]);

  // Export to Excel & CSV Handlers
  const handleExportExcel = () => {
    exportBeautifulExcelReport({
      startDate,
      endDate,
      totalMasuk,
      totalKeluar,
      untungBersih,
      transactions: filteredTransactions,
      expenses: filteredExpenses,
      margins,
    });
    success('Laporan Excel profesional (.xls) berhasil di-download!');
  };

  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await DataService.resetAllFinancialDataToZero();
      await loadData();
      setShowResetModal(false);
      success('Semua transaksi & biaya telah dikosongkan, stok dimulai dari nol!');
    } catch (err: any) {
      error('Gagal mereset data: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportTransactionsCSV = () => {
    const headers = ['No', 'Tipe', 'Tanggal', 'Keterangan', 'Total Nominal (Rp)'];
    const rows = [
      ...filteredTransactions.map((t, idx) => [
        idx + 1,
        'Pemasukan (Penjualan)',
        formatTanggal(t.tanggal),
        t.keterangan || 'Penjualan Kasir',
        t.total_nominal,
      ]),
      ...filteredExpenses.map((e, idx) => [
        filteredTransactions.length + idx + 1,
        'Pengeluaran Operasional',
        formatTanggal(e.tanggal),
        `${e.category?.name || 'Biaya'}: ${e.keterangan || '-'}`,
        e.nominal,
      ]),
    ];

    exportToCSV(`Laporan_Keuangan_Cemiloo_${startDate}_sd_${endDate}`, headers, rows);
    success('Laporan transaksi berhasil diexport ke CSV');
  };

  const handleExportMarginsCSV = () => {
    const headers = [
      'No',
      'Nama Produk',
      'Kategori',
      'Harga Modal (Rp)',
      'Harga Jual (Rp)',
      'Margin Nominal (Rp)',
      'Margin (%)',
      'Stok',
      'Status',
    ];
    const rows = filteredMargins.map((m, idx) => [
      idx + 1,
      m.name,
      m.category_name,
      m.harga_modal,
      m.harga_jual,
      m.margin_nominal,
      `${m.margin_percentage}%`,
      m.stok,
      m.is_active ? 'Aktif' : 'Nonaktif',
    ]);

    exportToCSV('Analisis_Margin_Produk_Cemiloo', headers, rows);
    success('Laporan margin keuntungan berhasil diexport ke CSV');
  };

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cemiloo-500" />
            Laporan Keuangan & Margin
          </h1>
          <p className="text-xs text-gray-500">
            Analisis arus kas, cetak template Excel resmi, dan kelola data bersih
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === 'ringkasan' ? (
            <>
              <button
                onClick={handleExportExcel}
                className="btn-touch px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition"
                title="Download laporan Excel resmi berformat rapi (.xls)"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel (.xls)
              </button>
              <button
                onClick={handleExportTransactionsCSV}
                className="btn-touch px-2.5 py-2 text-xs font-bold rounded-xl bg-white border border-surface-border text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-1 active:scale-95 transition"
                title="Download data mentah CSV (.csv)"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="btn-touch px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 shadow-sm flex items-center gap-1.5 active:scale-95 transition"
                title="Bersihkan semua transaksi dan nol-kan semua data"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ke Nol
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportExcel}
                className="btn-touch px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 active:scale-95 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel Lengkap
              </button>
              <button
                onClick={handleExportMarginsCSV}
                className="btn-touch px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-surface-border text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-4 h-4" />
                Export Margin CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Selector: Laporan Arus Kas vs Analisis Margin */}
      <div className="flex gap-2 border-b border-surface-border pb-1">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`pb-2 text-xs font-bold transition border-b-2 ${
            activeTab === 'ringkasan'
              ? 'border-cemiloo-500 text-cemiloo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Ringkasan Keuangan
        </button>
        <button
          onClick={() => setActiveTab('margin')}
          className={`pb-2 text-xs font-bold transition border-b-2 ${
            activeTab === 'margin'
              ? 'border-cemiloo-500 text-cemiloo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Tabel Margin Produk
        </button>
      </div>

      {activeTab === 'ringkasan' ? (
        <>
          {/* Date Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-surface-border shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cemiloo-500" />
              <span className="font-bold text-gray-700">Rentang Tanggal:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium"
              />
              <span className="text-gray-400 font-bold">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-surface-border rounded-xl text-xs font-medium"
              />
            </div>
          </div>

          {/* Period Financial Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card">
              <span className="text-xs font-semibold text-gray-500">Pemasukan Periode Ini</span>
              <p className="text-xl font-black text-gray-900 mt-1">
                {formatRupiah(totalMasuk)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{filteredTransactions.length} penjualan</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card">
              <span className="text-xs font-semibold text-gray-500">Pengeluaran Periode Ini</span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {formatRupiah(totalKeluar)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{filteredExpenses.length} biaya operasional</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-surface-border shadow-card">
              <span className="text-xs font-semibold text-gray-500">Laba Bersih Periode Ini</span>
              <p
                className={`text-xl font-black mt-1 ${
                  untungBersih >= 0 ? 'text-cemiloo-600' : 'text-rose-600'
                }`}
              >
                {formatRupiah(untungBersih)}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Net Margin:{' '}
                {totalMasuk > 0 ? Math.round((untungBersih / totalMasuk) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Combined Chronological Stream */}
          <div className="bg-white rounded-3xl p-4 border border-surface-border shadow-card">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              Rincian Alur Transaksi ({filteredTransactions.length + filteredExpenses.length} entri)
            </h3>

            <div className="space-y-2">
              {[
                ...filteredTransactions.map((t) => ({ ...t, kind: 'masuk' as const })),
                ...filteredExpenses.map((e) => ({
                  id: e.id,
                  type: 'keluar' as const,
                  tanggal: e.tanggal,
                  keterangan: `${e.category?.name || 'Biaya'}: ${e.keterangan || '-'}`,
                  total_nominal: e.nominal,
                  kind: 'keluar' as const,
                })),
              ]
                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                .map((row) => (
                  <div
                    key={row.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            row.kind === 'masuk'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.kind === 'masuk' ? 'Penjualan' : 'Pengeluaran'}
                        </span>
                        <span className="text-gray-400 text-[11px]">
                          {formatTanggal(row.tanggal)}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 mt-0.5">
                        {row.keterangan || '-'}
                      </p>
                    </div>

                    <span
                      className={`font-black text-sm ${
                        row.kind === 'masuk' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {row.kind === 'masuk' ? '+' : '-'}
                      {formatRupiah(row.total_nominal)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : (
        /* TAB ANALISIS MARGIN PER PRODUK */
        <div className="bg-white rounded-3xl p-4 border border-surface-border shadow-card space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari margin menu..."
                value={searchMargin}
                onChange={(e) => setSearchMargin(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-surface-border rounded-xl text-xs"
              />
            </div>
            <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
              {filteredMargins.length} Produk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-gray-700 font-bold border-b border-surface-border">
                <tr>
                  <th className="py-2.5 px-3 rounded-l-xl">Nama Produk</th>
                  <th className="py-2.5 px-2">Kategori</th>
                  <th className="py-2.5 px-2 text-right">Modal</th>
                  <th className="py-2.5 px-2 text-right">Jual</th>
                  <th className="py-2.5 px-2 text-right">Margin (Rp)</th>
                  <th className="py-2.5 px-2 text-right">Margin (%)</th>
                  <th className="py-2.5 px-3 rounded-r-xl text-center">Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMargins.map((m) => (
                  <tr key={m.id} className="hover:bg-sky-50/40 transition">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{m.name}</td>
                    <td className="py-2.5 px-2 text-gray-500">{m.category_name}</td>
                    <td className="py-2.5 px-2 text-right text-gray-500">
                      {formatRupiah(m.harga_modal)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-extrabold text-gray-900">
                      {formatRupiah(m.harga_jual)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                      +{formatRupiah(m.margin_nominal)}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {m.margin_percentage}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`font-bold ${
                          m.stok <= m.stok_minimum ? 'text-rose-600' : 'text-gray-700'
                        }`}
                      >
                        {m.stok}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI RESET SEMUA DATA KE NOL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-rose-100 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-gray-900">
                Kosongkan & Mulai Dari Nol?
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Tindakan ini akan <strong>menghapus semua riwayat transaksi</strong>, <strong>biaya pengeluaran</strong>, dan <strong>menyetel stok semua produk menjadi 0</strong>. Menu produk tetap tersimpan.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl border border-surface-border text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-200 transition flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  'Mereset...'
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ya, Nol-kan Semua
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
