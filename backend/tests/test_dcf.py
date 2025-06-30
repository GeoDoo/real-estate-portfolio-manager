import pytest
from app import calculate_cash_flows, calculate_irr
import numpy as np
import math

def test_all_years_present_value():
    input_data = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    cash_flows = calculate_cash_flows(input_data)
    # Only check that present_value is present and is a float for each year
    for i, row in enumerate(cash_flows):
        assert isinstance(row["present_value"], float)
        assert isinstance(row["cumulative_pv"], float)

def test_irr_known_case():
    cash_flows = [-1000, 500, 500, 500]
    irr = calculate_irr(cash_flows)
    assert irr is not None, "IRR calculation failed"
    assert abs(irr - 0.2345) < 0.001, f"IRR: {irr}, expected: 0.2345"

def test_irr_with_dcf_cashflows():
    input_data = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    cash_flows_data = calculate_cash_flows(input_data)
    net_cash_flows = [cf["net_cash_flow"] for cf in cash_flows_data]
    irr = calculate_irr(net_cash_flows)
    assert irr is not None, "IRR calculation failed for DCF cash flows"
    assert irr > 0, f"IRR should be positive for profitable investment, got: {irr}"
    assert 0 < irr < 0.5, f"IRR should be between 0% and 50%, got: {irr}"

def run_mc_sim(
    base_input,
    rent_growth_mean,
    rent_growth_std,
    discount_mean,
    discount_std,
    num_sim=1000,
):
    npvs = []
    for _ in range(num_sim):
        rent_growth = np.random.normal(rent_growth_mean, rent_growth_std)
        discount_rate = np.random.normal(discount_mean, discount_std)
        sim_input = base_input.copy()
        sim_input["annual_rent_growth"] = rent_growth
        sim_input["discount_rate"] = discount_rate
        cash_flows = calculate_cash_flows(sim_input)
        npv = cash_flows[-1]["cumulative_pv"]
        npvs.append(npv)
    return npvs

def test_mc_sim_deterministic_matches_dcf():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    dcf = calculate_cash_flows(base_input)
    dcf_npv = dcf[-1]["cumulative_pv"]
    npvs = run_mc_sim(base_input, 2, 0, 15, 0, num_sim=100)
    assert all(abs(n - dcf_npv) < 1e-6 for n in npvs)
    assert abs(np.mean(npvs) - dcf_npv) < 1e-6

def test_mc_sim_spread_increases_with_stddev():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    npvs_low = run_mc_sim(base_input, 2, 0.01, 15, 0.01, num_sim=1000)
    npvs_high = run_mc_sim(base_input, 2, 0.10, 15, 0.10, num_sim=1000)
    assert np.std(npvs_high) > np.std(npvs_low)
    assert abs(np.mean(npvs_low) - np.mean(npvs_high)) < 10000

def test_mc_sim_no_nan_inf():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, 2, 0.10, 15, 0.10, num_sim=1000)
    assert all(np.isfinite(n) for n in npvs)

def test_mc_sim_negative_rent_growth():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": -2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, -2, 0, 15, 0, num_sim=100)
    assert all(n < 0 for n in npvs)

def test_mc_sim_negative_discount_rate():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": -5,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, 2, 0, -5, 0, num_sim=100)
    assert all(np.isfinite(n) for n in npvs)
    assert all(n > 0 for n in npvs)

def test_mc_sim_zero_discount_rate():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 0,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, 2, 0, 0, 0, num_sim=100)
    assert all(np.isfinite(n) for n in npvs)
    assert all(n > 0 for n in npvs)

def test_mc_sim_high_discount_rate():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 100,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, 2, 0, 100, 0, num_sim=100)
    assert all(np.isfinite(n) for n in npvs)
    assert all(n < 0 for n in npvs)

def test_mc_sim_zero_holding_period():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 0,
    }
    npvs = run_mc_sim(base_input, 2, 0, 15, 0, num_sim=10)
    assert all(np.isfinite(n) for n in npvs)
    assert all(abs(n + 209000) < 1e-2 for n in npvs)

def test_mc_sim_all_zero_cash_flows():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 0,
        "service_charge": 0,
        "ground_rent": 0,
        "maintenance": 0,
        "property_tax": 0,
        "insurance": 0,
        "management_fees": 0,
        "transaction_costs": 0,
        "annual_rent_growth": 0,
        "discount_rate": 15,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, 0, 0, 15, 0, num_sim=10)
    assert all(np.isfinite(n) for n in npvs)
    assert all(abs(n + 200000) < 1e-2 for n in npvs)

def test_mc_sim_extreme_stddev():
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    npvs = run_mc_sim(base_input, 2, 100, 15, 100, num_sim=1000)
    assert all(np.isfinite(n) for n in npvs)

def test_cash_flows_with_mortgage():
    input_data = {
        "initial_investment": 100000,
        "annual_rental_income": 12000,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 600,
        "insurance": 300,
        "management_fees": 10,
        "transaction_costs": 2000,
        "annual_rent_growth": 0,
        "discount_rate": 5,
        "holding_period": 5,
        "ltv": 80,  # 80% LTV
        "interest_rate": 6,  # 6% interest
    }
    cash_flows = calculate_cash_flows(input_data)
    year1 = cash_flows[1]
    assert isinstance(year1["operating_expenses"], float)
    assert year1["operating_expenses"] > 0

