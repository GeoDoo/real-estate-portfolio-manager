import { describe, it, expect } from '@jest/globals';
import { getNumberColor, formatCurrency, formatPercentage } from './utils';

describe('getNumberColor', () => {
  it('returns success color for positive numbers', () => {
    expect(getNumberColor(1)).toBe('var(--success)');
    expect(getNumberColor(100)).toBe('var(--success)');
  });
  it('returns error color for negative numbers', () => {
    expect(getNumberColor(-1)).toBe('var(--error)');
    expect(getNumberColor(-100)).toBe('var(--error)');
  });
  it('returns muted color for zero', () => {
    expect(getNumberColor(0)).toBe('var(--text-muted)');
  });
});

describe('formatCurrency', () => {
  it('formats positive numbers with default £', () => {
    expect(formatCurrency(1234.56)).toBe('£1,234.56');
    expect(formatCurrency(1000000)).toBe('£1,000,000');
  });
  it('formats negative numbers', () => {
    expect(formatCurrency(-1234.56)).toBe('£-1,234.56');
  });
  it('formats with custom currency symbol', () => {
    expect(formatCurrency(1234.56, '€')).toBe('€1,234.56');
    expect(formatCurrency(1234.56, '£')).toBe('£1,234.56');
  });
  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('£0');
  });
});

describe('formatPercentage', () => {
  it('formats decimals as percentages', () => {
    expect(formatPercentage(0.1234)).toBe('12.34%');
    expect(formatPercentage(1)).toBe('100.00%');
    expect(formatPercentage(0)).toBe('0.00%');
  });
  it('formats negative values', () => {
    expect(formatPercentage(-0.5)).toBe('-50.00%');
  });
}); 