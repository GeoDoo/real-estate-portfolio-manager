export interface ValuationBase {
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
  ltv?: number;
  interest_rate?: number;
}

export interface PropertyValuation extends ValuationBase {
  property_id: string;
}
