from fractions import Fraction
from flask import Flask, request, jsonify, abort
from flask_cors import CORS
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In-memory storage for valuations
valuations = {}

def calculate_cash_flows(input):
    initial_investment = Fraction(str(input['initial_investment']))
    annual_rental_income = Fraction(str(input['annual_rental_income']))
    service_charge = Fraction(str(input['service_charge']))
    ground_rent = Fraction(str(input['ground_rent']))
    maintenance = Fraction(str(input['maintenance']))
    property_tax = Fraction(str(input['property_tax']))
    insurance = Fraction(str(input['insurance']))
    management_fees = Fraction(str(input['management_fees']))
    one_time_expenses = Fraction(str(input['one_time_expenses']))
    cash_flow_growth_rate = Fraction(str(input['cash_flow_growth_rate']))
    discount_rate = Fraction(str(input['discount_rate']))
    holding_period = int(input['holding_period'])

    rows = []
    cumulative_pv = Fraction(0)

    # Year 0
    year0_revenue = -initial_investment
    year0_expenses = one_time_expenses + property_tax
    year0_net_cash_flow = year0_revenue - year0_expenses
    year0_pv = year0_net_cash_flow
    cumulative_pv += year0_pv
    rows.append({
        'year': 0,
        'revenue': float(year0_revenue),
        'totalExpenses': float(year0_expenses),
        'netCashFlow': float(year0_net_cash_flow),
        'presentValue': float(year0_pv),
        'cumulativePV': float(cumulative_pv),
    })

    for year in range(1, holding_period + 1):
        revenue = annual_rental_income * (1 + cash_flow_growth_rate / 100) ** (year - 1)
        management_fee = revenue * management_fees / 100
        total_expenses = service_charge + ground_rent + maintenance + insurance + management_fee
        net_cash_flow = revenue - total_expenses
        denominator = (1 + discount_rate / 100) ** year
        present_value = net_cash_flow / denominator
        cumulative_pv += present_value
        rows.append({
            'year': year,
            'revenue': float(revenue),
            'totalExpenses': float(total_expenses),
            'netCashFlow': float(net_cash_flow),
            'presentValue': float(present_value),
            'cumulativePV': float(cumulative_pv),
        })
    return rows

# GET/POST /api/valuations
@app.route('/api/valuations', methods=['GET', 'POST'])
def valuations_collection():
    if request.method == 'GET':
        return jsonify(list(valuations.values()))
    elif request.method == 'POST':
        data = request.json
        val_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        valuation = {
            'id': val_id,
            'created_at': now,
            **data
        }
        valuations[val_id] = valuation
        return jsonify(valuation), 201

# GET/PUT/DELETE /api/valuations/<id>
@app.route('/api/valuations/<val_id>', methods=['GET', 'PUT', 'DELETE'])
def valuation_item(val_id):
    if val_id not in valuations:
        abort(404)
    if request.method == 'GET':
        return jsonify(valuations[val_id])
    elif request.method == 'PUT':
        data = request.json
        valuations[val_id].update(data)
        return jsonify(valuations[val_id])
    elif request.method == 'DELETE':
        del valuations[val_id]
        return '', 204

# GET /api/valuations/<id>/cashflows
@app.route('/api/valuations/<val_id>/cashflows', methods=['GET'])
def valuation_cashflows(val_id):
    if val_id not in valuations:
        abort(404)
    cash_flows = calculate_cash_flows(valuations[val_id])
    return jsonify({'cashFlows': cash_flows})

# POST /api/cashflows/calculate (ad-hoc DCF calculation)
@app.route('/api/cashflows/calculate', methods=['POST'])
def cashflows_calculate():
    data = request.json
    cash_flows = calculate_cash_flows(data)
    return jsonify({'cashFlows': cash_flows})

if __name__ == '__main__':
    app.run(debug=True) 