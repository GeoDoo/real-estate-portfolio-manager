import pytest
import math
import uuid
from datetime import datetime, timezone
from app import Portfolio, Property, Valuation, db, validate_fields, populate_model_from_data
import os
import json
import io

def create_property_with_valuation(app, portfolio_id, address, valuation_data):
    with app.app_context():
        prop = Property(id=str(uuid.uuid4()), address=address, postcode="TEST1 1AA", portfolio_id=portfolio_id)
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
        return portfolio.id

@pytest.fixture
def sample_property(app, sample_portfolio):
    with app.app_context():
        property_obj = Property(
            id=str(uuid.uuid4()),
            address=f"123 Test St {uuid.uuid4().hex[:8]}",
            postcode="TEST_FIXTURE 1AA",
            created_at=datetime.now(timezone.utc).isoformat(),
            portfolio_id=sample_portfolio
        )
        db.session.add(property_obj)
        db.session.commit()
        return property_obj.id

@pytest.fixture
def sample_valuation(app, sample_property):
    with app.app_context():
        valuation = Valuation(
            id=str(uuid.uuid4()),
            property_id=sample_property,
            created_at=datetime.now(timezone.utc).isoformat(),
            initial_investment=200000,
            annual_rental_income=50000,  # Increased for faster payback
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
        return valuation.id

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
        prop = Property(id=str(uuid.uuid4()), address=f"789 Empty St {uuid.uuid4().hex[:8]}", postcode="TEST2 2BB", portfolio_id=portfolio_id)
        db.session.add(prop)
        db.session.commit()
    resp = client.get(f"/api/portfolios/{portfolio_id}/irr")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data

# Payback Period Tests
def test_portfolio_payback_positive(client):
    """Test portfolio payback period with positive cash flows."""
    app = client.application
    portfolio_id = str(uuid.uuid4())
    v = {
        "initial_investment": 100000,
        "annual_rental_income": 50000,  # Very high cash flow for quick payback
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 10,
        "transaction_costs": 2000,
        "annual_rent_growth": 0,
        "discount_rate": 8,
        "holding_period": 5,
    }
    create_portfolio_with_properties_and_valuations(
        app,
        portfolio_id,
        [(f"789 High St {uuid.uuid4().hex[:8]}", v)]
    )
    resp = client.get(f"/api/portfolios/{portfolio_id}/payback")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "simple_payback" in data
    assert "discounted_payback" in data
    assert data["simple_payback"] is not None
    assert data["simple_payback"] > 0
    assert data["simple_payback"] < 5  # Should be less than holding period

def test_portfolio_payback_exceeds_holding_period(client):
    """Test portfolio payback period when it exceeds holding period."""
    app = client.application
    portfolio_id = str(uuid.uuid4())
    v = {
        "initial_investment": 100000,
        "annual_rental_income": 5000,  # Low cash flow for long payback
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 10,
        "transaction_costs": 2000,
        "annual_rent_growth": 0,
        "discount_rate": 8,
        "holding_period": 3,
    }
    create_portfolio_with_properties_and_valuations(
        app,
        portfolio_id,
        [(f"789 Low St {uuid.uuid4().hex[:8]}", v)]
    )
    resp = client.get(f"/api/portfolios/{portfolio_id}/payback")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "simple_payback" in data
    assert "discounted_payback" in data
    # Both should be None when payback exceeds holding period
    assert data["simple_payback"] is None
    assert data["discounted_payback"] is None

def test_portfolio_payback_no_properties(client):
    """Test portfolio payback when no properties exist."""
    portfolio_id = str(uuid.uuid4())
    resp = client.get(f"/api/portfolios/{portfolio_id}/payback")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data

def test_portfolio_payback_no_valuations(client):
    """Test portfolio payback when properties exist but no valuations."""
    app = client.application
    portfolio_id = str(uuid.uuid4())
    with app.app_context():
        prop = Property(id=str(uuid.uuid4()), address=f"789 Empty St {uuid.uuid4().hex[:8]}", postcode="TEST2 2BB", portfolio_id=portfolio_id)
        db.session.add(prop)
        db.session.commit()
    resp = client.get(f"/api/portfolios/{portfolio_id}/payback")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data

def test_valuation_payback_positive(client, sample_valuation):
    """Test individual valuation payback period."""
    resp = client.get(f"/api/valuations/{sample_valuation}/payback")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "simple_payback" in data
    assert "discounted_payback" in data
    # Should have some value since sample_valuation has reasonable cash flows
    assert data["simple_payback"] is not None or data["discounted_payback"] is not None

def test_valuation_payback_not_found(client):
    """Test valuation payback when valuation doesn't exist."""
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/valuations/{fake_id}/payback")
    assert resp.status_code == 404

def _get_last_sse_event(response):
    data = response.get_data(as_text=True)
    events = [line for line in data.split('data: ') if line.strip()]
    for event in reversed(events):
        try:
            payload = json.loads(event.strip().split('\n')[0])
            if payload.get('done'):
                return payload
        except Exception:
            continue
    return None

def test_monte_carlo_endpoint(client):
    """Test that the Monte Carlo endpoint works correctly."""
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
    client.post("/api/properties", json={"address": "123 Test St", "postcode": "TEST3 3CC"})
    monte_carlo_data = {
        "num_simulations": 1000,
        "annual_rent_growth": {"distribution": "normal", "mean": 2, "stddev": 1},
        "discount_rate": {"distribution": "normal", "mean": 15, "stddev": 2},
        "interest_rate": {"distribution": "normal", "mean": 5, "stddev": 1},
        **{k: v for k, v in valuation_data.items() if k not in ["annual_rent_growth", "discount_rate", "interest_rate"]}
    }
    response = client.post("/api/valuations/monte-carlo", json=monte_carlo_data)
    assert response.status_code == 200
    payload = _get_last_sse_event(response)
    assert payload is not None
    assert "npvs" in payload
    assert "irrs" in payload
    assert "summary" in payload
    assert len(payload["npvs"]) == 1000
    assert len(payload["irrs"]) == 1000
    assert payload["summary"]["npv_mean"] is not None
    assert payload["summary"]["irr_mean"] is not None
    assert payload["summary"]["probability_npv_positive"] is not None

def test_rental_analysis_endpoint(client):
    """Test that the rental analysis endpoint works correctly and all metrics are accurate."""
    rental_data = {
        "initial_investment": 400000,
        "annual_rental_income": 36000,
        "property_tax": 4800,
        "insurance": 1200,
        "maintenance": 2400,
        "management_fees": 10,
        "interest_rate": 5,
        "ltv": 80,
        "transaction_costs": 5000,
        "capex": 1200,
    }

    response = client.post("/api/valuations/rental-analysis", json=rental_data)
    assert response.status_code == 200
    data = response.get_json()

    monthly = data["monthly_breakdown"]

    # The backend's calculate_rental_metrics already includes CapEx in monthly_cash_flow
    # So we expect the returned cash_flow to match the sum of all components
    expected_cash_flow = (
        monthly["effective_rental_income"]
        - (
            monthly["mortgage_payment"]
            + monthly["property_tax"]
            + monthly["insurance"]
            + monthly["maintenance"]
            + monthly["property_management"]
            + monthly["capex"]
        )
    )
    
    # Use a small tolerance for floating point precision
    assert abs(monthly["cash_flow"] - expected_cash_flow) < 0.01, f"Cash flow mismatch: expected {expected_cash_flow}, got {monthly['cash_flow']}"
    assert "capex" in monthly
    assert monthly["capex"] == 100  # 1200/12 = 100

def test_monte_carlo_irr_valid(client):
    """Test that the Monte Carlo endpoint returns valid IRR when cash flows cross zero."""
    valuation_data = {
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
        "ltv": 0,
        "interest_rate": 0,
    }
    mc_data = {
        "num_simulations": 1000,
        "annual_rent_growth": {"distribution": "normal", "mean": 0, "stddev": 1},
        "discount_rate": {"distribution": "normal", "mean": 10, "stddev": 2},
        "interest_rate": {"distribution": "normal", "mean": 0, "stddev": 1},
        **{k: v for k, v in valuation_data.items() if k not in ["annual_rent_growth", "discount_rate", "interest_rate"]}
    }
    response = client.post("/api/valuations/monte-carlo", json=mc_data)
    assert response.status_code == 200
    payload = _get_last_sse_event(response)
    assert payload is not None
    summary = payload["summary"]
    assert summary["irr_mean"] is not None
    assert summary["npv_mean"] > 0

def test_valuation_with_vacancy_rate(client):
    """Test that valuation API correctly handles vacancy rate."""
    # Create property
    property_response = client.post("/api/properties", json={"address": "123 Vacancy Test St", "postcode": "TEST5 5EE"})
    property_id = property_response.json["data"]["id"]
    
    # Create valuation with vacancy rate
    valuation_data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "vacancy_rate": 8,  # 8% vacancy
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
    
    valuation_response = client.post(f"/api/properties/{property_id}/valuation", json=valuation_data)
    assert valuation_response.status_code == 201
    
    # Get cash flows and verify vacancy rate is applied
    cash_flows_response = client.get(f"/api/valuations/{valuation_response.json['data']['id']}/cashflows")
    assert cash_flows_response.status_code == 200
    
    cash_flows = cash_flows_response.json["cashFlows"]  # Access the cashFlows field
    first_year = cash_flows[1]  # Year 1 (index 1, since index 0 is year 0)
    
    # Check that both gross and effective revenue are present
    assert "gross_rent" in first_year
    assert "effective_rent" in first_year
    assert "vacancy_loss" in first_year
    
    # Verify calculations
    expected_gross = 24000 * (1 + 2/100) ** 0  # No growth in year 1
    expected_effective = expected_gross * (1 - 8/100)  # 8% vacancy
    
    assert abs(first_year["gross_rent"] - expected_gross) < 0.01
    assert abs(first_year["effective_rent"] - expected_effective) < 0.01

def test_rental_analysis_with_vacancy_rate(client):
    """Test that rental analysis API correctly handles vacancy rate."""
    rental_data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "vacancy_rate": 10,  # 10% vacancy
        "ltv": 80,
        "interest_rate": 5,
        "property_tax": 6000,
        "insurance": 300,
        "maintenance": 1000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "holding_period": 25,
        "capex": 1200,  # Add CapEx
    }
    
    response = client.post("/api/valuations/rental-analysis", json=rental_data)
    assert response.status_code == 200
    
    data = response.json
    
    # Check that both gross and effective rental income are returned
    assert "gross_rental_income" in data["monthly_breakdown"]
    assert "effective_rental_income" in data["monthly_breakdown"]
    assert "capex" in data["monthly_breakdown"]
    
    # Check that vacancy rate is properly applied
    gross_monthly = data["monthly_breakdown"]["gross_rental_income"]
    effective_monthly = data["monthly_breakdown"]["effective_rental_income"]
    expected_effective = gross_monthly * 0.9  # 10% vacancy
    assert abs(effective_monthly - expected_effective) < 0.01
    
    # Check that CapEx is included
    assert data["monthly_breakdown"]["capex"] == 100  # 1200/12 = 100

