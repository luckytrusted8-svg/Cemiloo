'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderPlus,
  Check,
  X,
  Package,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { DataService } from '@/lib/dataService';
import { Product, Category } from '@/types/database';
import { formatRupiah } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export default function ProdukPage() {
  const { success, error, warning } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form States for Product
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    harga_jual: 0,
    harga_modal: 0,
    stok: 0,
    stok_minimum: 5,
    is_active: true,
  });

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        DataService.getProducts(),
        DataService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err: any) {
      error(err.message || 'Gagal memuat data produk');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      harga_jual: 0,
      harga_modal: 0,
      stok: 20,
      stok_minimum: 5,
      is_active: true,
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category_id: p.category_id || '',
      harga_jual: p.harga_jual,
      harga_modal: p.harga_modal,
      stok: p.stok,
      stok_minimum: p.stok_minimum,
      is_active: p.is_active,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      warning('Nama produk wajib diisi!');
      return;
    }
    if (formData.harga_jual < 0 || formData.harga_modal < 0) {
      warning('Harga tidak boleh negatif!');
      return;
    }

    try {
      if (editingProduct) {
        await DataService.updateProduct(editingProduct.id, {
          name: formData.name.trim(),
          category_id: formData.category_id || null,
          harga_jual: Number(formData.harga_jual),
          harga_modal: Number(formData.harga_modal),
          stok: Number(formData.stok),
          stok_minimum: Number(formData.stok_minimum),
          is_active: formData.is_active,
        });
        success(`Produk "${formData.name}" berhasil diperbarui`);
      } else {
        await DataService.addProduct({
          name: formData.name.trim(),
          category_id: formData.category_id || null,
          harga_jual: Number(formData.harga_jual),
          harga_modal: Number(formData.harga_modal),
          stok: Number(formData.stok),
          stok_minimum: Number(formData.stok_minimum),
          is_active: formData.is_active,
        });
        success(`Produk "${formData.name}" berhasil ditambahkan`);
      }
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal menyimpan produk');
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus produk "${name}"?`)) {
      try {
        await DataService.deleteProduct(id);
        success(`Produk "${name}" berhasil dihapus`);
        loadData();
      } catch (err: any) {
        error(err.message || 'Gagal menghapus produk');
      }
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      const updated = await DataService.updateProduct(product.id, {
        is_active: !product.is_active,
      });
      success(
        `Produk "${product.name}" sekarang ${updated.is_active ? 'Aktif' : 'Nonaktif'}`
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: updated.is_active } : p))
      );
    } catch (err: any) {
      error(err.message || 'Gagal mengubah status');
    }
  };

  const handleQuickRestock = async (product: Product, delta: number) => {
    try {
      const updated = await DataService.quickAdjustStock(product.id, delta);
      success(`Stok ${product.name} menjadi ${updated.stok}`);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stok: updated.stok } : p))
      );
    } catch (err: any) {
      error(err.message || 'Gagal menyesuaikan stok');
    }
  };

  // Add Category Handler
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await DataService.addCategory(newCategoryName.trim());
      success(`Kategori "${newCategoryName}" berhasil dibuat`);
      setNewCategoryName('');
      const cats = await DataService.getCategories();
      setCategories(cats);
    } catch (err: any) {
      error(err.message || 'Gagal membuat kategori');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (window.confirm(`Hapus kategori "${name}"? Produk yang terkait akan menjadi tanpa kategori.`)) {
      try {
        await DataService.deleteCategory(id);
        success(`Kategori "${name}" dihapus`);
        const cats = await DataService.getCategories();
        setCategories(cats);
        loadData();
      } catch (err: any) {
        error(err.message || 'Gagal menghapus kategori');
      }
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Manajemen Produk</h1>
          <p className="text-xs text-gray-500">
            Total {products.length} menu jajanan & minuman Cemiloo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-touch px-3 py-2 text-xs font-bold rounded-xl bg-white border border-surface-border text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <FolderPlus className="w-4 h-4 mr-1.5 text-cemiloo-500" />
            Kategori
          </button>
          <button
            onClick={openAddModal}
            className="btn-touch px-4 py-2 text-xs font-bold rounded-xl bg-cemiloo-500 hover:bg-cemiloo-600 text-white shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Menu
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari basreng, makaroni, minuman..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-border rounded-xl text-sm placeholder-gray-400 focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500 transition shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scrollable Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-cemiloo-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-surface-border hover:bg-gray-50'
            }`}
          >
            Semua ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-cemiloo-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-surface-border hover:bg-gray-50'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-surface-border shadow-sm">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700">Tidak ada produk ditemukan</p>
          <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci pencarian atau kategori.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProducts.map((p) => {
            const margin = p.harga_jual - p.harga_modal;
            const marginPct = p.harga_jual > 0 ? Math.round((margin / p.harga_jual) * 100) : 0;
            const isLowStock = p.stok <= p.stok_minimum;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl p-3.5 border transition-all shadow-card ${
                  !p.is_active
                    ? 'opacity-60 bg-gray-50/80 border-gray-200'
                    : isLowStock
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-surface-border hover:border-sky-200'
                }`}
              >
                {/* Header row: Name, Category, Status badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug">
                        {p.name}
                      </h3>
                      {!p.is_active && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-200 text-gray-700 rounded-md">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {p.category?.name || 'Tanpa Kategori'}
                    </span>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition ${
                      p.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }`}
                    title={p.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                  >
                    {p.is_active ? 'Aktif' : 'Off'}
                  </button>
                </div>

                {/* Price and Margin Metrics */}
                <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Jual / Modal</span>
                    <p className="font-extrabold text-gray-900">
                      {formatRupiah(p.harga_jual)} <span className="text-[10px] text-gray-400 font-normal">/ {formatRupiah(p.harga_modal)}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Margin Laba</span>
                    <p className="font-bold text-emerald-700">
                      +{formatRupiah(margin)} <span className="text-[10px] font-medium text-emerald-600">({marginPct}%)</span>
                    </p>
                  </div>
                </div>

                {/* Stock Controls & Actions */}
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                        isLowStock
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : 'bg-sky-50 text-sky-800'
                      }`}
                    >
                      {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      Stok: {p.stok}
                    </span>
                    {/* Quick Restock Buttons */}
                    <button
                      onClick={() => handleQuickRestock(p, 5)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition"
                      title="Tambah 5 stok"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQuickRestock(p, 10)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition"
                      title="Tambah 10 stok"
                    >
                      +10
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-cemiloo-600 hover:bg-sky-50 active:scale-90 transition"
                      title="Edit produk"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition"
                      title="Hapus produk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PRODUK */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-surface-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-black text-gray-900">
                {editingProduct ? 'Edit Menu Jajanan' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nama Menu / Varian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Basreng Extra Pedas"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={formData.harga_jual}
                    onChange={(e) => setFormData({ ...formData, harga_jual: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-bold text-cemiloo-700 focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Harga Modal / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={formData.harga_modal}
                    onChange={(e) => setFormData({ ...formData, harga_modal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
                  />
                </div>
              </div>

              {/* Live Margin Calculation Preview */}
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-between text-xs">
                <span className="text-sky-800 font-medium">Estimasi Margin Laba:</span>
                <span className="font-extrabold text-cemiloo-700">
                  {formatRupiah(formData.harga_jual - formData.harga_modal)} (
                  {formData.harga_jual > 0
                    ? Math.round(((formData.harga_jual - formData.harga_modal) / formData.harga_jual) * 100)
                    : 0}
                  %)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-bold text-gray-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Batas Stok Menipis
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.stok_minimum}
                    onChange={(e) => setFormData({ ...formData, stok_minimum: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-sm font-medium focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-cemiloo-600 focus:ring-sky-500 border-gray-300"
                />
                <label htmlFor="is_active_check" className="text-xs font-bold text-gray-700 cursor-pointer">
                  Produk Aktif (Tampil di Kasir & Jualan)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 btn-touch py-2.5 border border-surface-border text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-touch py-2.5 bg-cemiloo-500 hover:bg-cemiloo-600 text-white text-xs font-bold rounded-xl shadow-md active:scale-95"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MANAJEMEN KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-black text-gray-900">Manajemen Kategori</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Buat Kategori Baru */}
            <form onSubmit={handleAddCategory} className="flex gap-2 mt-4">
              <input
                type="text"
                placeholder="Nama kategori baru..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-surface-border rounded-xl focus:ring-2 focus:ring-sky-200 focus:border-cemiloo-500"
              />
              <button
                type="submit"
                className="btn-touch px-3 py-2 bg-cemiloo-500 hover:bg-cemiloo-600 text-white text-xs font-bold rounded-xl shrink-0"
              >
                + Tambah
              </button>
            </form>

            {/* List Kategori Terdaftar */}
            <div className="mt-4 space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <span className="text-xs font-bold text-gray-800">{c.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(c.id, c.name)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="Hapus kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border text-right">
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="btn-touch px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
