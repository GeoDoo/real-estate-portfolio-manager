from fractions import Fraction

def calculate_all_present_values():
    """Calculate all present values for years 0-25 using exact mathematics"""
    
    # Input parameters
    initial_investment = 200000
    annual_rental_income = 20000
    service_charge = 1000
    ground_rent = 500
    maintenance = 1000
    property_tax = 6000
    insurance = 300
    management_fees = 12
    one_time_expenses = 3000
    cash_flow_growth_rate = 2
    discount_rate = 15
    holding_period = 25
    
    present_values = []
    
    for year in range(holding_period + 1):
        if year == 0:
            # Year 0 calculation
            revenue = -initial_investment
            expenses = one_time_expenses + property_tax
            net_cash_flow = revenue - expenses
            present_value = net_cash_flow  # No discounting for year 0
        else:
            # Years 1-25 calculation
            revenue = annual_rental_income * (1 + cash_flow_growth_rate / 100) ** (year - 1)
            management_fee = revenue * management_fees / 100
            total_expenses = service_charge + ground_rent + maintenance + insurance + management_fee
            net_cash_flow = revenue - total_expenses
            discount_factor = (1 + discount_rate / 100) ** year
            present_value = net_cash_flow / discount_factor
        
        # Round to 2 decimal places
        rounded_pv = round(present_value, 2)
        present_values.append(rounded_pv)
        
        print(f"Year {year}: {rounded_pv}")
    
    return present_values

if __name__ == "__main__":
    print("Calculating all present values for years 0-25:")
    print("=" * 50)
    values = calculate_all_present_values()
    
    print("\n" + "=" * 50)
    print("Copy this list to replace the expected_pvs in test_dcf.py:")
    print("expected_pvs = [")
    for i, value in enumerate(values):
        print(f"    {value:.2f},    # Year {i}")
    print("]") 