def test_monte_carlo_with_vacancy_rate(client):
    """Test that Monte Carlo API correctly handles vacancy rate."""
    property_response = client.post("/api/properties", json={"address": "456 MC Vacancy Test St", "postcode": "TEST6 6FF"})
    property_id = property_response.json["data"]["id"]
    valuation_data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "vacancy_rate": 5,
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
    valuation_response = client.post(f"/api/properties/{property_id}/valuation", json=valuation_data)
    mc_data = {
        "valuation_id": valuation_response.json["data"]["id"],
        "num_simulations": 1000,
        "annual_rent_growth": {"distribution": "normal", "mean": 2, "stddev": 1},
        "discount_rate": {"distribution": "normal", "mean": 15, "stddev": 2},
        "interest_rate": {"distribution": "normal", "mean": 5, "stddev": 1},
        **{k: v for k, v in valuation_data.items() if k not in ["annual_rent_growth", "discount_rate", "interest_rate"]}
    }
    mc_response = client.post("/api/valuations/monte-carlo", json=mc_data)
    assert mc_response.status_code == 200
    payload = _get_last_sse_event(mc_response)
    assert payload is not None
    assert "npvs" in payload
    assert "irrs" in payload
    assert "summary" in payload
    assert len(payload["npvs"]) == 1000
    assert len(payload["irrs"]) == 1000
    assert payload["summary"]["npv_mean"] is not None
    assert payload["summary"]["irr_mean"] is not None
    assert payload["summary"]["probability_npv_positive"] is not None 

