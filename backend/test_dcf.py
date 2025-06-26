import pytest
from app import calculate_cash_flows

def test_all_years_present_value():
    input_data = {
        'initial_investment': 200000,
        'annual_rental_income': 20000,
        'service_charge': 1000,
        'ground_rent': 500,
        'maintenance': 1000,
        'property_tax': 6000,
        'insurance': 300,
        'management_fees': 12,
        'one_time_expenses': 3000,
        'cash_flow_growth_rate': 2,
        'discount_rate': 15,
        'holding_period': 25
    }
    # Hardcoded expected present values for years 0-25 (mathematically calculated)
    expected_pvs = [
        -209000.00,    # Year 0
        12869.57,    # Year 1
        11457.09,    # Year 2
        10198.76,    # Year 3
        9077.88,    # Year 4
        8079.52,    # Year 5
        7190.40,    # Year 6
        6398.62,    # Year 7
        5693.60,    # Year 8
        5065.90,    # Year 9
        4507.07,    # Year 10
        4009.62,    # Year 11
        3566.82,    # Year 12
        3172.72,    # Year 13
        2821.98,    # Year 14
        2509.85,    # Year 15
        2232.11,    # Year 16
        1984.99,    # Year 17
        1765.13,    # Year 18
        1569.53,    # Year 19
        1395.52,    # Year 20
        1240.74,    # Year 21
        1103.07,    # Year 22
        980.63,    # Year 23
        871.73,    # Year 24
        774.89,    # Year 25
    ]
    cash_flows = calculate_cash_flows(input_data)
    for i, expected in enumerate(expected_pvs):
        actual = cash_flows[i]['presentValue']
        assert abs(actual - expected) < 0.01, f"Year {i} PV: {actual}, expected: {expected}" 