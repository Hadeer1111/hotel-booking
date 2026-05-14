export function formatCurrency(amount: number | string, currency = 'USD'): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
    Number.isFinite(n) ? n : 0,
  );
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(d);
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  // Guard against invalid inputs (e.g. `new Date('')` → NaN time) so callers
  // can compute eagerly while a range is being assembled without rendering
  // NaN into the DOM.
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}
