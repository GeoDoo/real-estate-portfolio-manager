import Database from 'better-sqlite3'
import { DCFInput } from '@/types/dcf'
import { randomUUID } from 'crypto'

const db = new Database('dcf_calculations.db')

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS dcf_calculations (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    initial_investment REAL,
    annual_rental_income REAL,
    service_charge REAL,
    ground_rent REAL,
    maintenance REAL,
    property_tax REAL,
    insurance REAL,
    management_fees REAL,
    one_time_expenses REAL,
    cash_flow_growth_rate REAL,
    discount_rate REAL,
    holding_period INTEGER
  )
`)

export const dcfDB = {
  saveCalculation(input: DCFInput) {
    const id = randomUUID()
    const stmt = db.prepare(`
      INSERT INTO dcf_calculations (
        id, initial_investment, annual_rental_income, service_charge, ground_rent,
        maintenance, property_tax, insurance, management_fees, one_time_expenses,
        cash_flow_growth_rate, discount_rate, holding_period
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      id,
      input.initial_investment,
      input.annual_rental_income,
      input.service_charge,
      input.ground_rent,
      input.maintenance,
      input.property_tax,
      input.insurance,
      input.management_fees,
      input.one_time_expenses,
      input.cash_flow_growth_rate,
      input.discount_rate,
      input.holding_period
    )
    
    return id
  },

  getCalculations() {
    const stmt = db.prepare('SELECT * FROM dcf_calculations ORDER BY created_at DESC')
    return stmt.all()
  },

  getCalculation(id: string) {
    const stmt = db.prepare('SELECT * FROM dcf_calculations WHERE id = ?')
    return stmt.get(id)
  }
} 