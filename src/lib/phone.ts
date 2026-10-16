/**
 * Normalizes Sri Lankan and international phone numbers into E.164 digits-only format
 * Examples:
 *   "0772078626" -> "94772078626"
 *   "+94 77 207 8626" -> "94772078626"
 *   "0755437148" -> "94755437148"
 *   "94772078626" -> "94772078626"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  // Remove spaces, hyphens, parentheses, plus signs
  let clean = phone.replace(/[\s\-\(\)\+]/g, '');

  // Sri Lanka local format starting with 0 (e.g. 077XXXXXXX)
  if (clean.startsWith('0') && clean.length === 10) {
    clean = '94' + clean.slice(1);
  } else if (!clean.startsWith('94') && clean.length === 9) {
    // 77XXXXXXX missing leading zero
    clean = '94' + clean;
  }

  return clean;
}

/**
 * Format normalized phone for display: "+94 77 207 8626"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '-';
  const clean = normalizePhone(phone);
  if (clean.startsWith('94') && clean.length === 11) {
    return `+94 ${clean.slice(2, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return `+${clean}`;
}