def test_cash_flows_with_vacancy_rate():
    """Test that vacancy rate correctly reduces effective revenue."""
    input_data = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "vacancy_rate": 5,  # 5% vacancy
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    cash_flows = calculate_cash_flows(input_data)
    
    # Check first year
    first_year = cash_flows[1]  # Year 1 (index 1)
    expected_gross_revenue = 20000 * (1 + 2/100) ** 0  # No growth in year 1
    expected_effective_revenue = expected_gross_revenue * (1 - 5/100)  # 5% vacancy
    
    assert abs(first_year["gross_rent"] - expected_gross_revenue) < 0.01
    assert abs(first_year["effective_rent"] - expected_effective_revenue) < 0.01
    
    # Check that effective revenue is used for net cash flow calculation
    # Net cash flow should be based on effective revenue, not gross
    assert first_year["net_cash_flow"] == first_year["effective_rent"] - first_year["operating_expenses"]

def test_cash_flows_with_zero_vacancy_rate():
    """Test that zero vacancy rate means gross = effective revenue."""
    input_data = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "vacancy_rate": 0,  # 0% vacancy
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    cash_flows = calculate_cash_flows(input_data)
    
    # Check first year
    first_year = cash_flows[1]  # Year 1 (index 1)
    expected_revenue = 20000 * (1 + 2/100) ** 0  # No growth in year 1
    
    assert abs(first_year["gross_rent"] - expected_revenue) < 0.01
    assert abs(first_year["effective_rent"] - expected_revenue) < 0.01
    assert first_year["gross_rent"] == first_year["effective_rent"]

def test_cash_flows_with_high_vacancy_rate():
    """Test that high vacancy rate significantly reduces effective revenue."""
    input_data = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "vacancy_rate": 20,  # 20% vacancy
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    cash_flows = calculate_cash_flows(input_data)
    
    # Check first year
    first_year = cash_flows[1]  # Year 1 (index 1)
    expected_gross_revenue = 20000 * (1 + 2/100) ** 0  # No growth in year 1
    expected_effective_revenue = expected_gross_revenue * (1 - 20/100)  # 20% vacancy
    
    assert abs(first_year["gross_rent"] - expected_gross_revenue) < 0.01
    assert abs(first_year["effective_rent"] - expected_effective_revenue) < 0.01
    assert first_year["effective_rent"] == expected_gross_revenue * 0.8

def test_vacancy_rate_with_growth():
    """Test that vacancy rate is applied after growth rate."""
    input_data = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "vacancy_rate": 10,  # 10% vacancy
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 5,  # 5% growth
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    cash_flows = calculate_cash_flows(input_data)
    
    # Check year 2 (growth should apply)
    year_2 = cash_flows[2]  # Year 2 (index 2)
    expected_gross_revenue = 20000 * (1 + 5/100) ** 1  # 5% growth in year 2
    expected_effective_revenue = expected_gross_revenue * (1 - 10/100)  # 10% vacancy
    
    assert abs(year_2["gross_rent"] - expected_gross_revenue) < 0.01
    assert abs(year_2["effective_rent"] - expected_effective_revenue) < 0.01

def test_vacancy_rate_npv_impact():
    """Test that vacancy rate significantly impacts NPV."""
    # Test with no vacancy
    input_data_no_vacancy = {
        "initial_investment": 200000,
        "annual_rental_income": 20000,
        "vacancy_rate": 0,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    # Test with 10% vacancy
    input_data_with_vacancy = input_data_no_vacancy.copy()
    input_data_with_vacancy["vacancy_rate"] = 10
    
    cash_flows_no_vacancy = calculate_cash_flows(input_data_no_vacancy)
    cash_flows_with_vacancy = calculate_cash_flows(input_data_with_vacancy)
    
    npv_no_vacancy = cash_flows_no_vacancy[-1]["cumulative_pv"]
    npv_with_vacancy = cash_flows_with_vacancy[-1]["cumulative_pv"]
    
    # NPV should be lower with vacancy
    assert npv_with_vacancy < npv_no_vacancy
    # The difference should be significant
    assert (npv_no_vacancy - npv_with_vacancy) > 10000 

def test_mc_sim_with_vacancy_rate():
    """Test that Monte Carlo simulation correctly handles vacancy rate."""
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "vacancy_rate": 10,  # 10% vacancy
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    # Test deterministic case (no randomness)
    npvs = run_mc_sim(base_input, 2, 0, 15, 0, num_sim=100)
    
    # All NPVs should be the same in deterministic case
    assert all(abs(n - npvs[0]) < 1e-6 for n in npvs)
    
    # NPV should be lower than without vacancy
    base_input_no_vacancy = base_input.copy()
    base_input_no_vacancy["vacancy_rate"] = 0
    npvs_no_vacancy = run_mc_sim(base_input_no_vacancy, 2, 0, 15, 0, num_sim=100)
    
    assert npvs[0] < npvs_no_vacancy[0]
    assert (npvs_no_vacancy[0] - npvs[0]) > 5000  # Significant difference

def test_mc_sim_vacancy_rate_consistency():
    """Test that Monte Carlo simulation is consistent with regular DCF when using same parameters."""
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "vacancy_rate": 5,  # 5% vacancy
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    
    # Regular DCF calculation
    dcf = calculate_cash_flows(base_input)
    dcf_npv = dcf[-1]["cumulative_pv"]
    
    # Monte Carlo with deterministic parameters
    npvs = run_mc_sim(base_input, 2, 0, 15, 0, num_sim=100)
    
    # Should match exactly
    assert abs(np.mean(npvs) - dcf_npv) < 1e-6 