def test_monte_carlo_gaussian_and_pareto_regression(client):
    """Regression test: Monte Carlo endpoint works for both Gaussian (Normal) and Pareto (Power-law) distributions, streams progress, and returns valid results."""
    valuation_data = {
        "initial_investment": 100000,
        "annual_rental_income": 20000,
        "service_charge": 1000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 2000,
        "insurance": 300,
        "management_fees": 10,
        "transaction_costs": 2000,
        "annual_rent_growth": 2,
        "discount_rate": 8,
        "holding_period": 5,
        "ltv": 0,
        "interest_rate": 0,
    }
    for dist, dist_label in [("normal", "Gaussian (Normal)"), ("pareto", "Pareto (Power-law)")]:
        body = {
            **valuation_data,
            "num_simulations": 100,
            "annual_rent_growth": {"distribution": dist, "mean": 2, "stddev": 1, "shape": 2.5},
            "discount_rate": {"distribution": dist, "mean": 8, "stddev": 2, "shape": 2.5},
            "interest_rate": {"distribution": dist, "mean": 0, "stddev": 0, "shape": 2.5},
        }
        response = client.post("/api/valuations/monte-carlo", json=body)
        assert response.status_code == 200, f"{dist_label} simulation failed"
        payload = _get_last_sse_event(response)
        assert payload is not None, f"No SSE payload for {dist_label}"
        assert "npvs" in payload and "irrs" in payload and "summary" in payload, f"Missing results for {dist_label}"
        assert len(payload["npvs"]) == 100, f"Wrong NPV count for {dist_label}"
        assert len(payload["irrs"]) == 100, f"Wrong IRR count for {dist_label}"
        summary = payload["summary"]
        assert summary["npv_mean"] is not None, f"No NPV mean for {dist_label}"
        assert summary["irr_mean"] is not None, f"No IRR mean for {dist_label}"
        assert summary["probability_npv_positive"] is not None, f"No probability for {dist_label}" 

