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

### 3. Environment Configuration (Optional)

For production or custom setups, create environment files:

**Frontend** (create `frontend/.env.local`):
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

**Backend** (set environment variables):
```bash
export FRONTEND_URL=http://localhost:3000
```

## 📊 Features

- **Mathematically Exact DCF Calculations**: Uses Python's `Fraction` module for precision
- **26-Year Cash Flow Projections**: Complete DCF breakdown for years 0-25
- **Persistent Storage**: SQLite database for saving valuations
- **Modern UI**: Clean, responsive Next.js interface
- **RESTful API**: Full CRUD operations for valuations
- **Dynamic Configuration**: Environment-based API URLs and CORS settings
- **Smart Breadcrumbs**: Route-based navigation with dynamic generation

## 🔧 API Endpoints

- `GET/POST /api/properties` - List/create properties
- `GET /api/properties/<id>` - Get specific property
- `GET/PUT /api/properties/<id>/valuation` - Get/update property valuation
- `POST /api/cashflows/calculate` - Ad-hoc DCF calculation
- `POST /api/cashflows/irr` - Calculate IRR from cash flows

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
│   │   ├── config.ts       # Centralized configuration
│   │   ├── Breadcrumbs.tsx # Dynamic breadcrumb component
│   │   └── ...             # Other components
│   ├── package.json        # Node.js dependencies
│   └── types/              # TypeScript type definitions
└── README.md
```

## 🎯 Key Improvements

- **No Hardcoded Values**: All API URLs and configuration use environment variables
- **Dynamic Breadcrumbs**: Automatically generated from current route
- **Type Safety**: Proper TypeScript typing throughout
- **Consistent UI**: Modern, responsive design with proper spacing
- **Scalable Architecture**: Easy to deploy to different environments

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
