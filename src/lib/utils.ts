import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format angka menjadi format ribuan bertitik Indonesia (misal: 20000 -> "20.000").
 * Jika 0 atau kosong, menghasilkan string kosong "" agar input form bersih dan 0 bisa dihapus.
 */
export function formatRupiahInput(val: number | string | undefined | null): string {
  if (val === '' || val === undefined || val === null || val === 0 || val === '0') {
    return '';
  }
  const digits = String(val).replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

/**
 * Mengubah string bertitik kembali menjadi number murni (misal: "20.000" -> 20000).
 */
export function parseRupiahInput(val: string): number {
  if (!val) return 0;
  const digits = val.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

export function formatTanggal(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatTanggalLengkap(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

export function formatJam(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return '';
  }
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
