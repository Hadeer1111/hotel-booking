import { describe, it, expect } from 'vitest';
import { formatCurrency, nightsBetween, toIsoDate } from './format';

describe('format', () => {
  it('formatCurrency formats USD with two decimals', () => {
    expect(formatCurrency(1234.5)).toBe('$1,234.50');
    expect(formatCurrency('500')).toBe('$500.00');
    expect(formatCurrency(Number.NaN)).toBe('$0.00');
  });

  it('formatCurrency supports other currencies', () => {
    expect(formatCurrency(10, 'EUR')).toContain('10');
  });

  it('nightsBetween counts whole nights and clamps to 0', () => {
    const a = new Date('2030-01-10T00:00:00Z');
    const b = new Date('2030-01-12T00:00:00Z');
    expect(nightsBetween(a, b)).toBe(2);
    expect(nightsBetween(b, a)).toBe(0);
    expect(nightsBetween(a, a)).toBe(0);
  });

  it('nightsBetween returns 0 for invalid dates instead of NaN', () => {
    // Reproduces the bug where an in-progress range (no checkOut yet) used
    // to render `NaN` into the Stay tile on the hotel detail page.
    expect(nightsBetween(new Date(''), new Date('2030-01-12'))).toBe(0);
    expect(nightsBetween(new Date('2030-01-10'), new Date(''))).toBe(0);
    expect(nightsBetween(new Date(''), new Date(''))).toBe(0);
  });

  it('toIsoDate formats a date as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2030, 0, 5))).toBe('2030-01-05');
    expect(toIsoDate(new Date(2030, 11, 31))).toBe('2030-12-31');
  });
});
