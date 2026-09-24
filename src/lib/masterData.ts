import { Category, Product, ExpenseCategory, Transaction, Expense } from '@/types/database';

export const initialCategories: Category[] = [];

// Semua produk dimulai murni dari kosong (0 menu), siap diinput manual oleh pemilik
export const initialProducts: Product[] = [];

export const initialExpenseCategories: ExpenseCategory[] = [
  { id: 'exp-cat-1', name: 'Bahan Baku & Snack', created_at: new Date().toISOString() },
  { id: 'exp-cat-2', name: 'Minyak, Bumbu & Perasa', created_at: new Date().toISOString() },
  { id: 'exp-cat-3', name: 'Kemasan, Cup & Plastik', created_at: new Date().toISOString() },
  { id: 'exp-cat-4', name: 'Operasional & Gas', created_at: new Date().toISOString() },
  { id: 'exp-cat-5', name: 'Gaji Karyawan', created_at: new Date().toISOString() },
  { id: 'exp-cat-6', name: 'Lain-lain', created_at: new Date().toISOString() },
];

export const initialTransactions: Transaction[] = [];

export const initialExpenses: Expense[] = [];
