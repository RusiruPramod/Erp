import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a number as Sri Lankan Rupee: LKR 30,000.00
 */
export function formatLKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'LKR 0.00';
  }
  const parts = Number(amount).toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `LKR ${intPart}.${parts[1]}`;
}

/**
 * Format a date string or Date object to standard: 15 Oct 2026
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return '-';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '-';
  }
}

/**
 * Format date for HTML date input: YYYY-MM-DD
 */
export function formatDateInput(date: string | Date | null | undefined): string {
  if (!date) return format(new Date(), 'yyyy-MM-dd');
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(d)) return format(new Date(), 'yyyy-MM-dd');
    return format(d, 'yyyy-MM-dd');
  } catch {
    return format(new Date(), 'yyyy-MM-dd');
  }
}

/**
 * Format percentage: 25.5%
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0%';
  }
  return `${Number(value).toFixed(1)}%`;
}
