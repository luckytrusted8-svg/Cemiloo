'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Flame,
  Search,
  Receipt,
  X,
  CreditCard,
  Banknote,
  Printer,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DataService } from '@/lib/dataService';
import { Product, Category, Transaction } from '@/types/database';
import { formatRupiah, formatTanggalLengkap } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

interface CartItem {
  product: Product;
  jumlah: number;
  catatan?: string;
}

const LEVEL_PEDAS = ['Original', 'L1 Santuy', 'L2 Nagih', 'L3 Brutal', 'L4 Gila'];

export default function CatatPenjualanPage() {
  const { success, error, warning } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [keterangan, setKeterangan] = useState('Penjualan Kasir');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checkout & Payment Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris'>('tunai');
  const [cashAmount, setCashAmount] = useState<number>(0);

  // Success Receipt Modal
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        DataService.getProducts(),
        DataService.getCategories(),
      ]);
      setProducts(prods.filter((p) => p.is_active));
      setCategories(cats);
    } catch (err: any) {
      error(err.message || 'Gagal memuat produk kasir');
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

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart Subtotals & Totals
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.harga_jual * item.jumlah, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.jumlah, 0);
  }, [cart]);

  // Cart Manipulation
  const addToCart = (product: Product, pedas: string = 'Original') => {
    if (product.stok <= 0) {
      warning(`Stok ${product.name} telah habis!`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.catatan === pedas
      );

      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].jumlah;
        if (currentQty + 1 > product.stok) {
          warning(`Stok ${product.name} tidak cukup (tersisa ${product.stok})`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].jumlah += 1;
        return updated;
      } else {
        return [...prev, { product, jumlah: 1, catatan: pedas }];
      }
    });
  };

  const updateCartQty = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.jumlah + delta;

      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }

      if (newQty > item.product.stok) {
        warning(`Stok ${item.product.name} hanya tersisa ${item.product.stok}`);
        return prev;
      }

      const updated = [...prev];
      updated[index].jumlah = newQty;
      return updated;
    });
  };

  const updateCartNote = (index: number, note: string) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index].catatan = note;
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Kosongkan keranjang belanja?')) {
      setCart([]);
    }
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      warning('Keranjang belanja masih kosong!');
      return;
    }
    setCashAmount(totalAmount); // default uang pas
    setIsCheckoutModalOpen(true);
  };

  // Complete Sale
  const handleProcessSale = async () => {
    if (paymentMethod === 'tunai' && cashAmount < totalAmount) {
      warning('Nominal uang tunai kurang dari total belanja!');
      return;
    }

    setIsSubmitting(true);
    try {
      const tx = await DataService.createSaleTransaction({
        items: cart.map((it) => ({
          productId: it.product.id,
          jumlah: it.jumlah,
          catatan: it.catatan,
        })),
        keterangan: `${keterangan} (${paymentMethod.toUpperCase()})`,
      });

      // Confetti effect!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      success(`Penjualan berhasil dicatat! Total: ${formatRupiah(totalAmount)}`);
      setCompletedTx(tx);
      setCart([]);
      setIsCheckoutModalOpen(false);

      // Reload products to reflect decremented stock
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal memproses transaksi penjualan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick cash preset buttons
  const cashPresets = [
    totalAmount,
    Math.ceil(totalAmount / 10000) * 10000,
    Math.ceil(totalAmount / 20000) * 20000,
    50000,
    100000,
  ].filter((val, idx, arr) => val >= totalAmount && arr.indexOf(val) === idx);

  const kembalian = Math.max(0, cashAmount - totalAmount);

  return (
    <div className="space-y-4 pt-1 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cemiloo-500" />
            Kasir POS Cemiloo
          </h1>
          <p className="text-xs text-gray-500">
            Pilih varian jajanan, tentukan level pedas, dan selesaikan pesanan
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-100"
          >
            Reset ({totalItemsCount})
          </button>
        )}
      </div>

      {/* Main Layout: Split Product Grid & Sticky Cart on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Product Catalog (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari menu jajanan cepat..."
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

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-cemiloo-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-surface-border hover:bg-gray-50'
              }`}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === c.id
                    ? 'bg-cemiloo-500 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-surface-border hover:bg-gray-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid Cards */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-surface-border shadow-sm">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">
                {products.length === 0 ? 'Belum Ada Menu Jajanan' : 'Menu Tidak Ditemukan'}
              </p>
              <p className="text-xs text-gray-400 mt-1 mb-3">
                {products.length === 0
                  ? 'Silakan tambahkan menu produk terlebih dahulu di halaman Produk.'
                  : 'Coba sesuaikan kata kunci pencarian.'}
              </p>
              {products.length === 0 && (
                <a
                  href="/produk"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cemiloo-500 hover:bg-cemiloo-600 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Tambah Menu Sekarang
                </a>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => {
                const inCartQty = cart
                  .filter((item) => item.product.id === p.id)
                  .reduce((s, it) => s + it.jumlah, 0);
                const remainingStock = p.stok - inCartQty;
                const isOutOfStock = remainingStock <= 0;

                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl p-2.5 border transition-all flex flex-col justify-between shadow-card relative ${
                      isOutOfStock
                        ? 'opacity-50 border-gray-200 bg-gray-50'
                        : 'border-surface-border hover:border-sky-300'
                    }`}
                  >
                    {/* Cart count badge */}
                    {inCartQty > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-cemiloo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                        {inCartQty}
                      </span>
                    )}

                    <div>
                      <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                        {p.name}
                      </h4>
                      <p className="text-xs font-extrabold text-cemiloo-600 mt-1">
                        {formatRupiah(p.harga_jual)}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-semibold ${
                          isOutOfStock
                            ? 'text-rose-600 font-bold'
                            : remainingStock <= 5
                            ? 'text-amber-600'
                            : 'text-gray-400'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Sisa ${remainingStock}`}
                      </span>

                      <button
                        disabled={isOutOfStock}
                        onClick={() => addToCart(p)}
                        className={`btn-touch px-2.5 py-1 text-xs font-bold rounded-xl transition ${
                          isOutOfStock
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sm active:scale-90'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Keranjang Belanja / Cart (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-3xl p-4 border border-surface-border shadow-card sticky top-16">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-cemiloo-500" />
                <h3 className="text-sm font-bold text-gray-900">
                  Keranjang Pesanan ({totalItemsCount})
                </h3>
              </div>
              <span className="text-xs font-black text-cemiloo-600">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                <p className="text-xs font-medium">Keranjang masih kosong.</p>
                <p className="text-[11px] text-gray-400">Pilih jajanan di sebelah kiri.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto my-2 pr-1 space-y-2">
                {cart.map((item, idx) => (
                  <div key={`${item.product.id}-${item.catatan}-${idx}`} className="pt-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-gray-900 leading-snug">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          {formatRupiah(item.product.harga_jual)} x {item.jumlah} ={' '}
                          <span className="font-bold text-gray-800">
                            {formatRupiah(item.product.harga_jual * item.jumlah)}
                          </span>
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQty(idx, -1)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 active:scale-90 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-extrabold text-gray-900">
                          {item.jumlah}
                        </span>
                        <button
                          onClick={() => updateCartQty(idx, 1)}
                          className="w-7 h-7 rounded-lg bg-sky-100 hover:bg-sky-200 flex items-center justify-center text-cemiloo-700 active:scale-90 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="w-7 h-7 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Level Pedas / Catatan Pill Selector */}
                    <div className="mt-1.5 flex items-center gap-1 overflow-x-auto pb-0.5">
                      <Flame className="w-3 h-3 text-amber-500 shrink-0" />
                      {LEVEL_PEDAS.map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => updateCartNote(idx, lvl)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition whitespace-nowrap ${
                            item.catatan === lvl
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total and Checkout Action */}
            <div className="pt-3 border-t border-surface-border space-y-2.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Total Belanja:</span>
                <span className="text-base font-black text-gray-900">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              <button
                disabled={cart.length === 0}
                onClick={handleOpenCheckout}
                className={`w-full btn-touch py-3 rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                  cart.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-cemiloo-500 hover:bg-cemiloo-600 text-white active:scale-95'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Bayar Sekarang ({formatRupiah(totalAmount)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHECKOUT & PEMBAYARAN */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-black text-gray-900">Selesaikan Pembayaran</h3>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {/* Total Tagihan */}
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 text-center">
                <span className="text-xs font-semibold text-sky-800">Total Tagihan Pesanan</span>
                <p className="text-2xl font-black text-cemiloo-700 mt-0.5">
                  {formatRupiah(totalAmount)}
                </p>
                <p className="text-[11px] text-sky-600 mt-0.5">
                  {totalItemsCount} item jajanan Cemiloo
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('tunai');
                      setCashAmount(totalAmount);
                    }}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'tunai'
                        ? 'border-cemiloo-500 bg-sky-50/70 text-cemiloo-700 ring-2 ring-sky-200'
                        : 'border-surface-border bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'qris'
                        ? 'border-cemiloo-500 bg-sky-50/70 text-cemiloo-700 ring-2 ring-sky-200'
                        : 'border-surface-border bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-cemiloo-600" />
                    QRIS / Transfer
                  </button>
                </div>
              </div>

              {/* Cash Calculation & Presets */}
              {paymentMethod === 'tunai' && (
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-gray-700">
                    Uang Diterima dari Pelanggan
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-surface-border rounded-xl text-base font-black text-gray-900 focus:bg-white"
                  />

                  {/* Cash preset quick chips */}
                  <div className="flex gap-1.5 flex-wrap">
                    {cashPresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          cashAmount === val
                            ? 'bg-cemiloo-500 text-white border-cemiloo-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {formatRupiah(val)}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian Indicator */}
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">Kembalian:</span>
                    <span className="text-base font-black text-emerald-700">
                      {formatRupiah(kembalian)}
                    </span>
                  </div>
                </div>
              )}

              {/* Keterangan Tambahan */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Keterangan / Catatan Transaksi (Opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Meja 3 / Bungkus plastik / Pelanggan langganan"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-surface-border rounded-xl focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="flex-1 btn-touch py-2.5 border border-surface-border text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleProcessSale}
                  className="flex-1 btn-touch py-2.5 bg-cemiloo-500 hover:bg-cemiloo-600 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi & Selesai'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STRUK TRANSAKSI DIGITAL MODAL */}
      {completedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-surface-border">
            {/* Printable Receipt Area */}
            <div id="receipt-print-area" className="text-center font-mono text-xs text-gray-800 space-y-2">
              <div className="w-12 h-12 mx-auto rounded-xl bg-sky-50 flex items-center justify-center p-1 border border-sky-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <h2 className="text-base font-black tracking-tight text-gray-900 font-sans">
                CEMILOO JAJANAN
              </h2>
              <p className="text-[11px] text-gray-500">
                Jajanan Ringan, Rasa Bikin Happy!
              </p>
              <div className="border-t border-b border-dashed border-gray-300 py-1 text-[10px] text-gray-500 text-left">
                <div>Waktu: {formatTanggalLengkap(completedTx.tanggal)}</div>
                <div>ID: {completedTx.id.slice(0, 8)}</div>
                <div>Ket: {completedTx.keterangan || '-'}</div>
              </div>

              {/* Rincian Produk */}
              <div className="space-y-1.5 py-1 text-left text-xs">
                {completedTx.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{it.product?.name || 'Produk'}</div>
                      <div className="text-[10px] text-gray-500">
                        {it.jumlah} x {formatRupiah(it.harga_satuan_saat_transaksi)} {it.catatan ? `(${it.catatan})` : ''}
                      </div>
                    </div>
                    <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between items-center text-sm font-black text-gray-900">
                <span>TOTAL</span>
                <span>{formatRupiah(completedTx.total_nominal)}</span>
              </div>

              <p className="text-[10px] text-gray-400 pt-2">
                Terima kasih sudah jajan di Cemiloo! Nikmati harimu dengan cemilan favorit.
              </p>
            </div>

            {/* Receipt Modal Actions */}
            <div className="mt-4 pt-3 border-t border-surface-border flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 btn-touch py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk
              </button>
              <button
                onClick={() => setCompletedTx(null)}
                className="flex-1 btn-touch py-2 bg-cemiloo-500 hover:bg-cemiloo-600 text-white text-xs font-bold rounded-xl"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
