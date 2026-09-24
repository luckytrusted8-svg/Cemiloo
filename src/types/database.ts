export type TransactionType = 'masuk' | 'keluar';

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category_id: string | null;
  category?: Category;
  harga_jual: number;
  harga_modal: number;
  stok: number;
  stok_minimum: number;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  tanggal: string;
  keterangan: string | null;
  total_nominal: number;
  created_by?: string | null;
  created_at: string;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product?: Product;
  jumlah: number;
  harga_satuan_saat_transaksi: number;
  subtotal: number;
  catatan?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  expense_category_id: string;
  category?: ExpenseCategory;
  nominal: number;
  keterangan: string | null;
  tanggal: string;
  created_by?: string | null;
  created_at: string;
}

export interface ProductMargin {
  id: string;
  name: string;
  category_name: string;
  harga_modal: number;
  harga_jual: number;
  margin_nominal: number;
  margin_percentage: number;
  stok: number;
  stok_minimum: number;
  is_active: boolean;
}

export interface DashboardSummary {
  pemasukan: number;
  pengeluaran: number;
  untung_bersih: number;
  transaksi_count: number;
  item_terjual: number;
}

export interface ChartDayData {
  day: string;
  dateStr: string;
  masuk: number;
  keluar: number;
  untung: number;
}
