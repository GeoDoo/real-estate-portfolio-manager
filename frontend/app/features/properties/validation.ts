import type { DCFRow } from "@/types/cashflow";

function isIndexable(obj: unknown): obj is Record<string, number | undefined | null> {
  return typeof obj === 'object' && obj !== null;
}

export function hasValidValuation(valuation: Record<string, number | undefined | null> | DCFRow | null | undefined): boolean {
  const requiredFields = [
    'initial_investment', 'annual_rental_income', 'maintenance', 'property_tax',
    'management_fees', 'transaction_costs', 'annual_rent_growth', 'discount_rate', 'holding_period'
  ];
  const optionalFields = ['service_charge', 'ground_rent', 'insurance', 'vacancy_rate'];
  if (!valuation || !isIndexable(valuation)) return false;
  if (!requiredFields.every(f => typeof valuation[f] === 'number' && valuation[f]! > 0)) return false;
  if (!optionalFields.every(f =>
    valuation[f] === undefined || valuation[f] === null || (typeof valuation[f] === 'number' && valuation[f]! >= 0)
  )) return false;
  return true;
}

export function isValidValuationForm(form: Record<string, string> | null | undefined): boolean {
  if (!form) return false;
  // Convert all fields to numbers or undefined
  const valuation: Record<string, number | undefined> = {};
  for (const key in form) {
    const v = form[key];
    valuation[key] = v === "" ? undefined : Number(v);
  }
  return hasValidValuation(valuation);
} 