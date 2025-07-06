from fractions import Fraction
from flask import Flask, request, jsonify, abort, send_file, Response
from flask_cors import CORS
import uuid
from datetime import datetime, timezone, timedelta
from flask_sqlalchemy import SQLAlchemy
import os
from scipy.optimize import brentq
import numpy as np
import math
import numpy_financial as npf
import json
import sqlite3
from land_registry_db import get_comparable_sales

db = SQLAlchemy()
PORT = int(os.environ.get("BACKEND_PORT", 5050))

# --- Utility Functions ---
def validate_fields(data, required_fields, optional_fields=None):
    """Validate required and optional fields in data. Returns (True, cleaned_data) or (False, error_message)."""
    if optional_fields is None:
        optional_fields = []
    cleaned = {}
    for field, field_type, min_value in required_fields:
        value = data.get(field)
        if value is None or not isinstance(value, field_type):
            type_names = (
                ', '.join([t.__name__ for t in field_type])
                if isinstance(field_type, tuple)
                else field_type.__name__
            )
            return False, f"{field.replace('_', ' ').capitalize()} is required and must be a {type_names}."
        if isinstance(value, str) and isinstance(field_type, type) and field_type is str:
            if len(value) < min_value:
                return False, f"{field.replace('_', ' ').capitalize()} must be at least {min_value} characters."
        elif isinstance(value, str) and isinstance(field_type, tuple) and str in field_type:
            if len(value) < min_value:
                return False, f"{field.replace('_', ' ').capitalize()} must be at least {min_value} characters."
        elif isinstance(value, (int, float)):
            if value < min_value:
                return False, f"{field.replace('_', ' ').capitalize()} must be >= {min_value}."
        cleaned[field] = value
    for field, field_type, min_value in optional_fields:
        value = data.get(field)
        if value is not None:
            if not isinstance(value, field_type):
                type_names = (
                    ', '.join([t.__name__ for t in field_type])
                    if isinstance(field_type, tuple)
                    else field_type.__name__
                )
                return False, f"{field.replace('_', ' ').capitalize()} must be a {type_names}."
            if isinstance(value, str) and isinstance(field_type, type) and field_type is str:
                if len(value) < min_value:
                    return False, f"{field.replace('_', ' ').capitalize()} must be at least {min_value} characters."
            elif isinstance(value, str) and isinstance(field_type, tuple) and str in field_type:
                if len(value) < min_value:
                    return False, f"{field.replace('_', ' ').capitalize()} must be at least {min_value} characters."
            elif isinstance(value, (int, float)):
                if value < min_value:
                    return False, f"{field.replace('_', ' ').capitalize()} must be >= {min_value}."
            cleaned[field] = value
    return True, cleaned

def populate_model_from_data(model, data, fields):
    """Set attributes on a model from a data dictionary for the given fields."""
    for field in fields:
        if field in data and hasattr(model, field):
            setattr(model, field, data[field])
    return model

def validate_property_address(address, existing_property=None):
    """Validate property address with uniqueness check."""
    if not address:
        return False, "Address is required"
    
    if existing_property and address == existing_property.address:
        return True, address
    
    if db.session.query(Property).filter_by(address=address).first():
        return False, "Property with this address already exists"
    
    return True, address

# --- Models ---
class Portfolio(db.Model):
    id = db.Column(db.String, primary_key=True)
    name = db.Column(db.String, nullable=False)

class Property(db.Model):
    id = db.Column(db.String, primary_key=True)
    address = db.Column(db.String, unique=True, nullable=False)
    postcode = db.Column(db.String, nullable=False)
    created_at = db.Column(db.String)
    listing_link = db.Column(db.String, nullable=True)
    portfolio_id = db.Column(db.String, db.ForeignKey("portfolio.id"), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "address": self.address,
            "postcode": self.postcode,
            "created_at": self.created_at,
            "listing_link": self.listing_link,
            "portfolio_id": self.portfolio_id,
        }

class Valuation(db.Model):
    id = db.Column(db.String, primary_key=True)
    property_id = db.Column(
        db.String, db.ForeignKey("property.id"), unique=True, nullable=True
    )
    created_at = db.Column(db.String)
    initial_investment = db.Column(db.Float)
    annual_rental_income = db.Column(db.Float)
    vacancy_rate = db.Column(db.Float, default=0)
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
    capex = db.Column(db.Float, default=0)  # Annual CapEx
    exit_cap_rate = db.Column(db.Float, default=0)  # Exit capitalization rate percentage
    selling_costs = db.Column(db.Float, default=0)  # Selling costs as percentage of sale price

    def to_dict(self):
        return {
            "id": self.id,
            "property_id": self.property_id,
            "created_at": self.created_at,
            "initial_investment": self.initial_investment,
            "annual_rental_income": self.annual_rental_income,
            "vacancy_rate": self.vacancy_rate,
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
            "capex": self.capex,
            "exit_cap_rate": self.exit_cap_rate,
            "selling_costs": self.selling_costs,
        }

