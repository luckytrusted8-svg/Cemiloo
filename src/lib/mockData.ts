import { Category, Product, ExpenseCategory, Transaction, Expense } from '@/types/database';

export const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Basreng Series', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Makaroni Series', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Crispy Series', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Sweet Series', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Cheese Series', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Minuman', created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Paket Hemat', created_at: new Date().toISOString() },
];

export const initialProducts: Product[] = [
  // Basreng Series
  { id: 'prod-1', name: 'Basreng Original', category_id: 'cat-1', harga_jual: 5000, harga_modal: 3200, stok: 45, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-2', name: 'Basreng Pedas', category_id: 'cat-1', harga_jual: 5000, harga_modal: 3200, stok: 50, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-3', name: 'Basreng Daun Jeruk', category_id: 'cat-1', harga_jual: 6000, harga_modal: 3800, stok: 35, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-4', name: 'Basreng BBQ', category_id: 'cat-1', harga_jual: 6000, harga_modal: 3800, stok: 28, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-5', name: 'Basreng Keju', category_id: 'cat-1', harga_jual: 6000, harga_modal: 3800, stok: 4, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() }, // Low stock example
  { id: 'prod-6', name: 'Basreng Extra Pedas', category_id: 'cat-1', harga_jual: 7000, harga_modal: 4200, stok: 40, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },

  // Makaroni Series
  { id: 'prod-7', name: 'Makaroni Original', category_id: 'cat-2', harga_jual: 5000, harga_modal: 3000, stok: 40, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-8', name: 'Makaroni Pedas', category_id: 'cat-2', harga_jual: 5000, harga_modal: 3000, stok: 50, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-9', name: 'Makaroni Balado', category_id: 'cat-2', harga_jual: 5500, harga_modal: 3300, stok: 30, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-10', name: 'Makaroni BBQ', category_id: 'cat-2', harga_jual: 5500, harga_modal: 3300, stok: 25, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-11', name: 'Makaroni Keju', category_id: 'cat-2', harga_jual: 6000, harga_modal: 3600, stok: 20, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-12', name: 'Makaroni Extra Pedas', category_id: 'cat-2', harga_jual: 7000, harga_modal: 4000, stok: 35, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },

  // Crispy Series
  { id: 'prod-13', name: 'Usus Crispy', category_id: 'cat-3', harga_jual: 6000, harga_modal: 3800, stok: 3, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() }, // Low stock example
  { id: 'prod-14', name: 'Keripik Kaca', category_id: 'cat-3', harga_jual: 5000, harga_modal: 3000, stok: 25, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-15', name: 'Keripik Singkong', category_id: 'cat-3', harga_jual: 5000, harga_modal: 3000, stok: 30, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-16', name: 'Keripik Pisang', category_id: 'cat-3', harga_jual: 6000, harga_modal: 3800, stok: 22, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-17', name: 'Keripik Pisang Coklat', category_id: 'cat-3', harga_jual: 7000, harga_modal: 4500, stok: 18, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-18', name: 'Keripik Pisang Coklat Keju', category_id: 'cat-3', harga_jual: 8000, harga_modal: 5200, stok: 15, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-19', name: 'Kacang Atom', category_id: 'cat-3', harga_jual: 5000, harga_modal: 3200, stok: 28, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-20', name: 'Pilus Original', category_id: 'cat-3', harga_jual: 5000, harga_modal: 3000, stok: 25, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-21', name: 'Pilus Pedas', category_id: 'cat-3', harga_jual: 5000, harga_modal: 3000, stok: 30, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-22', name: 'Ciki Pedas', category_id: 'cat-3', harga_jual: 5000, harga_modal: 3100, stok: 35, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-23', name: 'Seblak Kering', category_id: 'cat-3', harga_jual: 6000, harga_modal: 3700, stok: 25, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },

  // Sweet Series
  { id: 'prod-24', name: 'Makaroni Coklat', category_id: 'cat-4', harga_jual: 6000, harga_modal: 3700, stok: 20, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-25', name: 'Choco Crunch', category_id: 'cat-4', harga_jual: 7000, harga_modal: 4400, stok: 25, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-26', name: 'Choco Cookies', category_id: 'cat-4', harga_jual: 7000, harga_modal: 4400, stok: 22, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-27', name: 'Brownies Bite', category_id: 'cat-4', harga_jual: 8000, harga_modal: 5000, stok: 18, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },

  // Cheese Series
  { id: 'prod-28', name: 'Cheese Ball', category_id: 'cat-5', harga_jual: 7000, harga_modal: 4400, stok: 25, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-29', name: 'Cheese Stick', category_id: 'cat-5', harga_jual: 6000, harga_modal: 3800, stok: 24, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-30', name: 'Potato Cheese', category_id: 'cat-5', harga_jual: 8000, harga_modal: 5200, stok: 16, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-31', name: 'Makaroni Cheese', category_id: 'cat-5', harga_jual: 6000, harga_modal: 3800, stok: 19, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-32', name: 'Basreng Cheese', category_id: 'cat-5', harga_jual: 7000, harga_modal: 4400, stok: 20, stok_minimum: 6, is_active: true, created_at: new Date().toISOString() },

  // Minuman
  { id: 'prod-33', name: 'Es Teh Manis', category_id: 'cat-6', harga_jual: 4000, harga_modal: 1800, stok: 80, stok_minimum: 15, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-34', name: 'Teh Lemon', category_id: 'cat-6', harga_jual: 5000, harga_modal: 2500, stok: 40, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-35', name: 'Es Coklat', category_id: 'cat-6', harga_jual: 7000, harga_modal: 4000, stok: 35, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-36', name: 'Coklat Oreo', category_id: 'cat-6', harga_jual: 8000, harga_modal: 4800, stok: 30, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-37', name: 'Matcha Latte', category_id: 'cat-6', harga_jual: 8000, harga_modal: 4800, stok: 25, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-38', name: 'Taro Latte', category_id: 'cat-6', harga_jual: 8000, harga_modal: 4800, stok: 22, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-39', name: 'Thai Tea', category_id: 'cat-6', harga_jual: 7000, harga_modal: 4000, stok: 35, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-40', name: 'Milo Ice', category_id: 'cat-6', harga_jual: 7000, harga_modal: 4200, stok: 30, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-41', name: 'Strawberry Milk', category_id: 'cat-6', harga_jual: 8000, harga_modal: 4800, stok: 25, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-42', name: 'Lemon Tea', category_id: 'cat-6', harga_jual: 6000, harga_modal: 3000, stok: 30, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },

  // Paket Hemat
  { id: 'prod-43', name: 'Paket Santai (2 snack)', category_id: 'cat-7', harga_jual: 9000, harga_modal: 6000, stok: 50, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-44', name: 'Paket Ngemil (3 snack)', category_id: 'cat-7', harga_jual: 13000, harga_modal: 8800, stok: 40, stok_minimum: 10, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-45', name: 'Paket Kenyang (4 snack)', category_id: 'cat-7', harga_jual: 17000, harga_modal: 11500, stok: 30, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-46', name: 'Paket Nongkrong (3 snack + 1 min)', category_id: 'cat-7', harga_jual: 18000, harga_modal: 12000, stok: 30, stok_minimum: 8, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-47', name: 'Paket Bestie (5 snack + 2 min)', category_id: 'cat-7', harga_jual: 30000, harga_modal: 20000, stok: 20, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
  { id: 'prod-48', name: 'Paket Ramean (8 snack + 3 min)', category_id: 'cat-7', harga_jual: 45000, harga_modal: 30000, stok: 15, stok_minimum: 5, is_active: true, created_at: new Date().toISOString() },
];

export const initialExpenseCategories: ExpenseCategory[] = [
  { id: 'exp-cat-1', name: 'Bahan Baku & Snack', created_at: new Date().toISOString() },
  { id: 'exp-cat-2', name: 'Minyak, Bumbu & Perasa', created_at: new Date().toISOString() },
  { id: 'exp-cat-3', name: 'Kemasan, Cup & Plastik', created_at: new Date().toISOString() },
  { id: 'exp-cat-4', name: 'Operasional & Gas', created_at: new Date().toISOString() },
  { id: 'exp-cat-5', name: 'Gaji Karyawan', created_at: new Date().toISOString() },
  { id: 'exp-cat-6', name: 'Lain-lain', created_at: new Date().toISOString() },
];

// Contoh transaksi riil beberapa hari terakhir agar dashboard langsung terisi grafik
const now = new Date();
const todayISO = now.toISOString();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

export const initialTransactions: Transaction[] = [
  {
    id: 'tx-101',
    type: 'masuk',
    tanggal: todayISO,
    keterangan: 'Penjualan sore - Pelanggan Reguler (Tunai)',
    total_nominal: 31000,
    created_at: todayISO,
    items: [
      {
        id: 'item-1',
        transaction_id: 'tx-101',
        product_id: 'prod-2',
        jumlah: 2,
        harga_satuan_saat_transaksi: 5000,
        subtotal: 10000,
        catatan: 'L3 Brutal',
        created_at: todayISO,
      },
      {
        id: 'item-2',
        transaction_id: 'tx-101',
        product_id: 'prod-3',
        jumlah: 1,
        harga_satuan_saat_transaksi: 6000,
        subtotal: 6000,
        catatan: 'L2 Nagih',
        created_at: todayISO,
      },
      {
        id: 'item-3',
        transaction_id: 'tx-101',
        product_id: 'prod-45',
        jumlah: 1,
        harga_satuan_saat_transaksi: 17000,
        subtotal: 17000,
        catatan: 'Paket Kenyang',
        created_at: todayISO,
      },
    ],
  },
  {
    id: 'tx-102',
    type: 'masuk',
    tanggal: yesterday,
    keterangan: 'Penjualan siang (QRIS)',
    total_nominal: 42000,
    created_at: yesterday,
    items: [
      {
        id: 'item-4',
        transaction_id: 'tx-102',
        product_id: 'prod-47',
        jumlah: 1,
        harga_satuan_saat_transaksi: 30000,
        subtotal: 30000,
        catatan: 'Paket Bestie',
        created_at: yesterday,
      },
      {
        id: 'item-5',
        transaction_id: 'tx-102',
        product_id: 'prod-33',
        jumlah: 3,
        harga_satuan_saat_transaksi: 4000,
        subtotal: 12000,
        created_at: yesterday,
      },
    ],
  },
  {
    id: 'tx-103',
    type: 'masuk',
    tanggal: twoDaysAgo,
    keterangan: 'Penjualan malam (Tunai)',
    total_nominal: 55000,
    created_at: twoDaysAgo,
    items: [
      {
        id: 'item-6',
        transaction_id: 'tx-103',
        product_id: 'prod-48',
        jumlah: 1,
        harga_satuan_saat_transaksi: 45000,
        subtotal: 45000,
        catatan: 'Paket Ramean',
        created_at: twoDaysAgo,
      },
      {
        id: 'item-7',
        transaction_id: 'tx-103',
        product_id: 'prod-2',
        jumlah: 2,
        harga_satuan_saat_transaksi: 5000,
        subtotal: 10000,
        created_at: twoDaysAgo,
      },
    ],
  },
];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    expense_category_id: 'exp-cat-2',
    nominal: 35000,
    keterangan: 'Minyak goreng 2 Liter & Bubuk Cabai Jeruk',
    tanggal: yesterday,
    created_at: yesterday,
  },
  {
    id: 'exp-2',
    expense_category_id: 'exp-cat-3',
    nominal: 25000,
    keterangan: 'Paper bowl Cemiloo & Plastik ziplock',
    tanggal: twoDaysAgo,
    created_at: twoDaysAgo,
  },
];
