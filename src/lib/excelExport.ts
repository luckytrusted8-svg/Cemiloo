import { Transaction, Expense, ProductMargin } from '@/types/database';
import { formatRupiah, formatTanggalLengkap, formatTanggal } from './utils';

interface ExcelExportParams {
  title?: string;
  startDate: string;
  endDate: string;
  totalMasuk: number;
  totalKeluar: number;
  untungBersih: number;
  transactions: Transaction[];
  expenses: Expense[];
  margins: ProductMargin[];
}

export function exportBeautifulExcelReport({
  title = 'Laporan Keuangan Cemiloo',
  startDate,
  endDate,
  totalMasuk,
  totalKeluar,
  untungBersih,
  transactions,
  expenses,
  margins,
}: ExcelExportParams) {
  const currentDateStr = formatTanggalLengkap(new Date());
  const periodStr = `${formatTanggal(startDate)} s/d ${formatTanggal(endDate)}`;

  // Generate 5 blank template rows if data is zero/empty so the user has a structured blank grid in Excel
  const emptyTxRows = Array.from({ length: 5 })
    .map(
      (_, i) => `
    <tr>
      <td style="text-align: center; color: #94a3b8; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; color: #cbd5e1;">-</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; color: #cbd5e1;">-</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; color: #94a3b8; font-style: italic;">[ Baris Kosong - Siap Diisi Transaksi Baru ]</td>
      <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; color: #cbd5e1;">0 pcs</td>
      <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; color: #94a3b8;">Rp 0</td>
    </tr>`
    )
    .join('');

  const emptyExpRows = Array.from({ length: 5 })
    .map(
      (_, i) => `
    <tr>
      <td style="text-align: center; color: #94a3b8; border: 1px solid #cbd5e1; padding: 6px;">${i + 1}</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; color: #cbd5e1;">-</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; color: #cbd5e1;">-</td>
      <td style="border: 1px solid #cbd5e1; padding: 6px; color: #94a3b8; font-style: italic;">[ Baris Kosong - Siap Diisi Biaya Baru ]</td>
      <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px; color: #94a3b8;">Rp 0</td>
    </tr>`
    )
    .join('');

  const excelHTML = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Laporan Keuangan Cemiloo</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:ValidPrinterInfo/>
              <x:PaperSizeIndex>9</x:PaperSizeIndex>
              <x:HorizontalResolution>600</x:HorizontalResolution>
              <x:VerticalResolution>600</x:VerticalResolution>
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; font-size: 11pt; color: #1e293b; background-color: #ffffff; }
    .header-box { background-color: #0284c7; color: #ffffff; padding: 16px; border-radius: 6px; }
    .header-title { font-size: 20pt; font-weight: bold; color: #ffffff; }
    .header-sub { font-size: 11pt; color: #e0f2fe; }
    .info-label { font-weight: bold; color: #334155; font-size: 10pt; }
    .info-value { color: #0f172a; font-size: 10pt; }
    
    .card-kpi { border: 2px solid #cbd5e1; background-color: #f8fafc; padding: 12px; text-align: center; border-radius: 6px; }
    .kpi-title { font-size: 9pt; font-weight: bold; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
    .kpi-val-green { font-size: 17pt; font-weight: bold; color: #15803d; }
    .kpi-val-red { font-size: 17pt; font-weight: bold; color: #dc2626; }
    .kpi-val-blue { font-size: 17pt; font-weight: bold; color: #0284c7; }
    .kpi-val-dark { font-size: 17pt; font-weight: bold; color: #1e293b; }

    .section-head { font-size: 13pt; font-weight: bold; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-top: 18px; margin-bottom: 8px; }
    
    .table-custom { border-collapse: collapse; width: 100%; margin-top: 6px; }
    .table-custom th { font-weight: bold; font-size: 10pt; padding: 10px 8px; border: 1px solid #64748b; color: #ffffff; }
    .th-blue { background-color: #0284c7; }
    .th-red { background-color: #e11d48; }
    .th-indigo { background-color: #4f46e5; }
    .table-custom td { padding: 7px 8px; border: 1px solid #cbd5e1; font-size: 10pt; }
    .tr-even { background-color: #f8fafc; }
    .tr-odd { background-color: #ffffff; }
    .tr-total { background-color: #e2e8f0; font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .badge-clean { background-color: #ecfdf5; color: #065f46; font-weight: bold; padding: 2px 6px; border: 1px solid #a7f3d0; border-radius: 4px; }
  </style>
</head>
<body>

  <!-- KOP SURAT / EXECUTIVE HEADER -->
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="background-color: #0284c7;">
      <td colspan="6" style="padding: 18px 14px;">
        <span style="font-size: 22pt; font-weight: bold; color: #ffffff; letter-spacing: 1px;">CEMILOO - LAPORAN KEUANGAN BISNIS</span><br/>
        <span style="font-size: 11pt; color: #bae6fd;">Sistem Kasir POS & Rekapitulasi Pembukuan Jajanan Cemiloo Resmi</span>
      </td>
    </tr>
    <tr><td colspan="6" style="height: 12px;"></td></tr>
    <tr>
      <td style="width: 140px;" class="info-label">Periode Pembukuan:</td>
      <td style="width: 240px;" class="info-value"><strong>${periodStr}</strong></td>
      <td style="width: 140px;" class="info-label">Tanggal Cetak:</td>
      <td style="width: 200px;" class="info-value">${currentDateStr}</td>
      <td style="width: 130px;" class="info-label">Status Data:</td>
      <td class="info-value"><span class="badge-clean">Mulai Dari Nol (Data Bersih)</span></td>
    </tr>
    <tr>
      <td class="info-label">Unit Usaha:</td>
      <td class="info-value">Cemiloo Snack & Kasir POS</td>
      <td class="info-label">Mata Uang:</td>
      <td class="info-value">IDR (Rupiah Indonesia)</td>
      <td class="info-label">Dokumen ID:</td>
      <td class="info-value" style="font-family: monospace; color: #64748b;">CML-${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}</td>
    </tr>
  </table>

  <br/>

  <!-- RINGKASAN EKSEKUTIF / 4 KARTU METRIK UTAMA -->
  <table style="width: 100%; border-collapse: separate; border-spacing: 8px;">
    <tr>
      <td style="width: 25%; border: 2px solid #86efac; background-color: #f0fdf4; padding: 12px; text-align: center;">
        <span class="kpi-title" style="color: #166534;">TOTAL PEMASUKAN</span><br/>
        <span class="kpi-val-green">${formatRupiah(totalMasuk)}</span><br/>
        <span style="font-size: 8.5pt; color: #15803d;">Omset Penjualan Bersih</span>
      </td>
      <td style="width: 25%; border: 2px solid #fca5a5; background-color: #fef2f2; padding: 12px; text-align: center;">
        <span class="kpi-title" style="color: #991b1b;">TOTAL PENGELUARAN</span><br/>
        <span class="kpi-val-red">${formatRupiah(totalKeluar)}</span><br/>
        <span style="font-size: 8.5pt; color: #b91c1c;">Biaya & Belanja Bahan</span>
      </td>
      <td style="width: 25%; border: 2px solid #7dd3fc; background-color: #f0f9ff; padding: 12px; text-align: center;">
        <span class="kpi-title" style="color: #075985;">LABA BERSIH (NET)</span><br/>
        <span class="${untungBersih >= 0 ? 'kpi-val-blue' : 'kpi-val-red'}">${formatRupiah(untungBersih)}</span><br/>
        <span style="font-size: 8.5pt; color: #0369a1;">Pemasukan - Pengeluaran</span>
      </td>
      <td style="width: 25%; border: 2px solid #cbd5e1; background-color: #f8fafc; padding: 12px; text-align: center;">
        <span class="kpi-title" style="color: #334155;">TOTAL TRANSAKSI</span><br/>
        <span class="kpi-val-dark">${transactions.length} Order</span><br/>
        <span style="font-size: 8.5pt; color: #64748b;">Frekuensi Penjualan</span>
      </td>
    </tr>
  </table>

  <br/>

  <!-- TABEL 1: BUKU KASIR / PENJUALAN -->
  <div class="section-head">1. BUKU TRANSAKSI PENJUALAN (PEMASUKAN KASIR)</div>
  <table class="table-custom">
    <thead>
      <tr>
        <th class="th-blue text-center" style="width: 45px;">No</th>
        <th class="th-blue" style="width: 140px;">Waktu & Tanggal</th>
        <th class="th-blue" style="width: 120px;">No. Transaksi</th>
        <th class="th-blue">Rincian Menu / Pesanan Jajanan</th>
        <th class="th-blue text-center" style="width: 90px;">Total Qty</th>
        <th class="th-blue text-right" style="width: 150px;">Total Nominal (Rp)</th>
      </tr>
    </thead>
    <tbody>
      ${
        transactions.length === 0
          ? `
        <tr>
          <td colspan="6" style="text-align: center; padding: 14px; background-color: #f8fafc; color: #64748b; font-style: italic; border: 1px solid #cbd5e1;">
            <strong>&mdash; Data Transaksi Kosong (Memulai Pembukuan Baru Dari Nol) &mdash;</strong><br/>
            <span style="font-size: 9pt;">Gunakan form di bawah ini sebagai template catatan saat ada pesanan masuk.</span>
          </td>
        </tr>
        ${emptyTxRows}
        `
          : transactions
              .map((t, idx) => {
                const itemsSummary = t.items
                  ? t.items
                      .map((it) => `${it.product?.name || 'Produk'} (${it.jumlah}x) ${it.catatan ? `[${it.catatan}]` : ''}`)
                      .join('; ')
                  : t.keterangan || 'Penjualan Kasir';
                const totalQty = t.items?.reduce((s, it) => s + it.jumlah, 0) || 0;

                return `
                <tr class="${idx % 2 === 0 ? 'tr-even' : 'tr-odd'}">
                  <td class="text-center">${idx + 1}</td>
                  <td>${formatTanggalLengkap(t.tanggal)}</td>
                  <td style="font-family: monospace;">#${t.id.slice(0, 8)}</td>
                  <td>${itemsSummary}</td>
                  <td class="text-center"><strong>${totalQty} pcs</strong></td>
                  <td class="text-right" style="font-weight: bold; color: #15803d;">${formatRupiah(t.total_nominal)}</td>
                </tr>
              `;
              })
              .join('')
      }
      <tr class="tr-total">
        <td colspan="5" class="text-right" style="padding: 10px; font-size: 11pt;">TOTAL PEMASUKAN PENJUALAN:</td>
        <td class="text-right" style="padding: 10px; font-size: 12pt; color: #15803d;">${formatRupiah(totalMasuk)}</td>
      </tr>
    </tbody>
  </table>

  <br/><br/>

  <!-- TABEL 2: BUKU PENGELUARAN -->
  <div class="section-head">2. BUKU CATATAN PENGELUARAN OPERASIONAL & BAHAN BAKU</div>
  <table class="table-custom">
    <thead>
      <tr>
        <th class="th-red text-center" style="width: 45px;">No</th>
        <th class="th-red" style="width: 140px;">Tanggal</th>
        <th class="th-red" style="width: 180px;">Kategori Biaya</th>
        <th class="th-red">Keterangan / Rincian Belanja</th>
        <th class="th-red text-right" style="width: 150px;">Nominal Biaya (Rp)</th>
      </tr>
    </thead>
    <tbody>
      ${
        expenses.length === 0
          ? `
        <tr>
          <td colspan="5" style="text-align: center; padding: 14px; background-color: #f8fafc; color: #64748b; font-style: italic; border: 1px solid #cbd5e1;">
            <strong>&mdash; Data Pengeluaran Kosong (Saldo Pengeluaran: Rp 0) &mdash;</strong><br/>
            <span style="font-size: 9pt;">Gunakan form di bawah ini sebagai template saat mencatat pengeluaran usaha.</span>
          </td>
        </tr>
        ${emptyExpRows}
        `
          : expenses
              .map((e, idx) => `
                <tr class="${idx % 2 === 0 ? 'tr-even' : 'tr-odd'}">
                  <td class="text-center">${idx + 1}</td>
                  <td>${formatTanggal(e.tanggal)}</td>
                  <td><strong>${e.category?.name || 'Biaya Operasional'}</strong></td>
                  <td>${e.keterangan || '-'}</td>
                  <td class="text-right" style="font-weight: bold; color: #dc2626;">-${formatRupiah(e.nominal)}</td>
                </tr>
              `)
              .join('')
      }
      <tr class="tr-total">
        <td colspan="4" class="text-right" style="padding: 10px; font-size: 11pt;">TOTAL PENGELUARAN OPERASIONAL:</td>
        <td class="text-right" style="padding: 10px; font-size: 12pt; color: #dc2626;">-${formatRupiah(totalKeluar)}</td>
      </tr>
    </tbody>
  </table>

  <br/><br/>

  <!-- TABEL 3: KATALOG PRODUK, HARGA MODAL, HARGA JUAL & MARGIN CEMILOO -->
  <div class="section-head">3. KATALOG MASTER PRODUK, HARGA & ESTIMASI MARGIN CEMILOO</div>
  <p style="font-size: 9.5pt; color: #64748b; margin-top: 0; margin-bottom: 6px;">
    Seluruh stok produk dimulai dari 0 (kosong) dan siap diperbarui sesuai inventaris fisik.
  </p>
  <table class="table-custom">
    <thead>
      <tr>
        <th class="th-indigo text-center" style="width: 45px;">No</th>
        <th class="th-indigo">Nama Menu Jajanan</th>
        <th class="th-indigo" style="width: 140px;">Kategori</th>
        <th class="th-indigo text-right" style="width: 120px;">Harga Modal (Rp)</th>
        <th class="th-indigo text-right" style="width: 120px;">Harga Jual (Rp)</th>
        <th class="th-indigo text-right" style="width: 120px;">Margin Keuntungan (Rp)</th>
        <th class="th-indigo text-center" style="width: 90px;">Margin (%)</th>
        <th class="th-indigo text-center" style="width: 80px;">Sisa Stok</th>
      </tr>
    </thead>
    <tbody>
      ${margins
        .map(
          (m, idx) => `
          <tr class="${idx % 2 === 0 ? 'tr-even' : 'tr-odd'}">
            <td class="text-center">${idx + 1}</td>
            <td><strong>${m.name}</strong></td>
            <td>${m.category_name}</td>
            <td class="text-right">${formatRupiah(m.harga_modal)}</td>
            <td class="text-right" style="font-weight: bold;">${formatRupiah(m.harga_jual)}</td>
            <td class="text-right" style="color: #15803d; font-weight: bold;">+${formatRupiah(m.margin_nominal)}</td>
            <td class="text-center" style="font-weight: bold; background-color: #f0fdf4;">${m.margin_percentage}%</td>
            <td class="text-center" style="font-weight: bold; color: ${m.stok === 0 ? '#64748b' : '#0369a1'};">${m.stok}</td>
          </tr>
        `
        )
        .join('')}
    </tbody>
  </table>

  <br/><br/>

  <!-- LEMBAR OTORISASI / TANDA TANGAN -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
    <tr>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 12px;">
        <span style="font-size: 10pt; color: #475569;">Dibuat / Dicatat Oleh:</span><br/><br/><br/><br/>
        <p style="font-weight: bold; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 4px; min-width: 180px;">
          Kasir / Bagian Keuangan
        </p>
      </td>
      <td style="width: 50%; text-align: center; vertical-align: top; padding: 12px;">
        <span style="font-size: 10pt; color: #475569;">Disetujui / Diverifikasi Oleh:</span><br/><br/><br/><br/>
        <p style="font-weight: bold; border-top: 1px solid #94a3b8; display: inline-block; padding-top: 4px; min-width: 180px;">
          Pemilik Usaha Cemiloo
        </p>
      </td>
    </tr>
  </table>

  <br/>
  <p style="font-size: 8.5pt; color: #94a3b8; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 8px;">
    Laporan dicetak otomatis oleh Aplikasi Kasir POS & Keuangan Cemiloo &bull; Dimulai Dari Nol (Clean State) &bull; Hak Cipta &copy; ${new Date().getFullYear()} Cemiloo
  </p>

</body>
</html>
`;

  // Download trigger as .xls file
  const blob = new Blob(['\uFEFF' + excelHTML], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Laporan_Keuangan_Cemiloo_${startDate}_sd_${endDate}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Function to export clean blank template ready for filling
export function exportEmptyTemplateExcel(margins: ProductMargin[]) {
  const todayStr = new Date().toISOString().slice(0, 10);
  exportBeautifulExcelReport({
    title: 'Template Formulir Laporan Keuangan Cemiloo (Mulai Dari Nol)',
    startDate: todayStr,
    endDate: todayStr,
    totalMasuk: 0,
    totalKeluar: 0,
    untungBersih: 0,
    transactions: [],
    expenses: [],
    margins: margins.map((m) => ({ ...m, stok: 0 })),
  });
}
