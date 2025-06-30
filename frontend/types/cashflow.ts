import { ValuationBase } from "./valuation";

export interface DCFRow extends ValuationBase {
  id: string;
  created_at: string;
  initial_investment: number;
  annual_rental_income: number;
  vacancy_rate?: number;
  service_charge: number;
  ground_rent: number;
  maintenance: number;
  property_tax: number;
  insurance: number;
  management_fees: number;
  transaction_costs: number;
  annual_rent_growth: number;
  discount_rate: number;
  holding_period: number;
  ltv?: number;
  interest_rate?: number;
  capex?: number;
}

export interface CashFlowRow {
  year: number;
  gross_rent: number;
  vacancy_loss: number;
  effective_rent: number;
  operating_expenses: number;
  noi: number;
  capex: number;
  net_cash_flow: number;
  discount_factor: number;
  present_value: number;
  cumulative_pv: number;
}