# --- Utility Functions ---
def safe_number(val):
    if val in (None, '', 'None'):
        return 0
    return val

def calculate_mortgage_payment(initial_investment, ltv, interest_rate, holding_period):
    """Calculate monthly mortgage payment."""
    if ltv <= 0 or interest_rate <= 0:
        return Fraction(0)
    
    mortgage_amount = initial_investment * (ltv / 100)
    monthly_rate = interest_rate / 100 / 12
    num_payments = holding_period * 12
    
    if monthly_rate > 0:
        # Standard mortgage payment formula
        return mortgage_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    else:
        # Simple interest-free loan
        return mortgage_amount / num_payments

def calculate_year_cash_flow(
    year, annual_rental_income, annual_rent_growth, service_charge,
    ground_rent, maintenance, insurance, management_fees,
    annual_mortgage_payment, discount_rate, vacancy_rate=0
):
    """Calculate cash flow for a specific year."""
    # Calculate gross revenue with growth
    gross_revenue = annual_rental_income * (1 + annual_rent_growth / 100) ** (year - 1)
    
    # Apply vacancy rate to get effective revenue
    effective_revenue = gross_revenue * (1 - vacancy_rate / 100)
    
    # Calculate operating expenses (excluding mortgage)
    operating_expenses = (
        service_charge + ground_rent + maintenance + insurance + 
        management_fees
    )
    
    # Calculate NOI and net cash flow
    noi = effective_revenue - operating_expenses
    net_cash_flow = noi - annual_mortgage_payment
    
    return {
        "gross_rent": gross_revenue,
        "vacancy_loss": gross_revenue - effective_revenue,
        "effective_rent": effective_revenue,
        "operating_expenses": operating_expenses,
        "noi": noi,
        "net_cash_flow": net_cash_flow
    }

def calculate_cash_flows(input):
    """Calculate cash flows for property investment analysis (Argus-style columns)."""
    # Provide defaults for all expected fields, using safe_number
    input = {
        "initial_investment": safe_number(input.get("initial_investment", 0)),
        "annual_rental_income": safe_number(input.get("annual_rental_income", 0)),
        "vacancy_rate": safe_number(input.get("vacancy_rate", 0)),
        "service_charge": safe_number(input.get("service_charge", 0)),
        "ground_rent": safe_number(input.get("ground_rent", 0)),
        "maintenance": safe_number(input.get("maintenance", 0)),
        "property_tax": safe_number(input.get("property_tax", 0)),
        "insurance": safe_number(input.get("insurance", 0)),
        "management_fees": safe_number(input.get("management_fees", 0)),
        "transaction_costs": safe_number(input.get("transaction_costs", 0)),
        "annual_rent_growth": safe_number(input.get("annual_rent_growth", 0)),
        "discount_rate": safe_number(input.get("discount_rate", 0)),
        "holding_period": safe_number(input.get("holding_period", 0)),
        "ltv": safe_number(input.get("ltv", 0)),
        "interest_rate": safe_number(input.get("interest_rate", 0)),
        "capex": safe_number(input.get("capex", 0)),
        "exit_cap_rate": safe_number(input.get("exit_cap_rate", 0)),
        "selling_costs": safe_number(input.get("selling_costs", 0)),
    }
    
    # Convert to Fraction for precision
    initial_investment = Fraction(str(input["initial_investment"]))
    annual_rental_income = Fraction(str(input["annual_rental_income"]))
    vacancy_val = input.get("vacancy_rate")
    vacancy_rate = Fraction(str(vacancy_val if vacancy_val is not None else 0))
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
    capex_value = Fraction(str(input["capex"]))
    exit_cap_rate = Fraction(str(input["exit_cap_rate"]))
    selling_costs = Fraction(str(input["selling_costs"]))

    # Calculate mortgage payment
    monthly_mortgage_payment = calculate_mortgage_payment(
        initial_investment, ltv, interest_rate, holding_period
    )
    annual_mortgage_payment = monthly_mortgage_payment * 12

    rows = []
    cumulative_pv = Fraction(0)

    # Year 0 (initial investment)
    year0_row = {
        "year": 0,
        "gross_rent": float(f"{-initial_investment:.2f}"),
        "vacancy_loss": 0.0,
        "effective_rent": 0.0,
        "operating_expenses": float(f"{transaction_costs + property_tax:.2f}"),
        "noi": float(f"{-initial_investment - (transaction_costs + property_tax):.2f}"),
        "capex": 0.0,
        "net_cash_flow": float(f"{-initial_investment - (transaction_costs + property_tax):.2f}"),
        "discount_factor": 1.0,
        "present_value": float(f"{-initial_investment - (transaction_costs + property_tax):.2f}"),
        "cumulative_pv": float(f"{-initial_investment - (transaction_costs + property_tax):.2f}"),
    }
    cumulative_pv += year0_row["present_value"]
    rows.append(year0_row)

    # Years 1 to holding_period
    for year in range(1, holding_period + 1):
        gross_rent = annual_rental_income * (1 + annual_rent_growth / 100) ** (year - 1)
        vacancy_loss = gross_rent * (vacancy_rate / 100)
        effective_rent = gross_rent - vacancy_loss
        management_fee = effective_rent * management_fees / 100
        operating_expenses = (
            service_charge + ground_rent + maintenance + property_tax + insurance + management_fee + annual_mortgage_payment
        )
        noi = effective_rent - (
            service_charge + ground_rent + maintenance + property_tax + insurance + management_fee
        )
        capex = capex_value
        net_cash_flow = noi - capex - annual_mortgage_payment
        
        # Add terminal sale in the final year
        if year == holding_period and exit_cap_rate > 0:
            # Calculate terminal value based on exit cap rate
            terminal_noi = noi  # Use the final year's NOI
            terminal_value = terminal_noi / (exit_cap_rate / 100)
            selling_costs_amount = terminal_value * (selling_costs / 100)
            net_terminal_value = terminal_value - selling_costs_amount
            net_cash_flow += net_terminal_value
        
        discount_factor = float(1 / (1 + discount_rate / 100) ** year)
        present_value = float(net_cash_flow * discount_factor)
        cumulative_pv += present_value
        row = {
            "year": year,
            "gross_rent": float(gross_rent),
            "vacancy_loss": float(vacancy_loss),
            "effective_rent": float(effective_rent),
            "operating_expenses": float(operating_expenses),
            "noi": float(noi),
            "capex": float(capex),
            "net_cash_flow": float(net_cash_flow),
            "discount_factor": float(discount_factor),
            "present_value": float(present_value),
            "cumulative_pv": float(cumulative_pv),
        }
        rows.append(row)

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

