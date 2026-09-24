'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Trash2,
  Eye,
  Search,
  Calendar,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { DataService } from '@/lib/dataService';
import { Transaction, Expense } from '@/types/database';
import { formatRupiah, formatTanggalLengkap, formatTanggal } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

type HistoryItem =
  | { kind: 'penjualan'; data: Transaction }
  | { kind: 'pengeluaran'; data: Expense };

export default function RiwayatTransaksiPage() {
  const { success, error } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'penjualan' | 'pengeluaran'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txs, exps] = await Promise.all([
        DataService.getTransactions(),
        DataService.getExpenses(),
      ]);
      setTransactions(txs);
      setExpenses(exps);
    } catch (err: any) {
      error(err.message || 'Gagal memuat riwayat');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combine and sort
  const combinedList = useMemo(() => {
    const list: HistoryItem[] = [];

    if (filterType === 'all' || filterType === 'penjualan') {
      transactions.forEach((t) => list.push({ kind: 'penjualan', data: t }));
    }

    if (filterType === 'all' || filterType === 'pengeluaran') {
      expenses.forEach((e) => list.push({ kind: 'pengeluaran', data: e }));
    }

    list.sort((a, b) => {
      const dateA = new Date(a.kind === 'penjualan' ? a.data.tanggal : a.data.tanggal).getTime();
      const dateB = new Date(b.kind === 'penjualan' ? b.data.tanggal : b.data.tanggal).getTime();
      return dateB - dateA;
    });

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      if (item.kind === 'penjualan') {
        const hasDesc = (item.data.keterangan || '').toLowerCase().includes(q);
        const hasItems = item.data.items?.some((it) =>
          (it.product?.name || '').toLowerCase().includes(q)
        );
        return hasDesc || hasItems;
      } else {
        const hasDesc = (item.data.keterangan || '').toLowerCase().includes(q);
        const hasCat = (item.data.category?.name || '').toLowerCase().includes(q);
        return hasDesc || hasCat;
      }
    });
  }, [transactions, expenses, filterType, searchQuery]);

  const handleDeleteTransaction = async (id: string, nominal: number) => {
    if (
      window.confirm(
        `Batalkan dan hapus transaksi ${formatRupiah(nominal)}? Stok jajanan akan otomatis dikembalikan ke etalase.`
      )
    ) {
      try {
        await DataService.deleteTransaction(id);
        success('Transaksi penjualan dibatalkan dan stok dikembalikan.');
        loadData();
      } catch (err: any) {
        error(err.message || 'Gagal menghapus transaksi');
      }
    }
  };

  const handleDeleteExpense = async (id: string, nominal: number) => {
    if (window.confirm(`Hapus catatan biaya ${formatRupiah(nominal)}?`)) {
      try {
        await DataService.deleteExpense(id);
        success('Catatan pengeluaran berhasil dihapus');
        loadData();
      } catch (err: any) {
        error(err.message || 'Gagal menghapus pengeluaran');
      }
    }
  };

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-cemiloo-500" />
          Riwayat Transaksi
        </h1>
        <p className="text-xs text-gray-500">
          Semua catatan penjualan & pengeluaran kas. Menghapus transaksi penjualan akan mengembalikan stok otomatis.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-2">
        <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm">
          {(
            [
              { key: 'all', label: 'Semua' },
              { key: 'penjualan', label: 'Penjualan' },
              { key: 'pengeluaran', label: 'Pengeluaran' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
                filterType === tab.key
                  ? 'bg-cemiloo-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi, menu jajanan, keterangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-sky-200 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* History Items List */}
      {combinedList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-surface-border shadow-sm">
          <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">Belum ada riwayat transaksi</p>
          <p className="text-xs text-gray-400 mt-0.5">Transaksi penjualan dan biaya akan tampil di sini.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {combinedList.map((item) => {
            if (item.kind === 'penjualan') {
              const tx = item.data;
              const itemCount = tx.items?.reduce((s, it) => s + it.jumlah, 0) || 0;

              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl p-3.5 border border-surface-border shadow-card hover:border-sky-200 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">
                          {tx.keterangan || 'Penjualan Kasir'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700">
                          {itemCount} pcs
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatTanggalLengkap(tx.tanggal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-sm font-black text-emerald-700 block">
                        +{formatRupiah(tx.total_nominal)}
                      </span>
                      <span className="text-[10px] text-gray-400">Penjualan</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-2 rounded-xl text-gray-400 hover:text-cemiloo-600 hover:bg-sky-50 transition"
                        title="Lihat Rincian Item"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(tx.id, tx.total_nominal)}
                        className="p-2 rounded-xl text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Batalkan & Kembalikan Stok"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              const exp = item.data;

              return (
                <div
                  key={exp.id}
                  className="bg-white rounded-2xl p-3.5 border border-surface-border shadow-card hover:border-rose-200 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <ArrowDownLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900">
                          {exp.category?.name || 'Pengeluaran'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {exp.keterangan || 'Tanpa rincian'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {formatTanggalLengkap(exp.tanggal)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-sm font-black text-rose-600 block">
                        -{formatRupiah(exp.nominal)}
                      </span>
                      <span className="text-[10px] text-gray-400">Pengeluaran</span>
                    </div>

                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.nominal)}
                      className="p-2 rounded-xl text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Hapus Biaya"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* DETAIL PENJUALAN MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cemiloo-500" />
                <h3 className="text-base font-black text-gray-900">Detail Transaksi Penjualan</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 text-xs text-gray-500 space-y-1">
              <div>
                <strong>ID:</strong> {selectedTx.id}
              </div>
              <div>
                <strong>Waktu:</strong> {formatTanggalLengkap(selectedTx.tanggal)}
              </div>
              <div>
                <strong>Keterangan:</strong> {selectedTx.keterangan || '-'}
              </div>
            </div>

            <div className="mt-4 border-t border-b border-gray-100 py-3 space-y-2 max-h-60 overflow-y-auto">
              {selectedTx.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div>
                    <h5 className="font-bold text-gray-900">
                      {it.product?.name || 'Produk'}
                      {it.catatan && (
                        <span className="ml-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {it.catatan}
                        </span>
                      )}
                    </h5>
                    <p className="text-[11px] text-gray-500">
                      {it.jumlah} x {formatRupiah(it.harga_satuan_saat_transaksi)}
                    </p>
                  </div>
                  <span className="font-black text-gray-900">{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 flex justify-between items-center text-sm font-black text-gray-900">
              <span>Total Transaksi</span>
              <span className="text-emerald-700 text-base">
                {formatRupiah(selectedTx.total_nominal)}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border flex gap-2">
              <button
                onClick={() => {
                  setSelectedTx(null);
                  handleDeleteTransaction(selectedTx.id, selectedTx.total_nominal);
                }}
                className="flex-1 btn-touch py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl"
              >
                Batalkan & Kembalikan Stok
              </button>
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 btn-touch py-2.5 text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
