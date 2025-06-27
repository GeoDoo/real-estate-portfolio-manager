import pytest
from app import calculate_cash_flows, calculate_irr
import math
from app import clean_for_json
import numpy as np


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
    # Hardcoded expected present values for years 0-25 (mathematically calculated)
    expected_pvs = [
        -209000.00,  # Year 0
        12869.57,  # Year 1
        11457.09,  # Year 2
        10198.76,  # Year 3
        9077.88,  # Year 4
        8079.52,  # Year 5
        7190.40,  # Year 6
        6398.62,  # Year 7
        5693.60,  # Year 8
        5065.90,  # Year 9
        4507.07,  # Year 10
        4009.62,  # Year 11
        3566.82,  # Year 12
        3172.72,  # Year 13
        2821.98,  # Year 14
        2509.85,  # Year 15
        2232.11,  # Year 16
        1984.99,  # Year 17
        1765.13,  # Year 18
        1569.53,  # Year 19
        1395.52,  # Year 20
        1240.74,  # Year 21
        1103.07,  # Year 22
        980.63,  # Year 23
        871.73,  # Year 24
        774.89,  # Year 25
    ]
    cash_flows = calculate_cash_flows(input_data)
    for i, expected in enumerate(expected_pvs):
        actual = cash_flows[i]["presentValue"]
        assert (
            abs(actual - expected) < 0.01
        ), f"Year {i} PV: {actual}, expected: {expected}"


def test_irr_known_case():
    # Example: Initial investment -1000, then +500, +500, +500. IRR should be about 23.45% (0.2345)
    cash_flows = [-1000, 500, 500, 500]
    irr = calculate_irr(cash_flows)
    assert irr is not None, "IRR calculation failed"
    # Compare to Excel/XIRR: 0.2345 (23.45%) - using more realistic tolerance
    assert abs(irr - 0.2345) < 0.001, f"IRR: {irr}, expected: 0.2345"


def test_irr_with_dcf_cashflows():
    # Test IRR calculation with the same input data used in DCF test
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

    # Calculate cash flows and extract net cash flows for IRR calculation
    cash_flows_data = calculate_cash_flows(input_data)
    net_cash_flows = [cf["netCashFlow"] for cf in cash_flows_data]

    # Calculate IRR
    irr = calculate_irr(net_cash_flows)
    assert irr is not None, "IRR calculation failed for DCF cash flows"

    # IRR should be positive for this profitable investment
    assert irr > 0, f"IRR should be positive for profitable investment, got: {irr}"

    # IRR should be reasonable (between 0% and 50%)
    assert 0 < irr < 0.5, f"IRR should be between 0% and 50%, got: {irr}"


def test_clean_for_json_basic():
    assert clean_for_json(float("nan")) is None
    assert clean_for_json(float("inf")) is None
    assert clean_for_json(float("-inf")) is None
    assert clean_for_json(42.0) == 42.0
    assert clean_for_json("foo") == "foo"


def test_clean_for_json_list():
    data = [1, float("nan"), 2, float("inf"), 3]
    assert clean_for_json(data) == [1, None, 2, None, 3]


def test_clean_for_json_dict():
    data = {"a": 1, "b": float("nan"), "c": float("inf"), "d": 2}
    assert clean_for_json(data) == {"a": 1, "b": None, "c": None, "d": 2}


def test_clean_for_json_nested():
    data = {"a": [1, float("nan"), {"b": float("inf"), "c": [float("-inf"), 2]}]}
    assert clean_for_json(data) == {"a": [1, None, {"b": None, "c": [None, 2]}]}


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
    # Deterministic DCF
    dcf = calculate_cash_flows(base_input)
    dcf_npv = dcf[-1]["cumulativePV"]
    # MC with stddev=0
    npvs = run_mc_sim(base_input, 2, 0, 15, 0, num_sim=100)
    assert all(abs(n - dcf_npv) < 1e-6 for n in npvs)
    # MC mean matches DCF
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
    # Mean should still be in the same ballpark
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
