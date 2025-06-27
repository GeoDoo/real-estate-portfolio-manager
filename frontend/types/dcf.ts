export interface DCFInput {
  initial_investment: number;
  annual_rental_income: number;
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
}

export interface Property {
  id: string;
  address: string;
  created_at: string;
  listing_link?: string;
}

export interface PropertyValuation {
  property_id: string;
  initial_investment: number;
  annual_rental_income: number;
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
}

export interface DCFRow {
  id: string;
  created_at: string;
  initial_investment: number;
  annual_rental_income: number;
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
}

export interface CashFlowRow {
  year: number;
  revenue: number;
  totalExpenses: number;
  netCashFlow: number;
  presentValue: number;
  cumulativePV: number;
} 