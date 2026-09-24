# Cemiloo - Catat Keuangan & Kasir Jajanan PWA 🥟🍿

Aplikasi web Progressive Web App (PWA) modern untuk pencatatan keuangan dan sistem kasir point-of-sale (POS) bisnis jajanan **Cemiloo**. Dibangun dengan arsitektur mobile-first, performa cepat, tampilan bersih berlatar terang dengan kontras tinggi, dan sinkronisasi database PostgreSQL otomatis.

---

## 🚀 Fitur Utama

1. **Dashboard Bisnis**
   - Ringkasan Pemasukan, Pengeluaran, dan Untung Bersih (Filter: Hari Ini / 7 Hari / Bulan Ini).
   - Grafik batang interaktif tren 7 hari terakhir (Pemasukan vs Pengeluaran).
   - 5 Menu Jajanan Terlaris.
   - Widget Alert stok menipis dengan tombol restock cepat (`+10`, `+20`).

2. **Kasir POS Cepat (Point of Sale)**
   - Keranjang belanja multi-produk dalam satu transaksi.
   - Pilihan **Level Pedas** (*Original, L1 Santuy, L2 Nagih, L3 Brutal, L4 Gila*).
   - Validasi otomatis sisa stok jajanan (mencegah checkout jika stok habis).
   - Pembayaran Tunai (dengan kalkulator uang kembalian kilat) dan QRIS.
   - Struk digital siap cetak (*print receipt*).
   - Animasi perayaan confetti saat transaksi sukses.

3. **Manajemen Produk & Kategori (CRUD Penuh)**
   - Tambah, edit, dan hapus menu jajanan dan varian.
   - Kalkulasi otomatis estimasi margin keuntungan (`harga jual - harga modal` & margin %).
   - Toggle status produk Aktif/Nonaktif tanpa menghapus data riwayat.
   - Penyesuaian stok cepat (`+5`, `+10`).
   - Manajemen kategori produk.

4. **Catat Pengeluaran**
   - Pencatatan biaya operasional (Bahan baku, minyak & bumbu, kemasan, gas, gaji karyawan).
   - Tombol nominal kilat (+10rb, +25rb, +50rb, +100rb, dll.).

5. **Laporan Keuangan & Margin Profitabilitas**
   - Filter rentang tanggal fleksibel.
   - Ringkasan total arus kas periode terpilih.
   - Tabel analisis margin keuntungan per produk.
   - **Export data ke format CSV / Excel**.

6. **Riwayat Transaksi**
   - Alur kronologis transaksi penjualan dan pengeluaran.
   - Modal detail rincian produk yang dibeli per transaksi.
   - Fitur pembatalan transaksi dengan pengembalian stok otomatis.

7. **PWA (Progressive Web App)**
   - *Installable* di smartphone Android & iOS.
   - Bekerja secara offline menggunakan Service Worker dan local cache.
   - Desain ramah jempol (*thumb-friendly*).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (Clean Light Theme, Cemiloo Sky Blue Accent)
- **Database & Auth**: Supabase (PostgreSQL + Triggers + Functions + Auth)
- **PWA**: Web App Manifest (`manifest.json`) + Service Worker (`sw.js`)
- **Deploy**: Vercel Ready

---

## 🗄️ Database Triggers (PostgreSQL)

Seluruh logika kritis dijalankan langsung di database engine Supabase via stored procedure & trigger:
- `fn_calculate_item_subtotal`: Menghitung subtotal snapshot per produk.
- `fn_sync_transaction_total`: Menghitung akumulasi total transaksi penjualan.
- `fn_manage_stock_on_transaction`: Mengunci baris produk (`FOR UPDATE`), memvalidasi ketersediaan stok, memotong stok saat penjualan (`INSERT`), menyesuaikan stok saat diupdate (`UPDATE`), dan mengembalikan stok saat transaksi dihapus (`DELETE`).

File skema lengkap tersedia di: [`supabase/schema.sql`](./supabase/schema.sql).

---

## 💻 Cara Menjalankan Secara Lokal

1. **Clone repository**:
   ```bash
   git clone https://github.com/luckytrusted8-svg/Cemiloo.git
   cd Cemiloo
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variable**:
   Salin `.env.local.example` menjadi `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📄 Lisensi
Hak Cipta © 2026 Cemiloo. Dikembangkan untuk pencatatan keuangan dan kasir UMKM.
