// ----------------------------------------------------------------------
// Price & Currency Formatters
// ----------------------------------------------------------------------

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a number as USD.
 * @example formatPrice(84.2) // "$84.20"
 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return USD_FORMATTER.format(value);
}

/**
 * Formats a price delta (change) and adds an explicit +/- sign.
 * @example formatPriceDelta(1.2) // "+$1.20"
 * @example formatPriceDelta(-0.5) // "-$0.50"
 */
export function formatPriceDelta(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  const formatted = USD_FORMATTER.format(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

// ----------------------------------------------------------------------
// Number & Percentage Formatters
// ----------------------------------------------------------------------

const PERCENT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/**
 * Formats a decimal as a percentage.
 * @example formatPercent(0.021) // "2.1%"
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return PERCENT_FORMATTER.format(value);
}

/**
 * Formats large numbers with commas.
 * @example formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

// ----------------------------------------------------------------------
// Oil Industry Specific Formatters
// ----------------------------------------------------------------------

/**
 * Formats production/demand figures in million barrels per day (mb/d).
 * @example formatMbd(10.2) // "10.2 mb/d"
 */
export function formatMbd(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} mb/d`;
}

/**
 * Formats reserves in billions of barrels (Gbbl).
 * @example formatReserves(267.1) // "267.1 Gbbl"
 */
export function formatReserves(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '—';
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)} Gbbl`;
}

// ----------------------------------------------------------------------
// Date & Time Formatters
// ----------------------------------------------------------------------

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Formats a date string or Date object into a readable short date.
 * @example formatDate("2024-03-24") // "Mar 24, 2024"
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return DATE_FORMATTER.format(date);
  } catch (error) {
    return '—';
  }
}

/**
 * Formats a timestamp into a 12-hour time format.
 * Useful for the "Last updated: X:XX PM" footer on metric cards.
 * @example formatTime("2024-03-24T14:30:00Z") // "2:30 PM"
 */
export function formatTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (error) {
    return '—';
  }
}