# Helper for safe IRR stats
def safe_irr_stats(irrs):
    if np.all(np.isnan(irrs)):
        return None, None, None
    return (
        float(np.nanmean(irrs)),
        float(np.nanpercentile(irrs, 5)),
        float(np.nanpercentile(irrs, 95)),
    )

def calculate_payback_period(cash_flows, discount_rate=0.08):
    """
    Calculate simple and discounted payback period.
    
    Args:
        cash_flows: List of cash flows (Year 0 should be negative investment)
        discount_rate: Annual discount rate (default 8%)
    
    Returns:
        Dictionary with simple_payback and discounted_payback periods
    """
    if not cash_flows or len(cash_flows) < 2:
        return {"simple_payback": None, "discounted_payback": None}
    
    try:
        # Extract initial investment (Year 0, should be negative)
        initial_investment = abs(cash_flows[0]) if cash_flows[0] < 0 else 0
        
        if initial_investment == 0:
            return {"simple_payback": None, "discounted_payback": None}
        
        # Calculate simple payback period
        cumulative_cash_flow = 0
        simple_payback = None
        
        for year, cash_flow in enumerate(cash_flows[1:], 1):  # Skip Year 0
            if cash_flow > 0:  # Only count positive cash flows
                cumulative_cash_flow += cash_flow
                if cumulative_cash_flow >= initial_investment:
                    # Interpolate to get exact year
                    remaining = initial_investment - (cumulative_cash_flow - cash_flow)
                    fraction = remaining / cash_flow
                    simple_payback = year - 1 + fraction
                    break
        
        # Calculate discounted payback period
        cumulative_discounted_cf = 0
        discounted_payback = None
        
        for year, cash_flow in enumerate(cash_flows[1:], 1):  # Skip Year 0
            if cash_flow > 0:  # Only count positive cash flows
                discounted_cf = cash_flow / ((1 + discount_rate) ** year)
                cumulative_discounted_cf += discounted_cf
                if cumulative_discounted_cf >= initial_investment:
                    # Interpolate to get exact year
                    remaining = initial_investment - (cumulative_discounted_cf - discounted_cf)
                    fraction = remaining / discounted_cf
                    discounted_payback = year - 1 + fraction
                    break
        
        return {
            "simple_payback": float(simple_payback) if simple_payback is not None else None,
            "discounted_payback": float(discounted_payback) if discounted_payback is not None else None
        }
        
    except Exception:
        return {"simple_payback": None, "discounted_payback": None}

