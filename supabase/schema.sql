-- ==============================================================================
-- CEMILOO PWA - SUPABASE DATABASE SCHEMA, TRIGGERS & BUSINESS LOGIC
-- ==============================================================================
-- Petunjuk: Jalankan seluruh script SQL ini di Supabase SQL Editor.
-- Script ini mencakup:
-- 1. Tabel master dan relasi (Foreign Keys dengan cascade & constraint yang aman)
-- 2. Constraints (stok tidak boleh negatif, harga >= 0, dll.)
-- 3. Stored Functions & Triggers untuk otomatisasi stok & subtotal
-- 4. View pembantu untuk stok menipis dan kalkulasi margin laba
-- 5. Row Level Security (RLS) & Policies untuk Supabase Auth
-- 6. Seed Data awal dari Menu Resmi Cemiloo (Basreng, Makaroni, Crispy, Sweet, Minuman, Paket)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. CREATE TABLES
-- ==============================================================================

-- Tabel Kategori Produk
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel Produk Jajanan
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    harga_jual NUMERIC(12, 2) NOT NULL CHECK (harga_jual >= 0),
    harga_modal NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (harga_modal >= 0),
    stok INTEGER NOT NULL DEFAULT 0 CHECK (stok >= 0),
    stok_minimum INTEGER NOT NULL DEFAULT 5 CHECK (stok_minimum >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index untuk performa pencarian produk
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- Tabel Transaksi (Penjualan / Pengeluaran)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('masuk', 'keluar')),
    tanggal TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    keterangan TEXT,
    total_nominal NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (total_nominal >= 0),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_tanggal ON public.transactions(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

-- Tabel Item Detail Transaksi (Snapshot harga satuan dan subtotal)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    harga_satuan_saat_transaksi NUMERIC(12, 2) NOT NULL CHECK (harga_satuan_saat_transaksi >= 0),
    subtotal NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_trans_items_tx ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_trans_items_product ON public.transaction_items(product_id);

-- Tabel Kategori Pengeluaran (Bahan Baku, Operasional, Gaji, dll.)
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Tabel Catatan Pengeluaran
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    nominal NUMERIC(14, 2) NOT NULL CHECK (nominal > 0),
    keterangan TEXT,
    tanggal TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_expenses_tanggal ON public.expenses(tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(expense_category_id);

-- ==============================================================================
-- 3. TRIGGERS & DATABASE FUNCTIONS
-- ==============================================================================

-- A. Trigger untuk menghitung subtotal secara otomatis pada transaction_items
CREATE OR REPLACE FUNCTION public.fn_calculate_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    NEW.subtotal := NEW.jumlah * NEW.harga_satuan_saat_transaksi;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_item_subtotal ON public.transaction_items;
CREATE TRIGGER trg_calculate_item_subtotal
    BEFORE INSERT OR UPDATE OF jumlah, harga_satuan_saat_transaksi
    ON public.transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_calculate_item_subtotal();

-- B. Trigger Sinkronisasi Total Nominal pada Tabel Transactions
CREATE OR REPLACE FUNCTION public.fn_sync_transaction_total()
RETURNS TRIGGER AS $$
DECLARE
    target_tx_id UUID;
    calc_total NUMERIC(14, 2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_tx_id := OLD.transaction_id;
    ELSE
        target_tx_id := NEW.transaction_id;
    END IF;

    -- Hitung akumulasi subtotal semua item
    SELECT COALESCE(SUM(subtotal), 0)
    INTO calc_total
    FROM public.transaction_items
    WHERE transaction_id = target_tx_id;

    -- Update ke master transaksi jika transaksi adalah tipe penjualan ('masuk')
    UPDATE public.transactions
    SET total_nominal = calc_total
    WHERE id = target_tx_id AND type = 'masuk';

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_transaction_total ON public.transaction_items;
CREATE TRIGGER trg_sync_transaction_total
    AFTER INSERT OR UPDATE OR DELETE
    ON public.transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_transaction_total();

-- C. Trigger Pengurangan & Pengembalian Stok Otomatis + Validasi Stok Cukup
CREATE OR REPLACE FUNCTION public.fn_manage_stock_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    tx_type TEXT;
    cur_stock INT;
    prod_name TEXT;
    delta_qty INT;
BEGIN
    -- 1. Penanganan Operasi INSERT (Penjualan baru dibuat)
    IF (TG_OP = 'INSERT') THEN
        SELECT type INTO tx_type FROM public.transactions WHERE id = NEW.transaction_id;
        
        -- Hanya transaksi 'masuk' (penjualan) yang memotong stok produk
        IF (tx_type = 'masuk') THEN
            -- Kunci baris produk (FOR UPDATE) untuk menghindari race condition
            SELECT stok, name INTO cur_stock, prod_name 
            FROM public.products 
            WHERE id = NEW.product_id 
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Produk tidak ditemukan.';
            END IF;

            IF cur_stock < NEW.jumlah THEN
                RAISE EXCEPTION 'Stok produk "%" tidak mencukupi! Sisa stok: %, jumlah diminta: %', prod_name, cur_stock, NEW.jumlah;
            END IF;

            -- Kurangi stok
            UPDATE public.products 
            SET stok = stok - NEW.jumlah 
            WHERE id = NEW.product_id;
        END IF;

        RETURN NEW;

    -- 2. Penanganan Operasi UPDATE (Jumlah item diubah atau produk diganti)
    ELSIF (TG_OP = 'UPDATE') THEN
        SELECT type INTO tx_type FROM public.transactions WHERE id = NEW.transaction_id;
        
        IF (tx_type = 'masuk') THEN
            IF (OLD.product_id = NEW.product_id) THEN
                -- Produk sama, hitung selisih
                delta_qty := NEW.jumlah - OLD.jumlah;
                
                IF (delta_qty > 0) THEN
                    -- Penambahan kuantiti, cek stok tambahan
                    SELECT stok, name INTO cur_stock, prod_name 
                    FROM public.products 
                    WHERE id = NEW.product_id 
                    FOR UPDATE;

                    IF cur_stock < delta_qty THEN
                        RAISE EXCEPTION 'Stok produk "%" tidak mencukupi untuk penambahan! Sisa stok: %, dibutuhkan: %', prod_name, cur_stock, delta_qty;
                    END IF;

                    UPDATE public.products SET stok = stok - delta_qty WHERE id = NEW.product_id;
                ELSIF (delta_qty < 0) THEN
                    -- Pengurangan kuantiti, kembalikan selisih ke stok
                    UPDATE public.products SET stok = stok + ABS(delta_qty) WHERE id = NEW.product_id;
                END IF;
            ELSE
                -- Produk diganti: kembalikan stok lama, kurangi stok baru
                UPDATE public.products SET stok = stok + OLD.jumlah WHERE id = OLD.product_id;

                SELECT stok, name INTO cur_stock, prod_name 
                FROM public.products 
                WHERE id = NEW.product_id 
                FOR UPDATE;

                IF cur_stock < NEW.jumlah THEN
                    RAISE EXCEPTION 'Stok produk "%" tidak mencukupi! Sisa stok: %, diminta: %', prod_name, cur_stock, NEW.jumlah;
                END IF;

                UPDATE public.products SET stok = stok - NEW.jumlah WHERE id = NEW.product_id;
            END IF;
        END IF;

        RETURN NEW;

    -- 3. Penanganan Operasi DELETE (Item atau Transaksi dihapus)
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT type INTO tx_type FROM public.transactions WHERE id = OLD.transaction_id;
        
        -- Kembalikan stok yang sebelumnya terpotong
        IF (tx_type = 'masuk') THEN
            UPDATE public.products 
            SET stok = stok + OLD.jumlah 
            WHERE id = OLD.product_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_manage_stock_on_transaction ON public.transaction_items;
CREATE TRIGGER trg_manage_stock_on_transaction
    BEFORE INSERT OR UPDATE OR DELETE
    ON public.transaction_items
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_manage_stock_on_transaction();

-- D. Mencegah perubahan tipe transaksi jika item sudah terisi
CREATE OR REPLACE FUNCTION public.fn_prevent_tx_type_switch()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.type <> NEW.type) AND EXISTS (SELECT 1 FROM public.transaction_items WHERE transaction_id = NEW.id) THEN
        RAISE EXCEPTION 'Tipe transaksi tidak boleh diubah karena sudah memiliki rincian produk.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_tx_type_switch ON public.transactions;
CREATE TRIGGER trg_prevent_tx_type_switch
    BEFORE UPDATE OF type
    ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_prevent_tx_type_switch();

-- ==============================================================================
-- 4. VIEWS UNTUK DASHBOARD & ANALISIS
-- ==============================================================================

-- View Produk Stok Menipis (Alert Dashboard)
CREATE OR REPLACE VIEW public.v_low_stock_products AS
SELECT 
    p.id,
    p.name,
    c.name AS category_name,
    p.stok,
    p.stok_minimum,
    (p.stok <= p.stok_minimum) AS is_low_stock,
    p.harga_jual,
    p.is_active
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.is_active = true AND p.stok <= p.stok_minimum
ORDER BY p.stok ASC;

-- View Margin Keuntungan Per Produk
CREATE OR REPLACE VIEW public.v_product_margins AS
SELECT 
    p.id,
    p.name,
    c.name AS category_name,
    p.harga_modal,
    p.harga_jual,
    (p.harga_jual - p.harga_modal) AS margin_nominal,
    CASE 
        WHEN p.harga_jual > 0 THEN 
            ROUND(((p.harga_jual - p.harga_modal) / p.harga_jual * 100), 1)
        ELSE 0 
    END AS margin_percentage,
    p.stok,
    p.stok_minimum,
    p.is_active
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id;

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy untuk Pemilik/Pengguna Terautentikasi (Full Access)
CREATE POLICY "Auth users full access on categories" ON public.categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users full access on products" ON public.products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users full access on transactions" ON public.transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users full access on transaction_items" ON public.transaction_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users full access on expense_categories" ON public.expense_categories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth users full access on expenses" ON public.expenses
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- (Opsional) Izinkan baca jika dalam status pengembangan/anonim saat setup awal
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "Public read expense_categories" ON public.expense_categories FOR SELECT TO anon USING (true);

-- ==============================================================================
-- 6. SEED DATA MENU LENGKAP RESMI CEMILOO
-- ==============================================================================

-- Kategori Produk
INSERT INTO public.categories (name) VALUES
    ('Basreng Series'),
    ('Makaroni Series'),
    ('Crispy Series'),
    ('Sweet Series'),
    ('Cheese Series'),
    ('Minuman'),
    ('Paket Hemat')
ON CONFLICT (name) DO NOTHING;

-- Kategori Pengeluaran
INSERT INTO public.expense_categories (name) VALUES
    ('Bahan Baku & Snack'),
    ('Minyak, Bumbu & Perasa'),
    ('Kemasan, Cup & Plastik'),
    ('Operasional & Gas'),
    ('Gaji Karyawan'),
    ('Lain-lain')
ON CONFLICT (name) DO NOTHING;

-- Produk-produk Cemiloo (Berdasarkan Daftar Menu Resmi)
DO $$
DECLARE
    cat_basreng UUID;
    cat_makaroni UUID;
    cat_crispy UUID;
    cat_sweet UUID;
    cat_cheese UUID;
    cat_minuman UUID;
    cat_paket UUID;
BEGIN
    SELECT id INTO cat_basreng FROM public.categories WHERE name = 'Basreng Series';
    SELECT id INTO cat_makaroni FROM public.categories WHERE name = 'Makaroni Series';
    SELECT id INTO cat_crispy FROM public.categories WHERE name = 'Crispy Series';
    SELECT id INTO cat_sweet FROM public.categories WHERE name = 'Sweet Series';
    SELECT id INTO cat_cheese FROM public.categories WHERE name = 'Cheese Series';
    SELECT id INTO cat_minuman FROM public.categories WHERE name = 'Minuman';
    SELECT id INTO cat_paket FROM public.categories WHERE name = 'Paket Hemat';

    -- Basreng Series
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Basreng Original', cat_basreng, 5000, 3200, 0, 5),
        ('Basreng Pedas', cat_basreng, 5000, 3200, 0, 5),
        ('Basreng Daun Jeruk', cat_basreng, 6000, 3800, 0, 5),
        ('Basreng BBQ', cat_basreng, 6000, 3800, 0, 5),
        ('Basreng Keju', cat_basreng, 6000, 3800, 0, 5),
        ('Basreng Extra Pedas', cat_basreng, 7000, 4200, 0, 5);

    -- Makaroni Series
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Makaroni Original', cat_makaroni, 5000, 3000, 0, 5),
        ('Makaroni Pedas', cat_makaroni, 5000, 3000, 0, 5),
        ('Makaroni Balado', cat_makaroni, 5500, 3300, 0, 5),
        ('Makaroni BBQ', cat_makaroni, 5500, 3300, 0, 5),
        ('Makaroni Keju', cat_makaroni, 6000, 3600, 0, 5),
        ('Makaroni Extra Pedas', cat_makaroni, 7000, 4000, 0, 5);

    -- Crispy Series
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Usus Crispy', cat_crispy, 6000, 3800, 0, 5),
        ('Keripik Kaca', cat_crispy, 5000, 3000, 0, 5),
        ('Keripik Singkong', cat_crispy, 5000, 3000, 0, 5),
        ('Keripik Pisang', cat_crispy, 6000, 3800, 0, 5),
        ('Keripik Pisang Coklat', cat_crispy, 7000, 4500, 0, 5),
        ('Keripik Pisang Coklat Keju', cat_crispy, 8000, 5200, 0, 5),
        ('Kacang Atom', cat_crispy, 5000, 3200, 0, 5),
        ('Pilus Original', cat_crispy, 5000, 3000, 0, 5),
        ('Pilus Pedas', cat_crispy, 5000, 3000, 0, 5),
        ('Ciki Pedas', cat_crispy, 5000, 3100, 0, 5),
        ('Seblak Kering', cat_crispy, 6000, 3700, 0, 5);

    -- Sweet Series
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Makaroni Coklat', cat_sweet, 6000, 3700, 0, 5),
        ('Choco Crunch', cat_sweet, 7000, 4400, 0, 5),
        ('Choco Cookies', cat_sweet, 7000, 4400, 0, 5),
        ('Brownies Bite', cat_sweet, 8000, 5000, 0, 5);

    -- Cheese Series
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Cheese Ball', cat_cheese, 7000, 4400, 0, 5),
        ('Cheese Stick', cat_cheese, 6000, 3800, 0, 5),
        ('Potato Cheese', cat_cheese, 8000, 5200, 0, 5),
        ('Makaroni Cheese', cat_cheese, 6000, 3800, 0, 5),
        ('Basreng Cheese', cat_cheese, 7000, 4400, 0, 5);

    -- Minuman Segar
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Es Teh Manis', cat_minuman, 4000, 1800, 0, 5),
        ('Teh Lemon', cat_minuman, 5000, 2500, 0, 5),
        ('Es Coklat', cat_minuman, 7000, 4000, 0, 5),
        ('Coklat Oreo', cat_minuman, 8000, 4800, 0, 5),
        ('Matcha Latte', cat_minuman, 8000, 4800, 0, 5),
        ('Taro Latte', cat_minuman, 8000, 4800, 0, 5),
        ('Thai Tea', cat_minuman, 7000, 4000, 0, 5),
        ('Milo Ice', cat_minuman, 7000, 4200, 0, 5),
        ('Strawberry Milk', cat_minuman, 8000, 4800, 0, 5),
        ('Lemon Tea', cat_minuman, 6000, 3000, 0, 5);

    -- Paket Hemat
    INSERT INTO public.products (name, category_id, harga_jual, harga_modal, stok, stok_minimum) VALUES
        ('Paket Santai (2 snack)', cat_paket, 9000, 6000, 0, 5),
        ('Paket Ngemil (3 snack)', cat_paket, 13000, 8800, 0, 5),
        ('Paket Kenyang (4 snack)', cat_paket, 17000, 11500, 0, 5),
        ('Paket Nongkrong (3 snack + 1 min)', cat_paket, 18000, 12000, 0, 5),
        ('Paket Bestie (5 snack + 2 min)', cat_paket, 30000, 20000, 0, 5),
        ('Paket Ramean (8 snack + 3 min)', cat_paket, 45000, 30000, 0, 5);

END $$;

-- --------------------------------------------------------
-- 9. AKTIFKAN SUPABASE REALTIME REPLICATION (HP <-> LAPTOP REALTIME)
-- --------------------------------------------------------
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_categories;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_items;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

