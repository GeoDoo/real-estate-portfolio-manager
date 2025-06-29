import pytest
import math
import uuid
from datetime import datetime
from app import db, Property, Valuation, Portfolio

def create_property_with_valuation(app, portfolio_id, address, valuation_data):
    with app.app_context():
        prop = Property(id=str(uuid.uuid4()), address=address, portfolio_id=portfolio_id)
        db.session.add(prop)
        db.session.commit()
        val = Valuation(
            id=str(uuid.uuid4()),
            property_id=prop.id,
            created_at="2024-01-01T00:00:00Z",
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
            created_at=datetime.utcnow().isoformat(),
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
            created_at=datetime.utcnow().isoformat(),
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