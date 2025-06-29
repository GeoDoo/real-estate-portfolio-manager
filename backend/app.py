from fractions import Fraction
from flask import Flask, request, jsonify, abort, Response
from flask_cors import CORS
import uuid
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
import os
from scipy.optimize import brentq
import numpy as np
import json
from urllib.parse import unquote
import math

db = SQLAlchemy()
PORT = int(os.environ.get("BACKEND_PORT", 5050))

# --- Models ---
class Portfolio(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

class Property(db.Model):
    id = db.Column(db.String, primary_key=True)
    address = db.Column(db.String, unique=True, nullable=False)
    created_at = db.Column(db.String)
    listing_link = db.Column(db.String, nullable=True)
    portfolio_id = db.Column(db.String, db.ForeignKey("portfolio.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "address": self.address,
            "created_at": self.created_at,
            "listing_link": self.listing_link,
            "portfolio_id": self.portfolio_id,
        }

class Valuation(db.Model):
    id = db.Column(db.String, primary_key=True)
    property_id = db.Column(
        db.String, db.ForeignKey("property.id"), unique=True, nullable=False
    )
    created_at = db.Column(db.String)
    initial_investment = db.Column(db.Float)
    annual_rental_income = db.Column(db.Float)
    service_charge = db.Column(db.Float)
    ground_rent = db.Column(db.Float)
    maintenance = db.Column(db.Float)
    property_tax = db.Column(db.Float)
    insurance = db.Column(db.Float)
    management_fees = db.Column(db.Float)
    transaction_costs = db.Column(db.Float)
    annual_rent_growth = db.Column(db.Float)
    discount_rate = db.Column(db.Float)
    holding_period = db.Column(db.Integer)
    ltv = db.Column(db.Float)  # Loan-to-Value percentage
    interest_rate = db.Column(db.Float)  # Annual interest rate percentage

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "created_at": self.created_at,
            "initial_investment": self.initial_investment,
            "annual_rental_income": self.annual_rental_income,
            "service_charge": self.service_charge,
            "ground_rent": self.ground_rent,
            "maintenance": self.maintenance,
            "property_tax": self.property_tax,
            "insurance": self.insurance,
            "management_fees": self.management_fees,
            "transaction_costs": self.transaction_costs,
            "annual_rent_growth": self.annual_rent_growth,
            "discount_rate": self.discount_rate,
            "holding_period": self.holding_period,
            "ltv": self.ltv,
            "interest_rate": self.interest_rate,
        }

# --- Utility Functions ---
def calculate_cash_flows(input):
    # Provide defaults for all expected fields
    input = {
        "initial_investment": input.get("initial_investment", 0),
        "annual_rental_income": input.get("annual_rental_income", 0),
        "service_charge": input.get("service_charge", 0),
        "ground_rent": input.get("ground_rent", 0),
        "maintenance": input.get("maintenance", 0),
        "property_tax": input.get("property_tax", 0),
        "insurance": input.get("insurance", 0),
        "management_fees": input.get("management_fees", 0),
        "transaction_costs": input.get("transaction_costs", 0),
        "annual_rent_growth": input.get("annual_rent_growth", 0),
        "discount_rate": input.get("discount_rate", 0),
        "holding_period": input.get("holding_period", 0),
        "ltv": input.get("ltv", 0),
        "interest_rate": input.get("interest_rate", 0),
    }
    initial_investment = Fraction(str(input["initial_investment"]))
    annual_rental_income = Fraction(str(input["annual_rental_income"]))
    service_charge = Fraction(str(input["service_charge"]))
    ground_rent = Fraction(str(input["ground_rent"]))
    maintenance = Fraction(str(input["maintenance"]))
    property_tax = Fraction(str(input["property_tax"]))
    insurance = Fraction(str(input["insurance"]))
    management_fees = Fraction(str(input["management_fees"]))
    transaction_costs = Fraction(str(input["transaction_costs"]))
    annual_rent_growth = Fraction(str(input["annual_rent_growth"]))
    discount_rate = Fraction(str(input["discount_rate"]))
    holding_period = int(input["holding_period"])
    ltv = Fraction(str(input.get("ltv", 0) or 0))
    interest_rate = Fraction(str(input.get("interest_rate", 0) or 0))

    # Calculate mortgage payment if LTV > 0
    monthly_mortgage_payment = Fraction(0)
    if ltv > 0 and interest_rate > 0:
        mortgage_amount = initial_investment * (ltv / 100)
        monthly_rate = interest_rate / 100 / 12
        num_payments = holding_period * 12
        
        if monthly_rate > 0:
            # Standard mortgage payment formula
            monthly_mortgage_payment = mortgage_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
        else:
            # Simple interest-free loan
            monthly_mortgage_payment = mortgage_amount / num_payments
    
    annual_mortgage_payment = monthly_mortgage_payment * 12

    rows = []
    cumulative_pv = Fraction(0)

    # Year 0
    year0_revenue = -initial_investment
    year0_expenses = transaction_costs + property_tax
    year0_net_cash_flow = year0_revenue - year0_expenses
    year0_pv = year0_net_cash_flow
    cumulative_pv += year0_pv
    rows.append(
        {
            "year": 0,
            "revenue": float(f"{float(year0_revenue):.2f}"),
            "totalExpenses": float(f"{float(year0_expenses):.2f}"),
            "netCashFlow": float(f"{float(year0_net_cash_flow):.2f}"),
            "presentValue": float(f"{float(year0_pv):.2f}"),
            "cumulativePV": float(f"{float(cumulative_pv):.2f}"),
        }
    )

    for year in range(1, holding_period + 1):
        revenue = annual_rental_income * (1 + annual_rent_growth / 100) ** (year - 1)
        management_fee = revenue * management_fees / 100
        total_expenses = (
            service_charge + ground_rent + maintenance + insurance + management_fee + annual_mortgage_payment
        )
        net_cash_flow = revenue - total_expenses
        denominator = (1 + discount_rate / 100) ** year
        present_value = net_cash_flow / denominator
        cumulative_pv += present_value
        rows.append(
            {
                "year": year,
                "revenue": float(f"{float(revenue):.2f}"),
                "totalExpenses": float(f"{float(total_expenses):.2f}"),
                "netCashFlow": float(f"{float(net_cash_flow):.2f}"),
                "presentValue": float(f"{float(present_value):.2f}"),
                "cumulativePV": float(f"{float(cumulative_pv):.2f}"),
            }
        )
    return rows

def calculate_irr(cash_flows):
    # IRR is the rate that makes NPV = 0
    try:
        irr = brentq(lambda r: npv(r, cash_flows), -0.99, 10)
        return irr
    except Exception:
        return None

def npv(rate, cash_flows):
    return sum(cf / (1 + rate) ** i for i, cf in enumerate(cash_flows))

def clean_for_json(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, list):
        return [clean_for_json(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    return obj

def calculate_cash_flows_vectorized(base_input, rent_growths, discount_rates, interest_rates):
    """
    Vectorized cash flow and NPV/IRR calculation for Monte Carlo simulation.
    All inputs are numpy arrays of shape (num_simulations,).
    Returns npvs, irrs arrays.
    """
    import numpy as np
    # Extract scalar inputs
    initial_investment = float(base_input.get("initial_investment", 0))
    annual_rental_income = float(base_input.get("annual_rental_income", 0))
    service_charge = float(base_input.get("service_charge", 0))
    ground_rent = float(base_input.get("ground_rent", 0))
    maintenance = float(base_input.get("maintenance", 0))
    property_tax = float(base_input.get("property_tax", 0))
    insurance = float(base_input.get("insurance", 0))
    management_fees = float(base_input.get("management_fees", 0))
    transaction_costs = float(base_input.get("transaction_costs", 0))
    holding_period = int(base_input.get("holding_period", 0))
    ltv = float(base_input.get("ltv", 0) or 0)
    # All vector inputs must be np arrays
    rent_growths = np.asarray(rent_growths)
    discount_rates = np.asarray(discount_rates)
    interest_rates = np.asarray(interest_rates)
    num_sim = rent_growths.shape[0]

    # Mortgage payment calculation (vectorized)
    monthly_mortgage_payment = np.zeros(num_sim)
    if ltv > 0:
        mortgage_amount = initial_investment * (ltv / 100)
        monthly_rates = interest_rates / 100 / 12
        num_payments = holding_period * 12
        # Avoid division by zero
        with np.errstate(divide='ignore', invalid='ignore'):
            mask = monthly_rates > 0
            monthly_mortgage_payment[mask] = mortgage_amount * (
                monthly_rates[mask] * (1 + monthly_rates[mask]) ** num_payments
            ) / ((1 + monthly_rates[mask]) ** num_payments - 1)
            # For zero interest
            monthly_mortgage_payment[~mask] = mortgage_amount / num_payments if num_payments > 0 else 0
    annual_mortgage_payment = monthly_mortgage_payment * 12

    # Year 0 cash flows (same for all)
    year0_revenue = -initial_investment
    year0_expenses = transaction_costs + property_tax
    year0_net_cash_flow = year0_revenue - year0_expenses
    # For each simulation, build cash flow arrays: shape (num_sim, holding_period+1)
    net_cash_flows = np.zeros((num_sim, holding_period + 1))
    net_cash_flows[:, 0] = year0_net_cash_flow

    # Precompute per-year factors
    years = np.arange(1, holding_period + 1)
    # (num_sim, years)
    revenue = annual_rental_income * (1 + rent_growths[:, None] / 100) ** (years[None, :] - 1)
    management_fee = revenue * management_fees / 100
    total_expenses = (
        service_charge + ground_rent + maintenance + insurance + management_fee + annual_mortgage_payment[:, None]
    )
    net_cash = revenue - total_expenses
    net_cash_flows[:, 1:] = net_cash

    # Present value discounting
    denominators = (1 + discount_rates[:, None] / 100) ** years[None, :]
    present_values = np.zeros_like(net_cash_flows)
    present_values[:, 0] = year0_net_cash_flow  # Year 0 not discounted
    present_values[:, 1:] = net_cash / denominators
    cumulative_pv = np.sum(present_values, axis=1)

    # IRR calculation (vectorized, but fallback to nan if fails)
    def try_irr(cf):
        try:
            return float(np.irr(cf))
        except Exception:
            return float('nan')
    # Use numpy's vectorized function if available, else fallback to list comprehension
    try:
        irrs = np.array([try_irr(cf) for cf in net_cash_flows])
    except Exception:
        irrs = np.full(num_sim, float('nan'))

    return cumulative_pv, irrs

# --- App Factory ---
def create_app(test_config=None):
    app = Flask(__name__)
    if test_config:
        app.config.update(test_config)
    else:
        FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dcf_calculations.db"
        )
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        app.config["CORS_ORIGINS"] = FRONTEND_URL
    # --- CORS SETUP ---
    # For local development, allow all origins so frontend (localhost:3000) can always connect.
    # For production, change to: CORS(app, origins=os.environ.get("FRONTEND_URL", "http://localhost:3000"), supports_credentials=True)
    # and set the FRONTEND_URL environment variable to your deployed frontend's URL.
    CORS(app, origins="*", supports_credentials=True)
    db.init_app(app)

    # Ensure all tables are created on startup (only if not in testing)
    if not app.config.get("TESTING", False):
        with app.app_context():
            db.create_all()

    # GET/POST /api/valuations
    @app.route("/api/valuations", methods=["GET", "POST"])
    def valuations_collection():
        if request.method == "GET":
            vals = Valuation.query.all()
            return jsonify([v.to_dict() for v in vals])
        elif request.method == "POST":
            data = request.json
            val_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            valuation = Valuation(
                id=val_id,
                created_at=now,
                initial_investment=data.get("initial_investment", 0),
                annual_rental_income=data.get("annual_rental_income", 0),
                service_charge=data.get("service_charge", 0),
                ground_rent=data.get("ground_rent", 0),
                maintenance=data.get("maintenance", 0),
                property_tax=data.get("property_tax", 0),
                insurance=data.get("insurance", 0),
                management_fees=data.get("management_fees", 0),
                transaction_costs=data.get("transaction_costs", 0),
                annual_rent_growth=data.get("annual_rent_growth", 0),
                discount_rate=data.get("discount_rate", 0),
                holding_period=data.get("holding_period", 0),
                ltv=data.get("ltv", 0),
                interest_rate=data.get("interest_rate", 0),
            )
            db.session.add(valuation)
            db.session.commit()
            return jsonify(clean_for_json(valuation.to_dict())), 201

    # GET/PUT/DELETE /api/valuations/<id>
    @app.route("/api/valuations/<val_id>", methods=["GET", "PUT", "DELETE"])
    def valuation_item(val_id):
        valuation = Valuation.query.get(val_id)
        if not valuation:
            abort(404)
        if request.method == "GET":
            return jsonify(clean_for_json(valuation.to_dict()))
        elif request.method == "PUT":
            data = request.json
            for key, value in data.items():
                if hasattr(valuation, key):
                    setattr(valuation, key, value)
            db.session.commit()
            return jsonify(clean_for_json(valuation.to_dict()))
        elif request.method == "DELETE":
            db.session.delete(valuation)
            db.session.commit()
            return "", 204

    # GET /api/valuations/<id>/cashflows
    @app.route("/api/valuations/<val_id>/cashflows", methods=["GET"])
    def valuation_cashflows(val_id):
        valuation = Valuation.query.get(val_id)
        if not valuation:
            abort(404)
        cash_flows = calculate_cash_flows(valuation.to_dict())
        return jsonify({"cashFlows": cash_flows})

    # POST /api/cashflows/calculate (ad-hoc DCF calculation)
    @app.route("/api/cashflows/calculate", methods=["POST"])
    def cashflows_calculate():
        data = request.json
        cash_flows = calculate_cash_flows(data)
        return jsonify({"cashFlows": cash_flows})

    @app.route("/api/cashflows/irr", methods=["POST"])
    def irr_calculate():
        data = request.json
        cash_flows = data.get("cash_flows")
        if not isinstance(cash_flows, list) or len(cash_flows) < 2:
            return (
                jsonify({"error": "cash_flows must be a list of at least two numbers"}),
                400,
            )
        irr = calculate_irr(cash_flows)
        if irr is None:
            return jsonify({"error": "IRR could not be calculated"}), 400
        return jsonify({"irr": irr * 100})

    @app.route("/api/valuations", methods=["OPTIONS"])
    @app.route("/api/valuations/<val_id>", methods=["OPTIONS"])
    @app.route("/api/valuations/<val_id>/cashflows", methods=["OPTIONS"])
    @app.route("/api/cashflows/calculate", methods=["OPTIONS"])
    @app.route("/api/cashflows/irr", methods=["OPTIONS"])
    def options_handler(val_id=None):
        return "", 204

    # --- Property Endpoints ---
    @app.route("/api/properties", methods=["GET", "POST"])
    def properties_collection():
        if request.method == "GET":
            props = Property.query.all()
            return jsonify([p.to_dict() for p in props])
        elif request.method == "POST":
            data = request.json
            address = data.get("address")
            if not address:
                return jsonify({"error": "Address is required"}), 400
            if Property.query.filter_by(address=address).first():
                return jsonify({"error": "Property with this address already exists"}), 400
            prop_id = str(uuid.uuid4())
            now = datetime.utcnow().isoformat()
            prop = Property(
                id=prop_id,
                address=address,
                created_at=now,
                listing_link=data.get("listing_link"),
            )
            db.session.add(prop)
            db.session.commit()
            return jsonify(clean_for_json(prop.to_dict())), 201

    @app.route("/api/properties/<prop_id>", methods=["GET", "PUT", "PATCH"])
    def property_item(prop_id):
        prop = Property.query.get(prop_id)
        if not prop:
            abort(404)

        if request.method == "GET":
            return jsonify(clean_for_json(prop.to_dict()))
        elif request.method == "PUT":
            data = request.json
            address = data.get("address")
            if not address:
                return jsonify({"error": "Address is required"}), 400

            # Check if address is being changed and if it conflicts with existing property
            if (
                address != prop.address
                and Property.query.filter_by(address=address).first()
            ):
                return jsonify({"error": "Property with this address already exists"}), 400

            prop.address = address
            prop.listing_link = data.get("listing_link")
            db.session.commit()
            return jsonify(clean_for_json(prop.to_dict()))
        elif request.method == "PATCH":
            data = request.json
            
            # Handle address updates (with validation)
            if "address" in data:
                address = data["address"]
                if not address:
                    return jsonify({"error": "Address is required"}), 400
                
                # Check if address is being changed and if it conflicts with existing property
                if (
                    address != prop.address
                    and Property.query.filter_by(address=address).first()
                ):
                    return jsonify({"error": "Property with this address already exists"}), 400
                
                prop.address = address
            
            # Handle other field updates
            if "listing_link" in data:
                prop.listing_link = data["listing_link"]
            
            if "portfolio_id" in data:
                # Allow removing from portfolio by setting to None if null is sent
                if data["portfolio_id"] is None:
                    prop.portfolio_id = None
                else:
                    prop.portfolio_id = data["portfolio_id"]
            
            db.session.commit()
            return jsonify(clean_for_json(prop.to_dict()))

    # --- Property Valuation Endpoints ---
    @app.route("/api/properties/<prop_id>/valuation", methods=["GET", "POST", "PUT"])
    def property_valuation(prop_id):
        prop = Property.query.get(prop_id)
        if not prop:
            abort(404)
        if request.method == "GET":
            val = Valuation.query.filter_by(property_id=prop_id).first()
            if not val:
                return jsonify({}), 200
            return jsonify(clean_for_json(val.to_dict()))
        elif request.method in ["POST", "PUT"]:
            data = request.json
            # Backend validation: required fields must be positive, optional fields can be 0 or positive
            required_fields = [
                "initial_investment", "annual_rental_income", "maintenance", "property_tax",
                "management_fees", "transaction_costs", "annual_rent_growth", "discount_rate", "holding_period"
            ]
            optional_fields = ["service_charge", "ground_rent", "insurance", "ltv", "interest_rate"]
            for field in required_fields:
                value = data.get(field)
                if value is None or not isinstance(value, (int, float)) or value <= 0:
                    return jsonify({"error": f"{field.replace('_', ' ').capitalize()} is required and must be a positive number."}), 400
            for field in optional_fields:
                value = data.get(field)
                if value is not None and value < 0:
                    return jsonify({"error": f"{field.replace('_', ' ').capitalize()} cannot be negative."}), 400
            val = Valuation.query.filter_by(property_id=prop_id).first()
            now = datetime.utcnow().isoformat()
            if val:
                # Update existing valuation
                for key, value in data.items():
                    if hasattr(val, key):
                        setattr(val, key, value)
                val.created_at = now
            else:
                # Create new valuation
                val_id = str(uuid.uuid4())
                val = Valuation(
                    id=val_id,
                    property_id=prop_id,
                    created_at=now,
                    initial_investment=data.get("initial_investment", 0),
                    annual_rental_income=data.get("annual_rental_income", 0),
                    service_charge=data.get("service_charge", 0),
                    ground_rent=data.get("ground_rent", 0),
                    maintenance=data.get("maintenance", 0),
                    property_tax=data.get("property_tax", 0),
                    insurance=data.get("insurance", 0),
                    management_fees=data.get("management_fees", 0),
                    transaction_costs=data.get("transaction_costs", 0),
                    annual_rent_growth=data.get("annual_rent_growth", 0),
                    discount_rate=data.get("discount_rate", 0),
                    holding_period=data.get("holding_period", 0),
                    ltv=data.get("ltv", 0),
                    interest_rate=data.get("interest_rate", 0),
                )
                db.session.add(val)
            db.session.commit()
            return jsonify(clean_for_json(val.to_dict())), 201

    @app.route("/api/valuations/monte-carlo", methods=["POST"])
    def monte_carlo_valuation():
        data = request.json
        num_simulations = max(10000, data.get("num_simulations", 1000))
        rent_growth_dist = data.get(
            "annual_rent_growth", {"distribution": "normal", "mean": 2, "stddev": 1}
        )
        discount_rate_dist = data.get(
            "discount_rate", {"distribution": "normal", "mean": 15, "stddev": 2}
        )
        interest_rate_dist = data.get(
            "interest_rate", {"distribution": "normal", "mean": 5, "stddev": 1}
        )
        base_input = {
            k: v
            for k, v in data.items()
            if k not in ["annual_rent_growth", "discount_rate", "interest_rate", "num_simulations"]
        }
        # Vectorized random draws
        if rent_growth_dist["distribution"] == "normal":
            rent_growths = np.random.normal(rent_growth_dist["mean"], rent_growth_dist["stddev"], num_simulations)
        else:
            rent_growths = np.full(num_simulations, rent_growth_dist["mean"])
        if discount_rate_dist["distribution"] == "normal":
            discount_rates = np.random.normal(discount_rate_dist["mean"], discount_rate_dist["stddev"], num_simulations)
        else:
            discount_rates = np.full(num_simulations, discount_rate_dist["mean"])
        if interest_rate_dist["distribution"] == "normal":
            interest_rates = np.random.normal(interest_rate_dist["mean"], interest_rate_dist["stddev"], num_simulations)
        else:
            interest_rates = np.full(num_simulations, interest_rate_dist["mean"])
        npvs, irrs = calculate_cash_flows_vectorized(base_input, rent_growths, discount_rates, interest_rates)
        summary = {
            "npv_mean": float(np.nanmean(npvs)),
            "npv_5th_percentile": float(np.nanpercentile(npvs, 5)),
            "npv_95th_percentile": float(np.nanpercentile(npvs, 95)),
            "irr_mean": float(np.nanmean(irrs)),
            "irr_5th_percentile": float(np.nanpercentile(irrs, 5)),
            "irr_95th_percentile": float(np.nanpercentile(irrs, 95)),
            "probability_npv_positive": float(np.mean(npvs > 0)),
        }
        return jsonify({"npv_results": npvs.tolist(), "irr_results": irrs.tolist(), "summary": summary})

    @app.route("/api/valuations/monte-carlo-stream", methods=["GET"])
    def monte_carlo_stream():
        num_simulations = max(10000, int(request.args.get("num_simulations", 10000)))
        rent_growth_dist = json.loads(
            unquote(request.args.get("annual_rent_growth", "%7B%7D"))
        )
        discount_rate_dist = json.loads(
            unquote(request.args.get("discount_rate", "%7B%7D"))
        )
        interest_rate_dist = json.loads(
            unquote(request.args.get("interest_rate", "%7B%7D"))
        )
        # All other fields as base_input
        base_input = {}
        for k in request.args:
            if k not in ["annual_rent_growth", "discount_rate", "interest_rate", "num_simulations"]:
                try:
                    base_input[k] = float(request.args[k])
                except ValueError:
                    base_input[k] = request.args[k]

        def event_stream():
            npvs = []
            irrs = []
            batch_size = 500
            for i in range(num_simulations):
                if rent_growth_dist["distribution"] == "normal":
                    rent_growth = np.random.normal(
                        rent_growth_dist["mean"], rent_growth_dist["stddev"]
                    )
                else:
                    rent_growth = rent_growth_dist["mean"]
                if discount_rate_dist["distribution"] == "normal":
                    discount_rate = np.random.normal(
                        discount_rate_dist["mean"], discount_rate_dist["stddev"]
                    )
                else:
                    discount_rate = discount_rate_dist["mean"]
                if interest_rate_dist["distribution"] == "normal":
                    interest_rate = np.random.normal(
                        interest_rate_dist["mean"], interest_rate_dist["stddev"]
                    )
                else:
                    interest_rate = interest_rate_dist["mean"]
                sim_input = base_input.copy()
                sim_input["annual_rent_growth"] = rent_growth
                sim_input["discount_rate"] = discount_rate
                sim_input["interest_rate"] = interest_rate
                cash_flows = calculate_cash_flows(sim_input)
                npv = cash_flows[-1]["cumulativePV"]
                net_cash_flows = [row["netCashFlow"] for row in cash_flows]
                irr = calculate_irr(net_cash_flows)
                npvs.append(npv)
                irrs.append(irr if irr is not None else float("nan"))
                if (i + 1) % batch_size == 0 or (i + 1) == num_simulations:
                    progress = i + 1
                    partial = {
                        "progress": progress,
                        "total": num_simulations,
                        "npvs": npvs[:],
                        "irrs": irrs[:],
                    }
                    yield f"data: {json.dumps(clean_for_json(partial))}\n\n"
            # Final summary
            npvs_arr = np.array(npvs)
            irrs_arr = np.array(irrs)
            summary = {
                "npv_mean": float(np.nanmean(npvs_arr)),
                "npv_5th_percentile": float(np.nanpercentile(npvs_arr, 5)),
                "npv_95th_percentile": float(np.nanpercentile(npvs_arr, 95)),
                "irr_mean": float(np.nanmean(irrs_arr)),
                "irr_5th_percentile": float(np.nanpercentile(irrs_arr, 5)),
                "irr_95th_percentile": float(np.nanpercentile(irrs_arr, 95)),
                "probability_npv_positive": float(np.mean(npvs_arr > 0)),
            }
            yield f"data: {json.dumps(clean_for_json({'done': True, 'summary': summary, 'npvs': npvs, 'irrs': irrs}))}\n\n"

        return Response(event_stream(), mimetype="text/event-stream")

    # Minimal Portfolio CRUD endpoints (KISS, DRY, YAGNI)
    @app.route("/api/portfolios", methods=["GET", "POST"])
    def portfolios_collection():
        if request.method == "GET":
            portfolios = Portfolio.query.all()
            return jsonify([{"id": p.id, "name": p.name} for p in portfolios])
        elif request.method == "POST":
            data = request.json
            portfolio = Portfolio(id=str(uuid.uuid4()), name=data["name"])
            db.session.add(portfolio)
            db.session.commit()
            return jsonify({"id": portfolio.id, "name": portfolio.name}), 201

    @app.route("/api/portfolios/<portfolio_id>", methods=["DELETE"])
    def delete_portfolio(portfolio_id):
        portfolio = Portfolio.query.get(portfolio_id)
        if not portfolio:
            abort(404)
        # Set properties' portfolio_id to None (YAGNI: no cascade delete)
        for prop in Property.query.filter_by(portfolio_id=portfolio_id):
            prop.portfolio_id = None
        db.session.delete(portfolio)
        db.session.commit()
        return "", 204

    @app.route("/api/portfolios/<portfolio_id>", methods=["GET"])
    def get_portfolio(portfolio_id):
        portfolio = Portfolio.query.get(portfolio_id)
        if not portfolio:
            abort(404)
        return jsonify({"id": portfolio.id, "name": portfolio.name})

    @app.route("/api/portfolios/<portfolio_id>/properties", methods=["GET"])
    def get_portfolio_properties(portfolio_id):
        properties = Property.query.filter_by(portfolio_id=portfolio_id).all()
        return jsonify([p.to_dict() for p in properties])

    @app.route("/api/portfolios/<portfolio_id>/irr", methods=["GET"])
    def portfolio_irr(portfolio_id):
        # Get all properties in the portfolio
        properties = Property.query.filter_by(portfolio_id=portfolio_id).all()
        if not properties:
            return jsonify({"error": "No properties found for this portfolio"}), 404

        # For each property, get valuation and cash flows
        all_cash_flows = []
        max_years = 0
        for prop in properties:
            valuation = Valuation.query.filter_by(property_id=prop.id).first()
            if not valuation:
                continue  # skip properties without valuation
            cash_flows = calculate_cash_flows(valuation.to_dict())
            net_cash_flows = [row["netCashFlow"] for row in cash_flows]
            all_cash_flows.append(net_cash_flows)
            max_years = max(max_years, len(net_cash_flows))

        if not all_cash_flows:
            return jsonify({"error": "No valuations found for properties"}), 404

        # Aggregate by year
        portfolio_cash_flows = []
        for year in range(max_years):
            year_sum = 0
            for cf in all_cash_flows:
                if year < len(cf):
                    year_sum += cf[year]
            portfolio_cash_flows.append(year_sum)

        # Calculate IRR
        irr = calculate_irr(portfolio_cash_flows)
        if irr is None:
            return jsonify({"error": "IRR could not be calculated"}), 400

        return jsonify({"irr": irr * 100})

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=PORT)
