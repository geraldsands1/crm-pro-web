/**
 * Display formatting, in one place.
 *
 * RC2.4E: the dashboard, the payment table, the payment summary, the
 * agent table and two dialogs had each constructed their own
 * `Intl.NumberFormat`/`toLocaleDateString` calls. Six definitions of
 * "how money looks" is six chances for them to disagree — and building an
 * Intl formatter is comparatively expensive, so these are created once at
 * module scope rather than on every render.
 */

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const decimal = new Intl.NumberFormat('en-US');

/** `$1,234.56` */
export function formatCurrency(value: number): string {
  return currency.format(Number.isFinite(value) ? value : 0);
}

/** `1,234` */
export function formatNumber(value: number): string {
  return decimal.format(Number.isFinite(value) ? value : 0);
}

/**
 * Date only, in the viewer's locale.
 *
 * Returns `fallback` for null and for an unparseable string — an
 * "Invalid Date" reaching the UI is a defect the user cannot act on,
 * whereas a dash reads as "not recorded".
 */
export function formatDate(value: string | null, fallback = '—'): string {
  if (!value) return fallback;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString();
}

/** Date and time — used where the exact moment matters, e.g. last login. */
export function formatDateTime(value: string | null, fallback = '—'): string {
  if (!value) return fallback;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleString();
}

/**
 * Renders a nullable text value, collapsing blank strings to a dash.
 *
 * The API distinguishes NULL from "", but a table cell should not: both
 * mean "nothing recorded" to a reader.
 */
export function orDash(value: string | null | undefined, fallback = '—'): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Coerces a PostgreSQL NUMERIC to a number.
 *
 * node-postgres serialises NUMERIC as a STRING rather than lose precision
 * on arbitrary-precision decimals, so a bare cast puts `"250.00"` into a
 * field typed `number` and every later arithmetic operation is silently
 * working on a string.
 */
export function parseNumeric(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
