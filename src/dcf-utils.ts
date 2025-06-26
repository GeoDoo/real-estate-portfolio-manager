import { DCFInput, CashFlowRow } from './types/dcf';

export function calculateCashFlows(input: DCFInput): CashFlowRow[] {
  const {
    initial_investment,
    annual_rental_income,
    service_charge,
    ground_rent,
    maintenance,
    property_tax,
    insurance,
    management_fees, // percent
    one_time_expenses,
    cash_flow_growth_rate,
    discount_rate,
    holding_period,
  } = input;

  const rows: CashFlowRow[] = [];
  let cumulativePV = 0;

  // Year 0: Initial investment (negative revenue) and one-time expenses
  const year0Revenue = -initial_investment;
  const year0Expenses = one_time_expenses + property_tax; // Property tax is one-time
  const year0NetCashFlow = year0Revenue - year0Expenses;
  const year0PV = year0NetCashFlow; // No discounting for year 0
  cumulativePV += year0PV;
  rows.push({
    year: 0,
    revenue: year0Revenue,
    totalExpenses: year0Expenses,
    netCashFlow: year0NetCashFlow,
    presentValue: year0PV,
    cumulativePV,
  });

  let revenue = annual_rental_income;
  for (let year = 1; year <= holding_period; year++) {
    // Grow revenue from year 1 onwards
    if (year > 1) {
      revenue = revenue * (1 + cash_flow_growth_rate / 100);
    }
    
    // Calculate expenses (property tax is NOT included in annual expenses)
    const managementFee = revenue * (management_fees / 100);
    const totalExpenses =
      service_charge +
      ground_rent +
      maintenance +
      insurance +
      managementFee;
    
    const netCashFlow = revenue - totalExpenses;
    
    // Discount to present value
    const presentValue = netCashFlow / Math.pow(1 + discount_rate / 100, year);
    cumulativePV += presentValue;
    
    rows.push({
      year,
      revenue,
      totalExpenses,
      netCashFlow,
      presentValue,
      cumulativePV,
    });
  }
  return rows;
} 