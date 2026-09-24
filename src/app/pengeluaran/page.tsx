'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowDownCircle,
  Plus,
  Trash2,
  FolderPlus,
  Calendar,
  X,
  Tag,
  DollarSign,
  FileText,
} from 'lucide-react';
import { DataService } from '@/lib/dataService';
import { Expense, ExpenseCategory } from '@/types/database';
import { formatRupiah, formatTanggal } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function PengeluaranPage() {
  const { success, error, warning } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [expenseCategoryId, setExpenseCategoryId] = useState('');
  const [nominal, setNominal] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Modal Category State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [exps, cats] = await Promise.all([
        DataService.getExpenses(),
        DataService.getExpenseCategories(),
      ]);
      setExpenses(exps);
      setCategories(cats);
      if (cats.length > 0 && !expenseCategoryId) {
        setExpenseCategoryId(cats[0].id);
      }
    } catch (err: any) {
      error(err.message || 'Gagal memuat data pengeluaran');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) {
      warning('Nominal pengeluaran harus lebih besar dari 0!');
      return;
    }
    if (!expenseCategoryId) {
      warning('Pilih kategori pengeluaran terlebih dahulu!');
      return;
    }

    try {
      await DataService.addExpense({
        expense_category_id: expenseCategoryId,
        nominal: Number(nominal),
        keterangan: keterangan.trim() || null,
        tanggal: new Date(tanggal).toISOString(),
      });

      success(`Pengeluaran sebesar ${formatRupiah(nominal)} berhasil dicatat`);
      setNominal(0);
      setKeterangan('');
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal mencatat pengeluaran');
    }
  };

  const handleDeleteExpense = async (id: string, nominalVal: number) => {
    if (window.confirm(`Hapus catatan pengeluaran ${formatRupiah(nominalVal)}?`)) {
      try {
        await DataService.deleteExpense(id);
        success('Catatan pengeluaran berhasil dihapus');
        loadData();
      } catch (err: any) {
        error(err.message || 'Gagal menghapus');
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await DataService.addExpenseCategory(newCatName.trim());
      success(`Kategori "${newCatName}" berhasil dibuat`);
      setNewCatName('');
      const cats = await DataService.getExpenseCategories();
      setCategories(cats);
    } catch (err: any) {
      error(err.message || 'Gagal membuat kategori');
    }
  };

  // Quick preset nominal chips
  const quickNominals = [10000, 25000, 50000, 100000, 200000, 500000];

  const totalPengeluaran = expenses.reduce((sum, e) => sum + Number(e.nominal), 0);

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-rose-500" />
            Catat Pengeluaran
          </h1>
          <p className="text-xs text-gray-500">
            Catat biaya bahan baku, gas, kemasan, atau operasional harian
          </p>
        </div>

        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="btn-touch px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-surface-border text-gray-700 hover:bg-gray-50 shadow-sm"
        >
          <FolderPlus className="w-4 h-4 mr-1 text-cemiloo-500" />
          Kategori
        </button>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-3xl p-5 border border-surface-border shadow-card">
        <form onSubmit={handleSubmitExpense} className="space-y-4">
          {/* Nominal Input with Quick Chips */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nominal Biaya (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-gray-400">
                Rp
              </span>
              <input
                type="number"
                required
                min={100}
                step={500}
                placeholder="0"
                value={nominal || ''}
                onChange={(e) => setNominal(Number(e.target.value))}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-surface-border rounded-2xl text-lg font-black text-rose-600 focus:bg-white focus:ring-2 focus:ring-rose-200 focus:border-rose-500"
              />
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 flex-wrap mt-2">
              {quickNominals.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setNominal(q)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-700 active:scale-95 transition"
                >
                  +{formatRupiah(q)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kategori Pengeluaran */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Kategori Biaya
              </label>
              <select
                required
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-200"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tanggal Pengeluaran
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-medium focus:bg-white"
              />
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Keterangan / Rincian Belanja
            </label>
            <input
              type="text"
              placeholder="Contoh: Beli minyak goreng 2 liter, plastik klip, gas elpiji"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full btn-touch py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-2xl shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Simpan Pengeluaran
          </button>
        </form>
      </div>

      {/* Riwayat Pengeluaran List */}
      <div className="bg-white rounded-3xl p-4 border border-surface-border shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="text-sm font-bold text-gray-900">Riwayat Pengeluaran</h3>
          <span className="text-xs font-bold text-rose-600">
            Total: {formatRupiah(totalPengeluaran)}
          </span>
        </div>

        {expenses.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Belum ada pengeluaran tercatat.</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {expenses.map((e) => (
              <div key={e.id} className="py-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                      {e.category?.name || 'Biaya'}
                    </span>
                    <span className="text-[11px] text-gray-400">{formatTanggal(e.tanggal)}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 mt-1">
                    {e.keterangan || 'Tanpa keterangan'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-600">
                    -{formatRupiah(e.nominal)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(e.id, e.nominal)}
                    className="p-1 text-gray-300 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Kategori Pengeluaran */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-black text-gray-900">Kategori Pengeluaran</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="flex gap-2 mt-4">
              <input
                type="text"
                placeholder="Kategori pengeluaran baru..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-surface-border rounded-xl"
              />
              <button
                type="submit"
                className="btn-touch px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0"
              >
                + Tambah
              </button>
            </form>

            <div className="mt-4 space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-gray-800"
                >
                  {c.name}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border text-right">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="btn-touch px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
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
