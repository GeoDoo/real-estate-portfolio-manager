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

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dcf_calculations.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# CORS configuration with environment variables
CORS(
    app,
    origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    supports_credentials=True,
)

db = SQLAlchemy(app)


# SQLAlchemy model for Property
class Property(db.Model):
    id = db.Column(db.String, primary_key=True)
    address = db.Column(db.String, unique=True, nullable=False)
    created_at = db.Column(db.String)
    listing_link = db.Column(db.String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "address": self.address,
            "created_at": self.created_at,
            "listing_link": self.listing_link,
        }


# SQLAlchemy model for Valuation
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
        }


# Ensure all tables are created on startup
with app.app_context():
    db.create_all()


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
            service_charge + ground_rent + maintenance + insurance + management_fee
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


def npv(rate, cash_flows):
    return sum(cf / (1 + rate) ** i for i, cf in enumerate(cash_flows))


def calculate_irr(cash_flows):
    # IRR is the rate that makes NPV = 0
    try:
        irr = brentq(lambda r: npv(r, cash_flows), -0.99, 10)
        return irr
    except Exception:
        return None


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


@app.route("/api/properties/<prop_id>", methods=["GET", "PUT"])
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
            )
            db.session.add(val)
        db.session.commit()
        return jsonify(clean_for_json(val.to_dict())), 201


@app.route("/api/valuations/monte-carlo", methods=["POST"])
def monte_carlo_valuation():
    data = request.json
    num_simulations = max(10000, data.get("num_simulations", 1000))
    # Support normal distribution for annual_rent_growth and discount_rate
    rent_growth_dist = data.get(
        "annual_rent_growth", {"distribution": "normal", "mean": 2, "stddev": 1}
    )
    discount_rate_dist = data.get(
        "discount_rate", {"distribution": "normal", "mean": 15, "stddev": 2}
    )
    # Copy other inputs as fixed values
    base_input = {
        k: v
        for k, v in data.items()
        if k not in ["annual_rent_growth", "discount_rate", "num_simulations"]
    }
    npvs = []
    irrs = []
    for _ in range(num_simulations):
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
        sim_input = base_input.copy()
        sim_input["annual_rent_growth"] = rent_growth
        sim_input["discount_rate"] = discount_rate
        cash_flows = calculate_cash_flows(sim_input)
        npv = cash_flows[-1]["cumulativePV"]
        net_cash_flows = [row["netCashFlow"] for row in cash_flows]
        irr = calculate_irr(net_cash_flows)
        npvs.append(npv)
        irrs.append(irr if irr is not None else float("nan"))
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
    return jsonify({"npv_results": npvs, "irr_results": irrs, "summary": summary})


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


@app.route("/api/valuations/monte-carlo-stream", methods=["GET"])
def monte_carlo_stream():
    num_simulations = max(10000, int(request.args.get("num_simulations", 10000)))
    rent_growth_dist = json.loads(
        unquote(request.args.get("annual_rent_growth", "%7B%7D"))
    )
    discount_rate_dist = json.loads(
        unquote(request.args.get("discount_rate", "%7B%7D"))
    )
    # All other fields as base_input
    base_input = {}
    for k in request.args:
        if k not in ["annual_rent_growth", "discount_rate", "num_simulations"]:
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
            sim_input = base_input.copy()
            sim_input["annual_rent_growth"] = rent_growth
            sim_input["discount_rate"] = discount_rate
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


if __name__ == "__main__":
    app.run(debug=True, port=8000)
