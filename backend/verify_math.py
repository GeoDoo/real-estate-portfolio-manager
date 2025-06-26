from fractions import Fraction
import math

def verify_year_calculation(year, expected_pv):
    """Verify the exact calculation for a specific year"""
    
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
    
    print(f"\n=== YEAR {year} VERIFICATION ===")
    
    if year == 0:
        # Year 0 calculation
        revenue = -initial_investment
        expenses = one_time_expenses + property_tax
        net_cash_flow = revenue - expenses
        present_value = net_cash_flow  # No discounting for year 0
        
        print(f"Revenue (initial investment): {revenue}")
        print(f"Expenses (one-time + property tax): {expenses}")
        print(f"Net cash flow: {net_cash_flow}")
        print(f"Present value: {present_value}")
        print(f"Expected: {expected_pv}")
        print(f"Difference: {present_value - expected_pv}")
        
        return present_value
    else:
        # Years 1-25 calculation
        # Revenue with growth
        revenue = annual_rental_income * (1 + cash_flow_growth_rate / 100) ** (year - 1)
        
        # Management fee
        management_fee = revenue * management_fees / 100
        
        # Total expenses
        total_expenses = service_charge + ground_rent + maintenance + insurance + management_fee
        
        # Net cash flow
        net_cash_flow = revenue - total_expenses
        
        # Discount factor
        discount_factor = (1 + discount_rate / 100) ** year
        
        # Present value
        present_value = net_cash_flow / discount_factor
        
        print(f"Revenue (with {cash_flow_growth_rate}% growth): {revenue:.2f}")
        print(f"Management fee ({management_fees}%): {management_fee:.2f}")
        print(f"Fixed expenses: {service_charge + ground_rent + maintenance + insurance}")
        print(f"Total expenses: {total_expenses:.2f}")
        print(f"Net cash flow: {net_cash_flow:.2f}")
        print(f"Discount factor ({(1 + discount_rate/100)**year:.6f}): {discount_factor:.6f}")
        print(f"Present value: {present_value:.2f}")
        print(f"Expected: {expected_pv}")
        print(f"Difference: {present_value - expected_pv}")
        
        return present_value

# Test specific years that are failing
print("MATHEMATICAL VERIFICATION OF DCF CALCULATIONS")
print("=" * 50)

# Test Year 9 (was failing)
verify_year_calculation(9, 5065.90)

# Test Year 10 (currently failing)
verify_year_calculation(10, 4507.19)

# Test Year 2 (was working)
verify_year_calculation(2, 11457.09)

print("\n" + "=" * 50)
print("SUMMARY:")
print("If the differences are very small (< 0.01), the expected values may be incorrect.")
print("If the differences are large, there's an error in our calculation logic.") 