def calculate_rental_metrics(purchase_price, monthly_rent, ltv, interest_rate, 
                           property_tax, insurance, maintenance, management_fees, 
                           transaction_costs, holding_period_years, capex=0):
    """Calculate key rental investment metrics."""
    # Calculate loan details
    loan_amount = purchase_price * (ltv / 100)
    down_payment = purchase_price - loan_amount
    monthly_rate = interest_rate / 100 / 12
    num_payments = holding_period_years * 12
    
    # Calculate monthly mortgage payment
    if monthly_rate > 0:
        monthly_mortgage = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    else:
        monthly_mortgage = loan_amount / num_payments
    
    # Calculate monthly expenses
    monthly_expenses = monthly_mortgage + property_tax + insurance + maintenance + management_fees + capex
    monthly_cash_flow = monthly_rent - monthly_expenses
    annual_cash_flow = monthly_cash_flow * 12
    
    # Calculate key metrics
    total_investment = down_payment + transaction_costs
    roi = (annual_cash_flow / total_investment) * 100 if total_investment > 0 else 0
    
    # Cap Rate
    annual_rental_income = monthly_rent * 12
    annual_expenses_no_mortgage = (property_tax + insurance + maintenance + management_fees) * 12
    net_operating_income = annual_rental_income - annual_expenses_no_mortgage
    cap_rate = (net_operating_income / purchase_price) * 100 if purchase_price > 0 else 0
    
    # Cash-on-Cash Return
    cash_on_cash = roi
    
    # Break-even analysis
    break_even_rent = monthly_expenses
    rent_coverage_ratio = monthly_rent / monthly_expenses if monthly_expenses > 0 else 0
    
    return {
        "monthly_cash_flow": monthly_cash_flow,
        "annual_cash_flow": annual_cash_flow,
        "roi_percent": roi,
        "cap_rate_percent": cap_rate,
        "cash_on_cash_percent": cash_on_cash,
        "break_even_rent": break_even_rent,
        "rent_coverage_ratio": rent_coverage_ratio,
        "monthly_mortgage": monthly_mortgage,
        "down_payment": down_payment,
        "loan_amount": loan_amount,
        "total_investment": total_investment
    }

# Helper to safely convert to float, treating None as default
def safe_float(val, default=0):
    try:
        if val is None:
            return default
        return float(val)
    except (TypeError, ValueError):
        return default

