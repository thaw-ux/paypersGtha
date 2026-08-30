import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Thai Baht currency (e.g. 1,234.50 ฿)
 */
export function formatCurrency(amount: number | string | null | undefined, includeSymbol: boolean = true): string {
  const num = typeof amount === "string" ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return includeSymbol ? "0.00 ฿" : "0.00";
  
  const formatted = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return includeSymbol ? `${formatted} ฿` : formatted;
}

/**
 * Format date to Thai readable format (e.g. 30 ส.ค. 2026 or 30 ส.ค. 2569)
 */
export function formatThaiDate(dateStr: string | null | undefined, includeYearBE: boolean = false): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const monthsThai = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    const day = date.getDate();
    const month = monthsThai[date.getMonth()];
    const year = date.getFullYear() + (includeYearBE ? 543 : 0);

    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate standard Transaction ID
 */
export function generateTransactionId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${dateStr}-${randomStr}`;
}

/**
 * Sanitize filename for Google Drive storage
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim();
}
