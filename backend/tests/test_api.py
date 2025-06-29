import pytest
import math
import uuid
from datetime import datetime, timezone
from app import db, Property, Valuation, Portfolio
import json
from urllib.parse import quote

def create_property_with_valuation(app, portfolio_id, address, valuation_data):
    with app.app_context():
        prop = Property(id=str(uuid.uuid4()), address=address, portfolio_id=portfolio_id)
        db.session.add(prop)
        db.session.commit()
        val = Valuation(
            id=str(uuid.uuid4()),
            property_id=prop.id,
            created_at=datetime.now(timezone.utc).isoformat(),
            **valuation_data
        )
        db.session.add(val)
        db.session.commit()
        return prop, val

@pytest.fixture
def client(app):
    with app.test_client() as client:
        yield client

@pytest.fixture
def sample_portfolio(app):
    with app.app_context():
        portfolio = Portfolio(id=str(uuid.uuid4()), name="Test Portfolio")
        db.session.add(portfolio)
        db.session.commit()
        return portfolio

@pytest.fixture
def sample_property(app, sample_portfolio):
    with app.app_context():
        property_obj = Property(
            id=str(uuid.uuid4()),
            address=f"123 Test St {uuid.uuid4().hex[:8]}",
            created_at=datetime.now(timezone.utc).isoformat(),
            portfolio_id=sample_portfolio.id
        )
        db.session.add(property_obj)
        db.session.commit()
        return property_obj

@pytest.fixture
def sample_valuation(app, sample_property):
    with app.app_context():
        valuation = Valuation(
            id=str(uuid.uuid4()),
            property_id=sample_property.id,
            created_at=datetime.now(timezone.utc).isoformat(),
            initial_investment=200000,
            annual_rental_income=24000,
            service_charge=3000,
            ground_rent=500,
            maintenance=1000,
            property_tax=6000,
            insurance=300,
            management_fees=12,
            transaction_costs=3000,
            annual_rent_growth=2,
            discount_rate=15,
            holding_period=25,
            ltv=80,
            interest_rate=5,
        )
        db.session.add(valuation)
        db.session.commit()
        return valuation

def create_portfolio_with_properties_and_valuations(app, portfolio_id, props_and_vals):
    with app.app_context():
        for address, val_data in props_and_vals:
            create_property_with_valuation(app, portfolio_id, address, val_data)

def test_portfolio_irr_negative(client):
    app = client.application
    portfolio_id = str(uuid.uuid4())
    v1 = {
        "initial_investment": 100000,
        "annual_rental_income": 10000,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 10,
        "transaction_costs": 2000,
        "annual_rent_growth": 0,
        "discount_rate": 10,
        "holding_period": 3,
    }
    v2 = {
        "initial_investment": 50000,
        "annual_rental_income": 5000,
        "service_charge": 500,
        "ground_rent": 200,
        "maintenance": 500,
        "property_tax": 3000,
        "insurance": 100,
        "management_fees": 5,
        "transaction_costs": 1000,
        "annual_rent_growth": 0,
        "discount_rate": 10,
        "holding_period": 3,
    }
    create_portfolio_with_properties_and_valuations(
        app,
        portfolio_id,
        [(f"123 Main St {uuid.uuid4().hex[:8]}", v1), (f"456 Side St {uuid.uuid4().hex[:8]}", v2)]
    )
    resp = client.get(f"/api/portfolios/{portfolio_id}/irr")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "irr" in data
    assert data["irr"] is not None
    assert math.isfinite(data["irr"])
    assert data["irr"] < 0

def test_portfolio_irr_positive(client):
    app = client.application
    portfolio_id = str(uuid.uuid4())
    v = {
        "initial_investment": 100000,
        "annual_rental_income": 70000,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 10,
        "transaction_costs": 2000,
        "annual_rent_growth": 0,
        "discount_rate": 10,
        "holding_period": 3,
    }
    create_portfolio_with_properties_and_valuations(
        app,
        portfolio_id,
        [(f"789 High St {uuid.uuid4().hex[:8]}", v)]
    )
    resp = client.get(f"/api/portfolios/{portfolio_id}/irr")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "irr" in data
    assert data["irr"] is not None
    assert math.isfinite(data["irr"])
    assert data["irr"] > 0

def test_portfolio_irr_no_properties(client):
    portfolio_id = str(uuid.uuid4())
    resp = client.get(f"/api/portfolios/{portfolio_id}/irr")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data

def test_portfolio_irr_no_valuations(client):
    app = client.application
    portfolio_id = str(uuid.uuid4())
    with app.app_context():
        prop = Property(id=str(uuid.uuid4()), address=f"789 Empty St {uuid.uuid4().hex[:8]}", portfolio_id=portfolio_id)
        db.session.add(prop)
        db.session.commit()
    resp = client.get(f"/api/portfolios/{portfolio_id}/irr")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data

def test_monte_carlo_stream_endpoint(client):
    """Test that the Monte Carlo streaming endpoint works correctly."""
    # Create a test valuation
    valuation_data = {
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
        "ltv": 80,
        "interest_rate": 5,
    }
    
    # Create property and valuation
    property_response = client.post("/api/properties", json={"address": "123 Test St"})
    property_id = property_response.json["id"]
    
    valuation_response = client.post(f"/api/properties/{property_id}/valuation", json=valuation_data)
    valuation_id = valuation_response.json["id"]
    
    # Test Monte Carlo streaming with smaller number for speed
    params = {
        "num_simulations": "1000",  # Smaller number for testing
        "annual_rent_growth": quote(json.dumps({"distribution": "normal", "mean": 2, "stddev": 1})),
        "discount_rate": quote(json.dumps({"distribution": "normal", "mean": 15, "stddev": 2})),
        "interest_rate": quote(json.dumps({"distribution": "normal", "mean": 5, "stddev": 1})),
        # Remove scalar values for these keys from the query string
        **{k: str(v) for k, v in valuation_data.items() if k not in ["annual_rent_growth", "discount_rate", "interest_rate"]}
    }
    
    response = client.get("/api/valuations/monte-carlo-stream", query_string=params)
    assert response.status_code == 200
    assert response.mimetype == "text/event-stream"
    
    # Parse the streaming response
    lines = response.data.decode().strip().split('\n')
    data_events = [line for line in lines if line.startswith('data: ')]
    
    # Should have at least one progress update and one final summary
    assert len(data_events) >= 2
    
    # Check the final summary
    final_data = json.loads(data_events[-1][6:])  # Remove 'data: ' prefix
    assert final_data["done"] is True
    assert "summary" in final_data
    assert "npvs" in final_data
    assert "irrs" in final_data
    
    summary = final_data["summary"]
    assert "npv_mean" in summary
    assert "irr_mean" in summary
    assert "probability_npv_positive" in summary
    
    # Check that we got the expected number of results
    assert len(final_data["npvs"]) == 1000
    assert len(final_data["irrs"]) == 1000 