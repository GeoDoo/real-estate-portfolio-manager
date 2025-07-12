import { describe, it, expect } from "@jest/globals";
import { hasValidValuation } from "./validation";

describe("hasValidValuation", () => {
  it("returns true for all required positive, optional zero/blank", () => {
    expect(
      hasValidValuation({
        initial_investment: 100,
        annual_rental_income: 100,
        maintenance: 100,
        property_tax: 100,
        management_fees: 100,
        transaction_costs: 100,
        annual_rent_growth: 100,
        discount_rate: 100,
        holding_period: 100,
        service_charge: 0,
        ground_rent: undefined,
        insurance: null,
      }),
    ).toBe(true);
  });

  it("returns false if any optional field is negative", () => {
    expect(
      hasValidValuation({
        initial_investment: 100,
        annual_rental_income: 100,
        maintenance: 100,
        property_tax: 100,
        management_fees: 100,
        transaction_costs: 100,
        annual_rent_growth: 100,
        discount_rate: 100,
        holding_period: 100,
        service_charge: -1,
        ground_rent: 0,
        insurance: 0,
      }),
    ).toBe(false);
  });

  it("returns false if any required field is zero or missing", () => {
    expect(
      hasValidValuation({
        initial_investment: 100,
        annual_rental_income: 0, // invalid
        maintenance: 100,
        property_tax: 100,
        management_fees: 100,
        transaction_costs: 100,
        annual_rent_growth: 100,
        discount_rate: 100,
        holding_period: 100,
        service_charge: 0,
        ground_rent: 0,
        insurance: 0,
      }),
    ).toBe(false);

    expect(
      hasValidValuation({
        initial_investment: 100,
        // annual_rental_income missing
        maintenance: 100,
        property_tax: 100,
        management_fees: 100,
        transaction_costs: 100,
        annual_rent_growth: 100,
        discount_rate: 100,
        holding_period: 100,
        service_charge: 0,
        ground_rent: 0,
        insurance: 0,
      }),
    ).toBe(false);
  });

  it("returns true for all valid fields", () => {
    expect(
      hasValidValuation({
        initial_investment: 100,
        annual_rental_income: 100,
        maintenance: 100,
        property_tax: 100,
        management_fees: 100,
        transaction_costs: 100,
        annual_rent_growth: 100,
        discount_rate: 100,
        holding_period: 100,
        service_charge: 10,
        ground_rent: 0,
        insurance: 5,
      }),
    ).toBe(true);
  });

  it("returns false for null, undefined, or empty object", () => {
    expect(hasValidValuation(null)).toBe(false);
    expect(hasValidValuation(undefined)).toBe(false);
    expect(hasValidValuation({})).toBe(false);
  });
});
