# Real Estate Portfolio Manager

## Backend

- Install dependencies:
  ```sh
  ./backend/venv/bin/pip install -r backend/requirements.txt
  ```
- Init database:
  ```sh
  ./backend/venv/bin/python backend/run.py initdb
  ```
- Run server:
  ```sh
  ./backend/venv/bin/python backend/run.py dev
  ```
- Run tests:
  ```sh
  ./backend/venv/bin/python backend/run.py test
  # If you see 'ModuleNotFoundError: No module named app', run:
  PYTHONPATH=$(pwd) ./venv/bin/python -m pytest tests/
  ```
- CORS: All origins allowed for local dev. For production, edit `backend/app.py`.

## Frontend

- Install dependencies:
  ```sh
  cd frontend && npm install
  ```
- Run frontend:
  ```sh
  npm run dev
  ```

## Formulas & Financial Assumptions

This project uses industry-standard formulas for real estate investment analysis. All calculations are performed in the backend and are consistent across DCF, rental analysis, and Monte Carlo endpoints.

### Discounted Cash Flow (DCF) Model
- **Gross Rent (per year):**
  `gross_rent = annual_rental_income * (1 + annual_rent_growth/100) ** year`
- **Vacancy Loss:**
  `vacancy_loss = gross_rent * (vacancy_rate/100)`
- **Effective Rent:**
  `effective_rent = gross_rent - vacancy_loss`
- **Operating Expenses:**
  Sum of service charge, ground rent, maintenance, property tax, insurance, management fees, and CapEx (all annualized).
- **Net Operating Income (NOI):**
  `NOI = effective_rent - operating_expenses`
- **Net Cash Flow:**
  `net_cash_flow = NOI - mortgage_payment`
- **Discount Factor:**
  `discount_factor = 1 / (1 + discount_rate/100) ** year`
- **Present Value (PV):**
  `present_value = net_cash_flow * discount_factor`
- **Cumulative PV:**
  Sum of all present values up to the current year.

### Rental Analysis (Monthly Breakdown)
- **Gross Rental Income (monthly):**
  `gross_rental_income = annual_rental_income / 12`
- **Effective Rental Income:**
  `effective_rental_income = gross_rental_income * (1 - vacancy_rate/100)`
- **Management Fees:**
  `property_management = effective_rental_income * (management_fees/100)`
- **CapEx:**
  `capex = annual_capex / 12`
- **Monthly Cash Flow:**
  `cash_flow = effective_rental_income - (mortgage_payment + property_tax + insurance + maintenance + property_management + capex)`
- **ROI, Cap Rate, Cash-on-Cash:**
  Standard industry formulas using annualized values.

### Monte Carlo Simulation
- Runs thousands of DCF simulations with random variations in rent growth, discount rate, and interest rate (using normal or pareto distributions).
- All formulas are identical to the DCF model above, but vectorized for performance.
- Summary statistics include mean, percentiles, probability of positive NPV, and valid IRR scenarios.

### General Assumptions
- All monetary values are in the same currency (user input).
- CapEx is always included as a separate expense.
- Management fees are a percentage of effective (not gross) rent.
- Vacancy rate is applied to gross rent to get effective rent.
- Mortgage payment is calculated using the standard amortization formula.
- All calculations are robust to zero or missing values (treated as zero).
- Floating point rounding is handled with small tolerances in tests.

For any questions or to audit the formulas, see the backend code in `backend/app.py`.
