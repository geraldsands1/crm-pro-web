import type { DateRange, DateRangePreset } from '../types';

/** Format a Date as a local YYYY-MM-DD (no timezone shift). */
export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Resolve a preset to a concrete inclusive range, based on today's local date.
 * `custom` has no intrinsic range, so it returns the current month as a
 * starting point the user then edits.
 *
 * Weeks start on Monday. Every range ends at today (never the future).
 */
export function presetRange(
  preset: DateRangePreset,
  today: Date = new Date(),
): DateRange {
  const to = toYmd(today);

  switch (preset) {
    case 'today':
      return { from: to, to };

    case 'this-week': {
      const d = new Date(today);
      // getDay(): 0=Sun..6=Sat. Shift so Monday is the start.
      const dow = (d.getDay() + 6) % 7;
      d.setDate(d.getDate() - dow);
      return { from: toYmd(d), to };
    }

    case 'this-month': {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toYmd(d), to };
    }

    case 'this-year': {
      const d = new Date(today.getFullYear(), 0, 1);
      return { from: toYmd(d), to };
    }

    case 'last-12-months': {
      // First day of the month 11 months ago → today = 12 monthly buckets.
      const d = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      return { from: toYmd(d), to };
    }

    case 'custom':
    default: {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toYmd(d), to };
    }
  }
}

/** The default preset the dashboard opens with. */
export const DEFAULT_PRESET: DateRangePreset = 'this-month';
