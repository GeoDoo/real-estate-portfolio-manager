// Shared utility functions for consistent styling and formatting

export function getNumberColor(n: number): string {
  if (n > 0) return "var(--success)";
  if (n < 0) return "var(--error)";
  return "var(--text-muted)";
}

export function formatCurrency(amount: number, currency = "£"): string {
  return `${currency}${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
