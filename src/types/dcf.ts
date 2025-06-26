export interface DCFInput {
  initial_investment: number
  annual_rental_income: number
  service_charge: number
  ground_rent: number
  maintenance: number
  property_tax: number
  insurance: number
  management_fees: number
  one_time_expenses: number
  cash_flow_growth_rate: number
  discount_rate: number
  holding_period: number
}

export interface DCFRow extends DCFInput {
  id: string
  created_at: string
}

export interface CashFlowRow {
  year: number
  revenue: number
  totalExpenses: number
  netCashFlow: number
  presentValue: number
  cumulativePV: number
} 