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
    
    # Create property and valuation
    property_response = client.post("/api/properties", json={"address": "123 Test St"})
    property_id = property_response.json["id"]
    
    valuation_response = client.post(f"/api/properties/{property_id}/valuation", json=valuation_data)
    valuation_id = valuation_response.json["id"]
    
    # Test Monte Carlo with smaller number for speed
    monte_carlo_data = {
        "num_simulations": 1000,  # Smaller number for testing
        "annual_rent_growth": {"distribution": "normal", "mean": 2, "stddev": 1},
        "discount_rate": {"distribution": "normal", "mean": 15, "stddev": 2},
        "interest_rate": {"distribution": "normal", "mean": 5, "stddev": 1},
        **{k: v for k, v in valuation_data.items() if k not in ["annual_rent_growth", "discount_rate", "interest_rate"]}
    }
    
    response = client.post("/api/valuations/monte-carlo", json=monte_carlo_data)
    assert response.status_code == 200
    
    data = response.get_json()
    assert "npv_results" in data
    assert "irr_results" in data
    assert "summary" in data
    
    summary = data["summary"]
    assert "npv_mean" in summary
    assert "irr_mean" in summary
    assert "probability_npv_positive" in summary
    
    # Check that we got the expected number of results
    assert len(data["npv_results"]) == 1000
    assert len(data["irr_results"]) == 1000

def test_rental_analysis_endpoint(client):
    """Test that the rental analysis endpoint works correctly and all metrics are accurate."""
    # Test data for rental analysis
    rental_data = {
        "initial_investment": 400000,
        "annual_rental_income": 36000,  # $3,000/month
        "property_tax": 4800,  # $400/month
        "insurance": 1200,  # $100/month
        "maintenance": 2400,  # $200/month
        "management_fees": 10,  # 10% of rent
        "interest_rate": 5,
        "ltv": 80,  # 80% loan-to-value
        "transaction_costs": 5000,
    }
    
    response = client.post("/api/valuations/rental-analysis", json=rental_data)
    assert response.status_code == 200
    data = response.get_json()
    
    # Check that all required fields are present
    assert "metrics" in data
    assert "monthly_breakdown" in data
    assert "annual_breakdown" in data
    assert "loan_details" in data
    
    # Extract values
    metrics = data["metrics"]
    monthly = data["monthly_breakdown"]
    annual = data["annual_breakdown"]
    loan = data["loan_details"]
    
    # Hand-calculated expected values
    purchase_price = 400000
    annual_rent = 36000
    monthly_rent = 3000
    ltv = 0.8
    interest_rate = 0.05
    property_tax = 400
    insurance = 100
    maintenance = 200
    management_fees = 0.10 * monthly_rent  # $300
    transaction_costs = 5000
    loan_amount = purchase_price * ltv  # 320,000
    down_payment = purchase_price - loan_amount  # 80,000
    monthly_rate = interest_rate / 12
    num_payments = 25 * 12  # Use default holding period of 25 years
    monthly_mortgage = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    monthly_expenses = monthly_mortgage + property_tax + insurance + maintenance + management_fees
    monthly_cash_flow = monthly_rent - monthly_expenses
    annual_cash_flow = monthly_cash_flow * 12
    total_investment = down_payment + transaction_costs
    roi = (annual_cash_flow / total_investment) * 100
    annual_expenses_no_mortgage = (property_tax + insurance + maintenance + management_fees) * 12
    net_operating_income = annual_rent - annual_expenses_no_mortgage
    cap_rate = (net_operating_income / purchase_price) * 100
    cash_on_cash = roi
    break_even_rent = monthly_expenses
    rent_coverage_ratio = monthly_rent / monthly_expenses
    
    # Assert values (allowing for small floating point error)
    assert abs(monthly["cash_flow"] - monthly_cash_flow) < 0.1
    assert abs(metrics["annual_cash_flow"] - annual_cash_flow) < 1
    assert abs(metrics["roi_percent"] - roi) < 0.01
    assert abs(metrics["cap_rate_percent"] - cap_rate) < 0.01
    assert abs(metrics["cash_on_cash_percent"] - cash_on_cash) < 0.01
    assert abs(metrics["break_even_rent"] - break_even_rent) < 0.1
    assert abs(metrics["rent_coverage_ratio"] - rent_coverage_ratio) < 0.01
    # Also check loan details
    assert abs(loan["loan_amount"] - loan_amount) < 1
    assert abs(loan["down_payment"] - down_payment) < 1
    assert abs(loan["monthly_mortgage"] - monthly_mortgage) < 0.1
    assert abs(loan["total_investment"] - total_investment) < 1
    # And monthly breakdown
    assert abs(monthly["gross_rental_income"] - monthly_rent) < 0.01
    assert abs(monthly["effective_rental_income"] - monthly_rent) < 0.01  # No vacancy in test
    assert abs(monthly["mortgage_payment"] - monthly_mortgage) < 0.01
    assert abs(monthly["property_tax"] - property_tax) < 0.01
    assert abs(monthly["insurance"] - insurance) < 0.01
    assert abs(monthly["maintenance"] - maintenance) < 0.01
    assert abs(monthly["property_management"] - management_fees) < 0.01
    assert abs(monthly["total_expenses"] - monthly_expenses) < 0.01
    assert abs(monthly["cash_flow"] - monthly_cash_flow) < 0.01

