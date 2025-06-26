# Real Estate Portfolio Manager

A modern real estate investment portfolio manager with mathematically precise DCF (Discounted Cash Flow) calculations.

## 🏗️ Architecture

This is a **monorepo** with:
- **Backend**: Python Flask API with mathematically exact DCF/NPV calculations
- **Frontend**: Next.js/React UI with modern, responsive design
- **Database**: SQLite for persistent storage

## 🚀 Quick Start

### 1. Backend Setup (Python/Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will be available at `http://localhost:8000`

### 2. Frontend Setup (Next.js/React)

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:3000`

## 📊 Features

- **Mathematically Exact DCF Calculations**: Uses Python's `Fraction` module for precision
- **26-Year Cash Flow Projections**: Complete DCF breakdown for years 0-25
- **Persistent Storage**: SQLite database for saving valuations
- **Modern UI**: Clean, responsive Next.js interface
- **RESTful API**: Full CRUD operations for valuations

## 🔧 API Endpoints

- `GET/POST /api/valuations` - List/create valuations
- `GET/PUT/DELETE /api/valuations/<id>` - Get/update/delete specific valuation
- `GET /api/valuations/<id>/cashflows` - Get DCF breakdown for valuation
- `POST /api/cashflows/calculate` - Ad-hoc DCF calculation

## 📁 Project Structure

```
real-estate-portfolio-manager/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── test_dcf.py         # Mathematical verification tests
│   └── venv/               # Python virtual environment
├── frontend/               # Next.js frontend
│   ├── app/                # Next.js app directory
│   ├── package.json        # Node.js dependencies
│   └── ...
├── dcf_calculations.db     # SQLite database
└── README.md
```

## 🧮 Mathematical Precision

All DCF calculations use Python's `Fraction` module for exact arithmetic, ensuring:
- No floating-point errors
- Mathematically correct present values
- Excel-compatible results
- Comprehensive test coverage for all 26 years

## 🧪 Testing

```bash
cd backend
python -m pytest test_dcf.py -v
```

Tests verify mathematical correctness for all years (0-25) with hardcoded expected values.

## 🛠️ Development

- **Backend**: Python 3.12+, Flask, SQLAlchemy, SQLite
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Database**: SQLite with SQLAlchemy ORM

---

**Built with mathematical precision for real estate investment professionals.**
