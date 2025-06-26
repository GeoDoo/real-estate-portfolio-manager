from app import calculate_cash_flows

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

cash_flows = calculate_cash_flows(input_data)

print("Year 9 values:")
year9 = cash_flows[9]
print(f"Raw presentValue: {year9['presentValue']}")
print(f"Type: {type(year9['presentValue'])}")
print(f"Round to 2 decimals: {round(year9['presentValue'], 2)}")
print(f"Format to 2 decimals: {year9['presentValue']:.2f}")

# Let's also check the Fraction calculation directly
from fractions import Fraction

annual_rental_income = Fraction('20000')
management_fees = Fraction('12')
cash_flow_growth_rate = Fraction('2')
discount_rate = Fraction('15')
service_charge = Fraction('1000')
ground_rent = Fraction('500')
maintenance = Fraction('1000')
insurance = Fraction('300')

# Year 9 calculation
revenue = annual_rental_income * (1 + cash_flow_growth_rate / 100) ** 8  # year-1 = 8
management_fee = revenue * management_fees / 100
total_expenses = service_charge + ground_rent + maintenance + insurance + management_fee
net_cash_flow = revenue - total_expenses
denominator = (1 + discount_rate / 100) ** 9
present_value = net_cash_flow / denominator

print(f"\nDirect Fraction calculation:")
print(f"Revenue: {revenue}")
print(f"Management fee: {management_fee}")
print(f"Total expenses: {total_expenses}")
print(f"Net cash flow: {net_cash_flow}")
print(f"Denominator: {denominator}")
print(f"Present value (Fraction): {present_value}")
print(f"Present value (float): {float(present_value)}")
print(f"Present value (rounded): {round(float(present_value), 2)}") 