def test_validate_fields_success():
    """Test validate_fields utility with valid data."""
    data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "maintenance": 1000,
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
        "service_charge": 3000,  # optional
        "ground_rent": 500,      # optional
    }
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
    ]
    is_valid, cleaned = validate_fields(data, required_fields, optional_fields)
    assert is_valid is True
    assert cleaned["initial_investment"] == 200000
    assert cleaned["annual_rental_income"] == 24000
    assert cleaned["service_charge"] == 3000
    assert cleaned["ground_rent"] == 500

def test_validate_fields_missing_required():
    """Test validate_fields utility with missing required field."""
    data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        # missing maintenance
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
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
    is_valid, error = validate_fields(data, required_fields)
    assert is_valid is False
    assert "Maintenance is required" in error

def test_validate_fields_wrong_type():
    """Test validate_fields utility with wrong data type."""
    data = {
        "initial_investment": "not a number",
        "annual_rental_income": 24000,
        "maintenance": 1000,
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
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
    is_valid, error = validate_fields(data, required_fields)
    assert is_valid is False
    assert "Initial investment is required and must be a int, float." in error

def test_validate_fields_negative_value():
    """Test validate_fields utility with negative value."""
    data = {
        "initial_investment": -1000,  # negative value
        "annual_rental_income": 24000,
        "maintenance": 1000,
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
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
    is_valid, error = validate_fields(data, required_fields)
    assert is_valid is False
    assert "Initial investment must be >= 0." in error

def test_validate_fields_string_min_length():
    """Test validate_fields utility with string minimum length validation."""
    data = {
        "address": "123",  # too short
        "postcode": "AB1 2CD",
    }
    required_fields = [
        ("address", str, 5),  # minimum 5 characters
        ("postcode", str, 1),
    ]
    is_valid, error = validate_fields(data, required_fields)
    assert is_valid is False
    assert "Address must be at least 5 characters." in error

def test_populate_model_from_data(client, app):
    """Test populate_model_from_data utility."""
    with app.app_context():
        from app import Valuation
        valuation = Valuation(id=str(uuid.uuid4()), created_at=datetime.now(timezone.utc).isoformat())
        data = {
            "initial_investment": 200000,
            "annual_rental_income": 24000,
            "maintenance": 1000,
            "service_charge": 3000,
        }
        fields = ["initial_investment", "annual_rental_income", "maintenance", "service_charge"]
        result = populate_model_from_data(valuation, data, fields)
        assert result.initial_investment == 200000
        assert result.annual_rental_income == 24000
        assert result.maintenance == 1000
        assert result.service_charge == 3000
        # Fields not in the fields list should not be set (SQLAlchemy defaults to None)
        assert getattr(result, "property_tax", None) is None

def test_valuation_creation_with_new_utilities(client):
    """Test valuation creation endpoint with new utilities."""
    data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "maintenance": 1000,
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
        "service_charge": 3000,  # optional
        "ground_rent": 500,      # optional
    }
    response = client.post("/api/valuations", json=data)
    assert response.status_code == 201
    result = response.get_json()["data"]
    assert result["initial_investment"] == 200000
    assert result["annual_rental_income"] == 24000
    assert result["service_charge"] == 3000
    assert result["ground_rent"] == 500

def test_valuation_creation_missing_required(client):
    """Test valuation creation with missing required field."""
    data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        # missing maintenance
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
    }
    response = client.post("/api/valuations", json=data)
    assert response.status_code == 400
    result = response.get_json()
    assert "error" in result
    assert "Maintenance is required" in result["error"]

