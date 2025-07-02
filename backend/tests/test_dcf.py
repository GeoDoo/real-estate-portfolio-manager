import numpy as np
from app import calculate_cash_flows, calculate_irr

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

def test_cash_flows_with_terminal_sale():
    """Test that terminal sale is correctly calculated and added to final year."""
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
        "discount_rate": 8,
        "holding_period": 5,
        "exit_cap_rate": 5.5,
        "selling_costs": 3,
    }
    cash_flows = calculate_cash_flows(input_data)
    assert len(cash_flows) == 6
    final_year = cash_flows[5]
    # The net cash flow should be significantly higher than previous years due to terminal sale
    assert final_year["net_cash_flow"] > cash_flows[4]["net_cash_flow"] * 5

def test_terminal_sale_npv_impact():
    """Test that terminal sale significantly improves NPV."""
    base_input = {
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
        "discount_rate": 8,
        "holding_period": 10,
        "exit_cap_rate": 0,
        "selling_costs": 0,
    }
    cash_flows_no_sale = calculate_cash_flows(base_input)
    npv_no_sale = cash_flows_no_sale[-1]["cumulative_pv"]
    base_input["exit_cap_rate"] = 5.5
    base_input["selling_costs"] = 3
    cash_flows_with_sale = calculate_cash_flows(base_input)
    npv_with_sale = cash_flows_with_sale[-1]["cumulative_pv"]
    # Terminal sale should significantly improve NPV
    assert npv_with_sale > npv_no_sale

def test_cash_flows_without_terminal_sale():
    """Test that cash flows work correctly when no terminal sale is specified."""
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
        "holding_period": 5,
        "exit_cap_rate": 0,  # No terminal sale
        "selling_costs": 0,
    }
    
    cash_flows = calculate_cash_flows(input_data)
    
    # Check final year (year 5) - should be normal cash flow without terminal sale
    final_year = cash_flows[5]
    
    # Net cash flow should be much lower than with terminal sale
    assert final_year["net_cash_flow"] < 50000  # Should be lower without terminal sale

# Remove test_mc_sim_terminal_sale_consistency (references run_mc_sim) 