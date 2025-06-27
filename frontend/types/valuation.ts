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