# --- App Factory ---
def create_app(test_config=None):
    app = Flask(__name__)
    if test_config:
        app.config.update(test_config)
    else:
        FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "dcf_calculations.db"
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
            return jsonify({"items": [v.to_dict() for v in vals]}), 200
        elif request.method == "POST":
            data = request.json
            required_fields = [
                ("initial_investment", (int, float), 0),
                ("annual_rental_income", (int, float), 0),
                ("maintenance", (int, float), 0),
                ("property_tax", (int, float), 0),
                ("management_fees", (int, float), 0),
                ("transaction_costs", (int, float), 0),
                ("annual_rent_growth", (int, float), 0),
                ("discount_rate", (int, float), 0),
                ("holding_period", (int, float), 0),
            ]
            optional_fields = [
                ("service_charge", (int, float), 0),
                ("ground_rent", (int, float), 0),
                ("insurance", (int, float), 0),
                ("ltv", (int, float), 0),
                ("interest_rate", (int, float), 0),
                ("capex", (int, float), 0),
                ("vacancy_rate", (int, float), 0),
                ("exit_cap_rate", (int, float), 0),
                ("selling_costs", (int, float), 0),
            ]
            is_valid, cleaned = validate_fields(data, required_fields, optional_fields)
            if not is_valid:
                return jsonify({"error": cleaned}), 400
            val_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            valuation = Valuation(id=val_id, created_at=now)
            valuation = populate_model_from_data(valuation, cleaned, cleaned.keys())
            db.session.add(valuation)
            db.session.commit()
            return jsonify({"data": clean_for_json(valuation.to_dict())}), 201

    # GET/PUT/DELETE /api/valuations/<id>
    @app.route("/api/valuations/<val_id>", methods=["GET", "PUT", "DELETE"])
    def valuation_item(val_id):
        valuation = db.session.get(Valuation, val_id)
        if not valuation:
            return jsonify({"error": "Valuation not found"}), 404
        if request.method == "GET":
            return jsonify({"data": clean_for_json(valuation.to_dict())}), 200
        elif request.method == "PUT":
            data = request.json
            required_fields = [
                ("initial_investment", (int, float), 0),
                ("annual_rental_income", (int, float), 0),
                ("maintenance", (int, float), 0),
                ("property_tax", (int, float), 0),
                ("management_fees", (int, float), 0),
                ("transaction_costs", (int, float), 0),
                ("annual_rent_growth", (int, float), 0),
                ("discount_rate", (int, float), 0),
                ("holding_period", (int, float), 0),
            ]
            optional_fields = [
                ("service_charge", (int, float), 0),
                ("ground_rent", (int, float), 0),
                ("insurance", (int, float), 0),
                ("ltv", (int, float), 0),
                ("interest_rate", (int, float), 0),
                ("capex", (int, float), 0),
                ("vacancy_rate", (int, float), 0),
                ("exit_cap_rate", (int, float), 0),
                ("selling_costs", (int, float), 0),
            ]
            is_valid, cleaned = validate_fields(data, required_fields, optional_fields)
            if not is_valid:
                return jsonify({"error": cleaned}), 400
            valuation = populate_model_from_data(valuation, cleaned, cleaned.keys())
            db.session.commit()
            return jsonify({"data": clean_for_json(valuation.to_dict())}), 200
        elif request.method == "DELETE":
            db.session.delete(valuation)
            db.session.commit()
            return "", 204

    # GET /api/valuations/<id>/cashflows
    @app.route("/api/valuations/<val_id>/cashflows", methods=["GET"])
    def valuation_cashflows(val_id):
        valuation = db.session.get(Valuation, val_id)
        if not valuation:
            abort(404)
        cash_flows = calculate_cash_flows(valuation.to_dict())
        return jsonify({"cashFlows": cash_flows})

    @app.route("/api/valuations/<val_id>/payback", methods=["GET"])
    def valuation_payback(val_id):
        valuation = db.session.get(Valuation, val_id)
        if not valuation:
            abort(404)
        cash_flows = calculate_cash_flows(valuation.to_dict())
        net_cash_flows = [row["net_cash_flow"] for row in cash_flows]
        payback_data = calculate_payback_period(net_cash_flows)
        return jsonify(payback_data)

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
            return jsonify({"items": [p.to_dict() for p in props]}), 200
        elif request.method == "POST":
            data = request.json
            required_fields = [
                ("address", str, 1),
                ("postcode", str, 1),
            ]
            optional_fields = [
                ("listing_link", str, 0),
            ]
            is_valid, cleaned = validate_fields(data, required_fields, optional_fields)
            if not is_valid:
                return jsonify({"error": cleaned}), 400
            # Validate address uniqueness
            is_valid_addr, result = validate_property_address(cleaned["address"])
            if not is_valid_addr:
                return jsonify({"error": result}), 400
            prop_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            prop = Property(id=prop_id, address=cleaned["address"], postcode=cleaned["postcode"], created_at=now)
            if "listing_link" in cleaned:
                prop.listing_link = cleaned["listing_link"]
            db.session.add(prop)
            db.session.commit()
            return jsonify({"data": clean_for_json(prop.to_dict())}), 201

    @app.route("/api/properties/<prop_id>", methods=["GET", "PUT", "PATCH"])
    def property_item(prop_id):
        prop = db.session.get(Property, prop_id)
        if not prop:
            return jsonify({"error": "Property not found"}), 404
        if request.method == "GET":
            return jsonify({"data": clean_for_json(prop.to_dict())}), 200
        elif request.method == "PUT":
            data = request.json
            required_fields = [
                ("address", str, 1),
                ("postcode", str, 1),
            ]
            optional_fields = [
                ("listing_link", str, 0),
            ]
            is_valid, cleaned = validate_fields(data, required_fields, optional_fields)
            if not is_valid:
                return jsonify({"error": cleaned}), 400
            is_valid_addr, result = validate_property_address(cleaned["address"], prop)
            if not is_valid_addr:
                return jsonify({"error": result}), 400
            prop = populate_model_from_data(prop, cleaned, cleaned.keys())
            db.session.commit()
            return jsonify({"data": clean_for_json(prop.to_dict())}), 200
        elif request.method == "PATCH":
            data = request.json
            # Only update provided fields
            updatable_fields = ["address", "postcode", "listing_link", "portfolio_id"]
            cleaned = {k: v for k, v in data.items() if k in updatable_fields}
            if "address" in cleaned:
                is_valid_addr, result = validate_property_address(cleaned["address"], prop)
                if not is_valid_addr:
                    return jsonify({"error": result}), 400
            prop = populate_model_from_data(prop, cleaned, cleaned.keys())
            db.session.commit()
            return jsonify({"data": clean_for_json(prop.to_dict())}), 200

    # --- Property Valuation Endpoints ---
    @app.route("/api/properties/<prop_id>/valuation", methods=["GET", "POST", "PUT"])
    def property_valuation(prop_id):
        prop = db.session.get(Property, prop_id)
        if not prop:
            return jsonify({"error": "Property not found"}), 404
            
        if request.method == "GET":
            val = db.session.query(Valuation).filter_by(property_id=prop_id).first()
            if not val:
                return jsonify({"data": None}), 200
            val_dict = val.to_dict()
            val_dict["postcode"] = prop.postcode
            return jsonify({"data": clean_for_json(val_dict)})
        elif request.method in ["POST", "PUT"]:
            data = request.json
            
            # Validate valuation data using new utilities
            required_fields = [
                ("initial_investment", (int, float), 0),
                ("annual_rental_income", (int, float), 0),
                ("maintenance", (int, float), 0),
                ("property_tax", (int, float), 0),
                ("management_fees", (int, float), 0),
                ("transaction_costs", (int, float), 0),
                ("annual_rent_growth", (int, float), 0),
                ("discount_rate", (int, float), 0),
                ("holding_period", (int, float), 0),
            ]
            optional_fields = [
                ("service_charge", (int, float), 0),
                ("ground_rent", (int, float), 0),
                ("insurance", (int, float), 0),
                ("ltv", (int, float), 0),
                ("interest_rate", (int, float), 0),
                ("capex", (int, float), 0),
                ("vacancy_rate", (int, float), 0),
                ("exit_cap_rate", (int, float), 0),
                ("selling_costs", (int, float), 0),
            ]
            is_valid, cleaned = validate_fields(data, required_fields, optional_fields)
            if not is_valid:
                return jsonify({"error": cleaned}), 400
            
            # Get existing valuation or create new one
            existing_val = db.session.query(Valuation).filter_by(property_id=prop_id).first()
            
            if existing_val:
                # Update existing valuation
                existing_val = populate_model_from_data(existing_val, cleaned, cleaned.keys())
                existing_val.created_at = datetime.now(timezone.utc).isoformat()
                db.session.commit()
                return jsonify({"data": clean_for_json(existing_val.to_dict())}), 200
            else:
                # Create new valuation
                val_id = str(uuid.uuid4())
                now = datetime.now(timezone.utc).isoformat()
                valuation = Valuation(id=val_id, property_id=prop_id, created_at=now)
                valuation = populate_model_from_data(valuation, cleaned, cleaned.keys())
                db.session.add(valuation)
                db.session.commit()
                return jsonify({"data": clean_for_json(valuation.to_dict())}), 201

    @app.route("/api/valuations/monte-carlo", methods=["POST"])
    def monte_carlo_valuation():
        """Run Monte Carlo simulation for property valuation with SSE progress reporting."""
        from flask import Response
        import json
        import time
        data = request.json
        num_simulations = max(1, min(50000, int(data.get("num_simulations", 10000))))
        
        # Extract distribution parameters with defaults
        rent_growth_dist = data.get("annual_rent_growth", {"distribution": "normal", "mean": 2, "stddev": 1})
        discount_rate_dist = data.get("discount_rate", {"distribution": "normal", "mean": 15, "stddev": 2})
        interest_rate_dist = data.get("interest_rate", {"distribution": "normal", "mean": 5, "stddev": 1})
        
        # Base input excludes distribution parameters
        base_input = {
            k: v for k, v in data.items()
            if k not in ["annual_rent_growth", "discount_rate", "interest_rate", "num_simulations"]
        }
        
        # Generate random variables
        rent_growths = _generate_random_variable(rent_growth_dist, num_simulations)
        discount_rates = _generate_random_variable(discount_rate_dist, num_simulations)
        interest_rates = _generate_random_variable(interest_rate_dist, num_simulations)
        
        def event_stream():
            npvs = []
            irrs = []
            batch = max(1, num_simulations // 100)  # Send progress every 1%
            for i in range(num_simulations):
                sim_input = base_input.copy()
                sim_input["annual_rent_growth"] = rent_growths[i]
                sim_input["discount_rate"] = discount_rates[i]
                sim_input["interest_rate"] = interest_rates[i]
                cash_flows = calculate_cash_flows(sim_input)
                npv = cash_flows[-1]["cumulative_pv"]
                npvs.append(npv)
                cf_values = [cf["net_cash_flow"] for cf in cash_flows]
                irr = calculate_irr(cf_values)
                irrs.append(float('nan') if irr is None else irr)
                if (i + 1) % batch == 0 or (i + 1) == num_simulations:
                    progress = int(100 * (i + 1) / num_simulations)
                    yield f"data: {json.dumps({'progress': progress})}\n\n"
            # Final results
            summary = _calculate_monte_carlo_summary(np.array(npvs), np.array(irrs))
            yield f"data: {json.dumps({'progress': 100, 'npvs': npvs, 'irrs': irrs, 'summary': summary, 'done': True})}\n\n"
        return Response(event_stream(), mimetype="text/event-stream")

    def _generate_random_variable(distribution_config, num_simulations):
        """Generate random variables based on distribution configuration."""
        dist = distribution_config.get("distribution")
        if dist == "normal":
            return np.random.normal(
                distribution_config["mean"], 
                distribution_config["stddev"], 
                num_simulations
            )
        elif dist == "pareto":
            a = distribution_config.get("shape", 2)
            min_val = distribution_config.get("mean", 1)
            return min_val * (1 + np.random.pareto(a, num_simulations))
        else:
            return np.full(num_simulations, distribution_config.get("mean", 0))

    def _calculate_monte_carlo_summary(npvs, irrs):
        """Calculate summary statistics for Monte Carlo results."""
        irr_mean, irr_5th, irr_95th = safe_irr_stats(irrs)
        valid_irrs = irrs[np.isfinite(irrs)]
        percent_valid_irr = 100 * len(valid_irrs) / len(irrs) if len(irrs) > 0 else 0
        mean_valid_irr = float(np.nanmean(valid_irrs)) if len(valid_irrs) > 0 else None
        return {
            "npv_mean": float(np.nanmean(npvs)),
            "npv_5th_percentile": float(np.nanpercentile(npvs, 5)),
            "npv_95th_percentile": float(np.nanpercentile(npvs, 95)),
            "irr_mean": irr_mean,
            "irr_5th_percentile": irr_5th,
            "irr_95th_percentile": irr_95th,
            "probability_npv_positive": float(np.mean(npvs > 0)),
            "mean_valid_irr": mean_valid_irr,
            "percent_valid_irr": percent_valid_irr,
        }

    # Minimal Portfolio CRUD endpoints (KISS, DRY, YAGNI)
    @app.route("/api/portfolios", methods=["GET", "POST"])
    def portfolios_collection():
        if request.method == "GET":
            portfolios = Portfolio.query.all()
            return jsonify({"items": [{"id": p.id, "name": p.name} for p in portfolios]})
        elif request.method == "POST":
            data = request.json
            portfolio = Portfolio(id=str(uuid.uuid4()), name=data["name"])
            db.session.add(portfolio)
            db.session.commit()
            return jsonify({"data": {"id": portfolio.id, "name": portfolio.name}}), 201

    @app.route("/api/portfolios/<portfolio_id>", methods=["DELETE"])
    def delete_portfolio(portfolio_id):
        portfolio = db.session.get(Portfolio, portfolio_id)
        if not portfolio:
            abort(404)
        # Set properties' portfolio_id to None (YAGNI: no cascade delete)
        for prop in db.session.query(Property).filter_by(portfolio_id=portfolio_id):
            prop.portfolio_id = None
        db.session.delete(portfolio)
        db.session.commit()
        return "", 204

    @app.route("/api/portfolios/<portfolio_id>", methods=["GET"])
    def get_portfolio(portfolio_id):
        portfolio = db.session.get(Portfolio, portfolio_id)
        if not portfolio:
            abort(404)
        return jsonify({"data": {"id": portfolio.id, "name": portfolio.name}})

    @app.route("/api/portfolios/<portfolio_id>/properties", methods=["GET"])
    def get_portfolio_properties(portfolio_id):
        properties = db.session.query(Property).filter_by(portfolio_id=portfolio_id).all()
        return jsonify({"items": [p.to_dict() for p in properties]})

    @app.route("/api/portfolios/<portfolio_id>/irr", methods=["GET"])
    def portfolio_irr(portfolio_id):
        # Get all properties in the portfolio
        properties = db.session.query(Property).filter_by(portfolio_id=portfolio_id).all()
        if not properties:
            return jsonify({"error": "No properties found for this portfolio"}), 404

        # For each property, get valuation and cash flows
        all_cash_flows = []
        max_years = 0
        for prop in properties:
            valuation = db.session.query(Valuation).filter_by(property_id=prop.id).first()
            if not valuation:
                continue  # skip properties without valuation
            cash_flows = calculate_cash_flows(valuation.to_dict())
            net_cash_flows = [row["net_cash_flow"] for row in cash_flows]
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

    @app.route("/api/portfolios/<portfolio_id>/payback", methods=["GET"])
    def portfolio_payback(portfolio_id):
        # Get all properties in the portfolio
        properties = db.session.query(Property).filter_by(portfolio_id=portfolio_id).all()
        if not properties:
            return jsonify({"error": "No properties found for this portfolio"}), 404

        # For each property, get valuation and cash flows
        all_cash_flows = []
        max_years = 0
        for prop in properties:
            valuation = db.session.query(Valuation).filter_by(property_id=prop.id).first()
            if not valuation:
                continue  # skip properties without valuation
            cash_flows = calculate_cash_flows(valuation.to_dict())
            net_cash_flows = [row["net_cash_flow"] for row in cash_flows]
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

        # Calculate payback period
        payback_data = calculate_payback_period(portfolio_cash_flows)
        
        return jsonify(payback_data)

    # Add rental analysis endpoint after the Monte Carlo endpoints
    @app.route("/api/valuations/rental-analysis", methods=["POST"])
    def rental_analysis():
        """Calculate rental investment metrics for a property."""
        data = request.json
        
        # Extract input data
        purchase_price = safe_float(data.get("initial_investment"), 0)
        annual_rental_income = safe_float(data.get("annual_rental_income"), 0)
        vacancy_rate = safe_float(data.get("vacancy_rate"), 0)
        ltv = safe_float(data.get("ltv"), 0)
        interest_rate = safe_float(data.get("interest_rate"), 5)
        property_tax = safe_float(data.get("property_tax"), 0) / 12
        insurance = safe_float(data.get("insurance"), 0) / 12
        maintenance = safe_float(data.get("maintenance"), 0) / 12
        capex = safe_float(data.get("capex"), 0) / 12  # Add CapEx as monthly
        transaction_costs = safe_float(data.get("transaction_costs"), 0)
        holding_period_years = int(safe_float(data.get("holding_period"), 25))  # Default to 25 years
        
        # Calculate gross and effective rent
        gross_monthly_rent = annual_rental_income / 12
        effective_monthly_rent = gross_monthly_rent * (1 - vacancy_rate / 100)
        management_fees = effective_monthly_rent * safe_float(data.get("management_fees"), 0) / 100
        
        # Calculate metrics using effective rent
        metrics = calculate_rental_metrics(
            purchase_price, effective_monthly_rent, ltv, interest_rate,
            property_tax, insurance, maintenance, management_fees,
            transaction_costs, holding_period_years, capex
        )
        
        # Prepare response with CapEx included
        monthly_expenses = metrics["monthly_mortgage"] + property_tax + insurance + maintenance + management_fees + capex
        monthly_breakdown = {
            "gross_rental_income": gross_monthly_rent,
            "effective_rental_income": effective_monthly_rent,
            "mortgage_payment": metrics["monthly_mortgage"],
            "property_tax": property_tax,
            "insurance": insurance,
            "maintenance": maintenance,
            "property_management": management_fees,
            "capex": capex,
            "total_expenses": monthly_expenses,
            "cash_flow": metrics["monthly_cash_flow"]  # Do NOT subtract capex again
        }
        
        return jsonify({
            "metrics": {
                "monthly_cash_flow": round(metrics["monthly_cash_flow"] - capex, 2),
                "annual_cash_flow": round((metrics["monthly_cash_flow"] - capex) * 12, 2),
                "roi_percent": round(metrics["roi_percent"], 2),
                "cap_rate_percent": round(metrics["cap_rate_percent"], 2),
                "cash_on_cash_percent": round(metrics["cash_on_cash_percent"], 2),
                "break_even_rent": round(metrics["break_even_rent"], 2),
                "rent_coverage_ratio": round(metrics["rent_coverage_ratio"], 2)
            },
            "monthly_breakdown": {k: round(v, 2) for k, v in monthly_breakdown.items()},
            "loan_details": {
                "down_payment": round(metrics["down_payment"], 2),
                "loan_amount": round(metrics["loan_amount"], 2),
                "monthly_mortgage": round(metrics["monthly_mortgage"], 2),
                "total_investment": round(metrics["total_investment"], 2)
            }
        })

    # Market Data endpoints
    @app.route("/api/market-data/comparables/<postcode>", methods=["GET"])
    def get_comparable_sales_endpoint(postcode):
        try:
            limit = request.args.get('limit', 50, type=int)
            sales = get_comparable_sales(postcode, limit)
            if sales:
                prices = [sale['sale_price'] for sale in sales if sale['sale_price'] > 0]
                summary = {
                    "total_sales": len(sales),
                    "average_price": sum(prices) / len(prices) if prices else 0,
                    "min_price": min(prices) if prices else 0,
                    "max_price": max(prices) if prices else 0,
                    "price_range": max(prices) - min(prices) if prices else 0
                }
                message = None
            else:
                summary = {
                    "total_sales": 0,
                    "average_price": 0,
                    "min_price": 0,
                    "max_price": 0,
                    "price_range": 0
                }
                message = f"No comparable sales found for postcode {postcode}."
            return jsonify({
                "sales": sales,
                "summary": summary,
                "postcode": postcode,
                "source": "land_registry",
                "message": message
            })
        except Exception as e:
            return jsonify({"error": f"Failed to fetch comparable sales: {str(e)}"}), 500

    @app.route("/api/market-data/comparables/<postcode>", methods=["OPTIONS"])
    def comparable_sales_options(postcode):
        return "", 204

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=PORT)