def test_monte_carlo_irr_valid(client):
    """Test that the Monte Carlo endpoint returns valid IRR when cash flows cross zero."""
    # Create a test valuation with strong positive cash flows
    valuation_data = {
        "initial_investment": 100000,
        "annual_rental_income": 70000,  # Large enough to ensure positive cash flows
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
    # Create property and valuation
    property_response = client.post("/api/properties", json={"address": "999 IRR Test St"})
    property_id = property_response.json["id"]
    client.post(f"/api/properties/{property_id}/valuation", json=valuation_data)
    # Monte Carlo input
    monte_carlo_data = {
        "num_simulations": 100,
        "annual_rent_growth": {"distribution": "normal", "mean": 0, "stddev": 0},
        "discount_rate": {"distribution": "normal", "mean": 10, "stddev": 0},
        "interest_rate": {"distribution": "normal", "mean": 0, "stddev": 0},
        **{k: v for k, v in valuation_data.items() if k not in ["annual_rent_growth", "discount_rate", "interest_rate"]}
    }
    response = client.post("/api/valuations/monte-carlo", json=monte_carlo_data)
    assert response.status_code == 200
    data = response.get_json()
    summary = data["summary"]
    # There should be valid IRR scenarios
    assert summary["percent_valid_irr"] > 0, f"Expected >0% valid IRR scenarios, got {summary['percent_valid_irr']}%"
    assert summary["mean_valid_irr"] is not None, "mean_valid_irr should not be None when valid scenarios exist"
    assert summary["mean_valid_irr"] > 0, f"Expected positive mean_valid_irr, got {summary['mean_valid_irr']}"

def test_valuation_with_vacancy_rate(client):
    """Test that valuation API correctly handles vacancy rate."""
    # Create property
    property_response = client.post("/api/properties", json={"address": "123 Vacancy Test St"})
    property_id = property_response.json["id"]
    
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
    cash_flows_response = client.get(f"/api/valuations/{valuation_response.json['id']}/cashflows")
    assert cash_flows_response.status_code == 200
    
    cash_flows = cash_flows_response.json["cashFlows"]  # Access the cashFlows field
    first_year = cash_flows[1]  # Year 1 (index 1, since index 0 is year 0)
    
    # Check that both gross and effective revenue are present
    assert "gross_revenue" in first_year
    assert "effective_revenue" in first_year
    
    # Verify calculations
    expected_gross = 24000 * (1 + 2/100) ** 0  # No growth in year 1
    expected_effective = expected_gross * (1 - 8/100)  # 8% vacancy
    
    assert abs(first_year["gross_revenue"] - expected_gross) < 0.01
    assert abs(first_year["effective_revenue"] - expected_effective) < 0.01

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
    }
    
    response = client.post("/api/valuations/rental-analysis", json=rental_data)
    assert response.status_code == 200
    
    data = response.json
    
    # Check that both gross and effective rental income are returned
    assert "gross_rental_income" in data["monthly_breakdown"]
    assert "effective_rental_income" in data["monthly_breakdown"]
    assert "gross_rental_income" in data["annual_breakdown"]
    assert "effective_rental_income" in data["annual_breakdown"]
    
    # Verify calculations
    expected_gross_monthly = 24000 / 12
    expected_effective_monthly = expected_gross_monthly * (1 - 10/100)
    
    assert abs(data["monthly_breakdown"]["gross_rental_income"] - expected_gross_monthly) < 0.01
    assert abs(data["monthly_breakdown"]["effective_rental_income"] - expected_effective_monthly) < 0.01
    
    # Cash flow should be based on effective rent
    assert data["monthly_breakdown"]["cash_flow"] == data["monthly_breakdown"]["effective_rental_income"] - data["monthly_breakdown"]["total_expenses"]

def test_monte_carlo_with_vacancy_rate(client):
    """Test that Monte Carlo API correctly handles vacancy rate."""
    # Create property and valuation with vacancy rate
    property_response = client.post("/api/properties", json={"address": "456 MC Vacancy Test St"})
    property_id = property_response.json["id"]
    
    valuation_data = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "vacancy_rate": 5,  # 5% vacancy
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
    valuation_id = valuation_response.json["id"]
    
    # Run Monte Carlo simulation
    mc_data = {
        "valuation_id": valuation_id,
        "num_simulations": 1000,
        "distributions": {
            "annual_rent_growth": {
                "distribution": "normal",
                "mean": 2,
                "stddev": 1
            },
            "discount_rate": {
                "distribution": "normal", 
                "mean": 15,
                "stddev": 2
            }
        }
    }
    
    mc_response = client.post("/api/valuations/monte-carlo", json=mc_data)
    assert mc_response.status_code == 200
    
    mc_results = mc_response.json
    
    # Check that results are reasonable
    assert "npv_results" in mc_results
    assert "irr_results" in mc_results
    assert "summary" in mc_results
    assert len(mc_results["npv_results"]) == 1000
    assert len(mc_results["irr_results"]) == 1000
    
    # NPV should be finite and reasonable
    npvs = mc_results["npv_results"]
    assert all(math.isfinite(n) for n in npvs)
    assert mc_results["summary"]["npv_mean"] is not None 