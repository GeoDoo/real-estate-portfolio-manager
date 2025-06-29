import pytest
from app import calculate_cash_flows, calculate_irr, app, db
from tests import in_memory_db
import numpy as np
import math

@pytest.fixture(autouse=True, scope="module")
def in_memory_db():
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        yield
        db.drop_all()

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
    expected_pvs = [
        -209000.00, 12869.57, 11457.09, 10198.76, 9077.88, 8079.52, 7190.40, 6398.62, 5693.60, 5065.90, 4507.07, 4009.62, 3566.82, 3172.72, 2821.98, 2509.85, 2232.11, 1984.99, 1765.13, 1569.53, 1395.52, 1240.74, 1103.07, 980.63, 871.73, 774.89,
    ]
    cash_flows = calculate_cash_flows(input_data)
    for i, expected in enumerate(expected_pvs):
        actual = cash_flows[i]["presentValue"]
        assert abs(actual - expected) < 0.01, f"Year {i} PV: {actual}, expected: {expected}"

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
    net_cash_flows = [cf["netCashFlow"] for cf in cash_flows_data]
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
        npv = cash_flows[-1]["cumulativePV"]
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
    dcf_npv = dcf[-1]["cumulativePV"]
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
    # Mortgage amount = 100000 * 0.8 = 80000
    # Monthly rate = 0.06 / 12 = 0.005
    # Num payments = 5*12 = 60
    # Monthly payment = 80000 * (0.005 * (1+0.005)**60) / ((1+0.005)**60 - 1)
    # Calculate expected annual mortgage payment
    mortgage_amount = 80000
    monthly_rate = 0.06 / 12
    num_payments = 60
    monthly_payment = mortgage_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    annual_payment = monthly_payment * 12
    # The first year's total expenses should include the annual mortgage payment
    year1 = cash_flows[1]
    assert abs(year1["totalExpenses"] - (1000 + 500 + 1000 + 300 + (12000 * 10 / 100) + annual_payment)) < 1 \
        , f"Expected total expenses to include mortgage payment. Got {year1['totalExpenses']}"
    # If ltv=0 or interest_rate=0, mortgage payment should be zero
    input_data["ltv"] = 0
    cash_flows_no_mortgage = calculate_cash_flows(input_data)
    year1_no_mortgage = cash_flows_no_mortgage[1]
    assert year1_no_mortgage["totalExpenses"] < year1["totalExpenses"], "Expenses should be lower without mortgage payment" 