def test_property_creation_with_new_utilities(client):
    """Test property creation endpoint with new utilities."""
    data = {
        "address": "123 Test Street",
        "postcode": "TEST1 1AA",
        "listing_link": "https://example.com/listing",  # optional
    }
    response = client.post("/api/properties", json=data)
    assert response.status_code == 201
    result = response.get_json()["data"]
    assert result["address"] == "123 Test Street"
    assert result["postcode"] == "TEST1 1AA"
    assert result["listing_link"] == "https://example.com/listing"

def test_property_creation_missing_required(client):
    """Test property creation with missing required field."""
    data = {
        "address": "123 Test Street",
        # missing postcode
    }
    response = client.post("/api/properties", json=data)
    assert response.status_code == 400
    result = response.get_json()
    assert "error" in result
    assert "Postcode is required" in result["error"]

def test_valuation_update_with_new_utilities(client, sample_valuation):
    """Test valuation update endpoint with new utilities."""
    data = {
        "initial_investment": 250000,  # updated value
        "annual_rental_income": 24000,
        "maintenance": 1000,
        "property_tax": 6000,
        "management_fees": 12,
        "transaction_costs": 3000,
        "annual_rent_growth": 2,
        "discount_rate": 15,
        "holding_period": 25,
        "service_charge": 3500,  # updated optional field
    }
    response = client.put(f"/api/valuations/{sample_valuation}", json=data)
    assert response.status_code == 200
    result = response.get_json()["data"]
    assert result["initial_investment"] == 250000
    assert result["service_charge"] == 3500

def test_property_update_with_new_utilities(client, sample_property):
    """Test property update endpoint with new utilities."""
    data = {
        "address": "456 Updated Street",
        "postcode": "TEST2 2BB",
        "listing_link": "https://example.com/updated-listing",
    }
    response = client.put(f"/api/properties/{sample_property}", json=data)
    assert response.status_code == 200
    result = response.get_json()["data"]
    assert result["address"] == "456 Updated Street"
    assert result["postcode"] == "TEST2 2BB"
    assert result["listing_link"] == "https://example.com/updated-listing" 

def test_library_upload_list_view_delete(client, app):
    # Create a small in-memory PDF file
    pdf_bytes = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
    data = {
        'file': (io.BytesIO(pdf_bytes), 'test.pdf'),
        'title': 'Test PDF'
    }
    # Upload PDF
    resp = client.post('/api/library', data=data, content_type='multipart/form-data')
    assert resp.status_code == 201
    item = resp.get_json()
    assert item['title'] == 'Test PDF'
    item_id = item['id']

    # List PDFs
    resp = client.get('/api/library')
    assert resp.status_code == 200
    items = resp.get_json()
    assert any(i['id'] == item_id for i in items)

    # View PDF
    resp = client.get(f'/api/library/{item_id}/view')
    assert resp.status_code == 200
    assert resp.data.startswith(b'%PDF')
    assert resp.mimetype == 'application/pdf'

    # Delete PDF
    resp = client.delete(f'/api/library/{item_id}')
    assert resp.status_code == 200
    # Confirm deletion
    resp = client.get('/api/library')
    items = resp.get_json()
    assert not any(i['id'] == item_id for i in items) 