import { supabase, isSupabaseConfigured } from './supabase/client';
import {
  Category,
  Product,
  Transaction,
  TransactionItem,
  ExpenseCategory,
  Expense,
  DashboardSummary,
  ChartDayData,
  ProductMargin,
} from '@/types/database';
import {
  initialCategories,
  initialProducts,
  initialExpenseCategories,
  initialTransactions,
  initialExpenses,
} from './masterData';

const STORAGE_KEYS = {
  CATEGORIES: 'cemiloo_categories',
  PRODUCTS: 'cemiloo_products',
  EXP_CATEGORIES: 'cemiloo_exp_categories',
  TRANSACTIONS: 'cemiloo_transactions',
  EXPENSES: 'cemiloo_expenses',
};

const CLEAN_FLAG = 'cemiloo_clean_reset_zero_v2';

// Auto-reset existing financial transactions & expenses to zero on first load
if (typeof window !== 'undefined') {
  if (!localStorage.getItem(CLEAN_FLAG)) {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.setItem(CLEAN_FLAG, 'true');
  }
}

// Local storage helpers
function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export const DataService = {
  // Check connection
  isOnlineDatabase(): boolean {
    return isSupabaseConfigured;
  },

  // ----------------------------------------------------
  // CATEGORIES
  // ----------------------------------------------------
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').select('*').order('name');
      if (!error && data && data.length > 0) return data;
    }
    return getLocal<Category[]>(STORAGE_KEYS.CATEGORIES, initialCategories);
  },

  async addCategory(name: string): Promise<Category> {
    const newCat: Category = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'cat-' + Date.now(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').insert([{ name: newCat.name }]).select().single();
      if (!error && data) return data;
    }

    const current = await this.getCategories();
    const updated = [...current, newCat];
    setLocal(STORAGE_KEYS.CATEGORIES, updated);
    return newCat;
  },

  async deleteCategory(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('categories').delete().eq('id', id);
    }
    const current = await this.getCategories();
    setLocal(STORAGE_KEYS.CATEGORIES, current.filter(c => c.id !== id));
  },

  // ----------------------------------------------------
  // PRODUCTS
  // ----------------------------------------------------
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('name');
      if (!error && data && data.length > 0) return data;
    }
    const categories = await this.getCategories();
    let products = getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
    if (!products || products.length === 0) {
      products = initialProducts;
      setLocal(STORAGE_KEYS.PRODUCTS, products);
    }
    return products.map(p => ({
      ...p,
      category: categories.find(c => c.id === p.category_id),
    }));
  },

  async addProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'prod-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: newProduct.name,
          category_id: newProduct.category_id,
          harga_jual: newProduct.harga_jual,
          harga_modal: newProduct.harga_modal,
          stok: newProduct.stok,
          stok_minimum: newProduct.stok_minimum,
          is_active: newProduct.is_active,
        }])
        .select()
        .single();
      if (!error && data) return data;
    }

    const current = await this.getProducts();
    const updated = [newProduct, ...current];
    setLocal(STORAGE_KEYS.PRODUCTS, updated);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }

    const current = await this.getProducts();
    const index = current.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Produk tidak ditemukan');
    
    const updatedProd = { ...current[index], ...updates };
    current[index] = updatedProd;
    setLocal(STORAGE_KEYS.PRODUCTS, current);
    return updatedProd;
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    const current = await this.getProducts();
    setLocal(STORAGE_KEYS.PRODUCTS, current.filter(p => p.id !== id));
  },

  async quickAdjustStock(id: string, delta: number): Promise<Product> {
    const current = await this.getProducts();
    const prod = current.find(p => p.id === id);
    if (!prod) throw new Error('Produk tidak ditemukan');

    const newStock = Math.max(0, prod.stok + delta);
    return this.updateProduct(id, { stok: newStock });
  },

  // ----------------------------------------------------
  // TRANSACTIONS & POS CHECKOUT
  // ----------------------------------------------------
  async getTransactions(): Promise<Transaction[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, items:transaction_items(*, product:products(*))')
        .order('tanggal', { ascending: false });
      if (!error && data) return data;
    }
    const products = await this.getProducts();
    const txs = getLocal<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
    return txs.map(t => ({
      ...t,
      items: t.items?.map(it => ({
        ...it,
        product: products.find(p => p.id === it.product_id),
      })),
    }));
  },

  async createSaleTransaction(params: {
    items: { productId: string; jumlah: number; catatan?: string }[];
    keterangan?: string;
    tanggal?: string;
  }): Promise<Transaction> {
    const products = await this.getProducts();
    const dateStr = params.tanggal || new Date().toISOString();

    // 1. Validasi stok sebelum checkout
    for (const item of params.items) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      if (prod.stok < item.jumlah) {
        throw new Error(
          `Stok produk "${prod.name}" tidak mencukupi! Sisa stok: ${prod.stok}, diminta: ${item.jumlah}`
        );
      }
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Insert master transaction
      const { data: tx, error: txError } = await supabase
        .from('transactions')
        .insert([{
          type: 'masuk',
          tanggal: dateStr,
          keterangan: params.keterangan || 'Penjualan Kasir',
          total_nominal: 0,
        }])
        .select()
        .single();

      if (txError || !tx) throw new Error(txError?.message || 'Gagal membuat transaksi');

      // 2. Insert transaction_items (Postgres trigger will automatically validate & deduct stock, and sync total_nominal)
      const itemsToInsert = params.items.map(it => {
        const prod = products.find(p => p.id === it.productId)!;
        return {
          transaction_id: tx.id,
          product_id: it.productId,
          jumlah: it.jumlah,
          harga_satuan_saat_transaksi: prod.harga_jual,
          subtotal: it.jumlah * prod.harga_jual,
        };
      });

      const { data: insertedItems, error: itemsError } = await supabase
        .from('transaction_items')
        .insert(itemsToInsert)
        .select('*, product:products(*)');

      if (itemsError) throw new Error(itemsError.message);

      return {
        ...tx,
        items: insertedItems || [],
      };
    }

    // Fallback: LocalStorage business logic (mirrors Supabase triggers)
    const txId = 'tx-' + Date.now();
    let totalNominal = 0;

    const txItems: TransactionItem[] = params.items.map((it, idx) => {
      const prod = products.find(p => p.id === it.productId)!;
      const subtotal = it.jumlah * prod.harga_jual;
      totalNominal += subtotal;

      // Deduct stock
      prod.stok -= it.jumlah;

      return {
        id: `item-${Date.now()}-${idx}`,
        transaction_id: txId,
        product_id: prod.id,
        product: prod,
        jumlah: it.jumlah,
        harga_satuan_saat_transaksi: prod.harga_jual,
        subtotal,
        catatan: it.catatan,
        created_at: dateStr,
      };
    });

    // Save updated products stock
    setLocal(STORAGE_KEYS.PRODUCTS, products);

    const newTx: Transaction = {
      id: txId,
      type: 'masuk',
      tanggal: dateStr,
      keterangan: params.keterangan || 'Penjualan Kasir',
      total_nominal: totalNominal,
      created_at: dateStr,
      items: txItems,
    };

    const currentTxs = await this.getTransactions();
    setLocal(STORAGE_KEYS.TRANSACTIONS, [newTx, ...currentTxs]);

    return newTx;
  },

  async deleteTransaction(id: string): Promise<void> {
    const transactions = await this.getTransactions();
    const target = transactions.find(t => t.id === id);
    if (!target) return;

    if (isSupabaseConfigured && supabase) {
      // Postgres cascade delete on transaction_items will fire AFTER DELETE trigger and restore stock automatically
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return;
    }

    // Fallback: Restore stock in local storage
    if (target.type === 'masuk' && target.items) {
      const products = await this.getProducts();
      for (const item of target.items) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          prod.stok += item.jumlah;
        }
      }
      setLocal(STORAGE_KEYS.PRODUCTS, products);
    }

    setLocal(STORAGE_KEYS.TRANSACTIONS, transactions.filter(t => t.id !== id));
  },

  // ----------------------------------------------------
  // EXPENSES
  // ----------------------------------------------------
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('expense_categories').select('*').order('name');
      if (!error && data && data.length > 0) return data;
    }
    return getLocal<ExpenseCategory[]>(STORAGE_KEYS.EXP_CATEGORIES, initialExpenseCategories);
  },

  async addExpenseCategory(name: string): Promise<ExpenseCategory> {
    const newCat: ExpenseCategory = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'exp-cat-' + Date.now(),
      name: name.trim(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{ name: newCat.name }])
        .select()
        .single();
      if (!error && data) return data;
    }

    const current = await this.getExpenseCategories();
    const updated = [...current, newCat];
    setLocal(STORAGE_KEYS.EXP_CATEGORIES, updated);
    return newCat;
  },

  async getExpenses(): Promise<Expense[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, category:expense_categories(*)')
        .order('tanggal', { ascending: false });
      if (!error && data) return data;
    }
    const categories = await this.getExpenseCategories();
    const expenses = getLocal<Expense[]>(STORAGE_KEYS.EXPENSES, initialExpenses);
    return expenses.map(e => ({
      ...e,
      category: categories.find(c => c.id === e.expense_category_id),
    }));
  },

  async addExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const newExp: Expense = {
      ...expense,
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : 'exp-' + Date.now(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          expense_category_id: newExp.expense_category_id,
          nominal: newExp.nominal,
          keterangan: newExp.keterangan,
          tanggal: newExp.tanggal,
        }])
        .select('*, category:expense_categories(*)')
        .single();
      if (!error && data) return data;
    }

    const current = await this.getExpenses();
    const updated = [newExp, ...current];
    setLocal(STORAGE_KEYS.EXPENSES, updated);
    return newExp;
  },

  async deleteExpense(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    const current = await this.getExpenses();
    setLocal(STORAGE_KEYS.EXPENSES, current.filter(e => e.id !== id));
  },

  // ----------------------------------------------------
  // ANALYTICS & DASHBOARD METRICS
  // ----------------------------------------------------
  async getDashboardSummary(period: 'hari_ini' | 'minggu_ini' | 'bulan_ini'): Promise<DashboardSummary> {
    const transactions = await this.getTransactions();
    const expenses = await this.getExpenses();

    const now = new Date();
    let startDate = new Date();

    if (period === 'hari_ini') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'minggu_ini') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'bulan_ini') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startTs = startDate.getTime();

    // Filter transactions
    const filteredTxs = transactions.filter(t => new Date(t.tanggal).getTime() >= startTs);
    const filteredExps = expenses.filter(e => new Date(e.tanggal).getTime() >= startTs);

    const pemasukan = filteredTxs
      .filter(t => t.type === 'masuk')
      .reduce((sum, t) => sum + Number(t.total_nominal), 0);

    const pengeluaran = filteredExps.reduce((sum, e) => sum + Number(e.nominal), 0);

    const untung_bersih = pemasukan - pengeluaran;

    let item_terjual = 0;
    filteredTxs.forEach(t => {
      t.items?.forEach(it => {
        item_terjual += it.jumlah;
      });
    });

    return {
      pemasukan,
      pengeluaran,
      untung_bersih,
      transaksi_count: filteredTxs.length,
      item_terjual,
    };
  },

  async get7DaysTrend(): Promise<ChartDayData[]> {
    const transactions = await this.getTransactions();
    const expenses = await this.getExpenses();

    const days: ChartDayData[] = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0).getTime();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59).getTime();

      const masuk = transactions
        .filter(t => {
          const time = new Date(t.tanggal).getTime();
          return time >= startOfDay && time <= endOfDay && t.type === 'masuk';
        })
        .reduce((sum, t) => sum + Number(t.total_nominal), 0);

      const keluar = expenses
        .filter(e => {
          const time = new Date(e.tanggal).getTime();
          return time >= startOfDay && time <= endOfDay;
        })
        .reduce((sum, e) => sum + Number(e.nominal), 0);

      days.push({
        day: dayNames[d.getDay()],
        dateStr: `${d.getDate()}/${d.getMonth() + 1}`,
        masuk,
        keluar,
        untung: masuk - keluar,
      });
    }

    return days;
  },

  async getTopSellingProducts(limit = 5): Promise<{ product: Product; totalQty: number; totalSales: number }[]> {
    const transactions = await this.getTransactions();
    const products = await this.getProducts();

    const counts: Record<string, { qty: number; sales: number }> = {};

    transactions.forEach(t => {
      t.items?.forEach(it => {
        if (!counts[it.product_id]) {
          counts[it.product_id] = { qty: 0, sales: 0 };
        }
        counts[it.product_id].qty += it.jumlah;
        counts[it.product_id].sales += it.subtotal;
      });
    });

    const result = Object.entries(counts)
      .map(([prodId, stats]) => {
        const prod = products.find(p => p.id === prodId);
        return {
          product: prod || {
            id: prodId,
            name: 'Produk Terhapus',
            category_id: null,
            harga_jual: 0,
            harga_modal: 0,
            stok: 0,
            stok_minimum: 0,
            is_active: false,
            created_at: new Date().toISOString(),
          },
          totalQty: stats.qty,
          totalSales: stats.sales,
        };
      })
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, limit);

    return result;
  },

  async getLowStockProducts(): Promise<Product[]> {
    const products = await this.getProducts();
    return products.filter(p => p.is_active && p.stok <= p.stok_minimum);
  },

  async getProductMargins(): Promise<ProductMargin[]> {
    const products = await this.getProducts();
    return products.map(p => {
      const margin_nominal = p.harga_jual - p.harga_modal;
      const margin_percentage = p.harga_jual > 0 ? (margin_nominal / p.harga_jual) * 100 : 0;
      return {
        id: p.id,
        name: p.name,
        category_name: p.category?.name || 'Tanpa Kategori',
        harga_modal: p.harga_modal,
        harga_jual: p.harga_jual,
        margin_nominal,
        margin_percentage: Math.round(margin_percentage * 10) / 10,
        stok: p.stok,
        stok_minimum: p.stok_minimum,
        is_active: p.is_active,
      };
    });
  },

  async resetAllFinancialDataToZero(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('transaction_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    setLocal(STORAGE_KEYS.TRANSACTIONS, []);
    setLocal(STORAGE_KEYS.EXPENSES, []);
  },
};

