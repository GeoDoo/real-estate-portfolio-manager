# Real Estate Portfolio Manager

A modern, full-stack real estate investment portfolio manager with mathematically precise DCF (Discounted Cash Flow) calculations and a clean, responsive UI.

## 🏗️ Architecture

- **Backend:** Python Flask API (exact DCF/NPV/IRR calculations, SQLite)
- **Frontend:** Next.js/React (TypeScript, Tailwind CSS)
- **Monorepo:** All code in one place for easy development and CI

## 🚀 Quick Start

### 1. Backend Setup (Python/Flask)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
API runs at: **http://localhost:5050**

### 2. Frontend Setup (Next.js/React)
```bash
cd frontend
npm install
npm run dev
```
UI runs at: **http://localhost:3000**

### 3. Environment Configuration (Optional)

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050
```
**Backend** (env var):
```
export FRONTEND_URL=http://localhost:3000
```

## 🧪 Testing & CI

- **Backend:**
  ```bash
  cd backend
  pytest
  ```
- **Frontend:**
  ```bash
  cd frontend
  npm run lint
  npm test
  ```
- **CI:**
  - GitHub Actions: Separate workflows for backend and frontend (see `.github/workflows/`)
  - All tests and linting must pass for a green build

## 🛠️ Development Notes
- **No hardcoded ports:** All config is via environment variables or config files
- **Husky:** Git hooks are managed with Husky (auto-installed on npm install)
- **Type safety:** TypeScript throughout the frontend
- **Modern tooltips:** Consistent, always-on-top tooltips using a shared React Portal component
- **DRY, KISS, YAGNI:** Codebase follows best practices for maintainability

## 📁 Project Structure
```
real-estate-portfolio-manager/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask app
│   ├── requirements.txt    # Python dependencies
│   └── tests/              # Backend tests
├── frontend/               # Next.js frontend
│   ├── app/                # App directory (components, features)
│   ├── package.json        # Node.js dependencies
│   └── types/              # TypeScript types
└── .github/workflows/      # CI workflows (backend & frontend)
```

## 📊 Features
- Mathematically exact DCF/NPV/IRR calculations
- 26-year cash flow projections
- Persistent storage (SQLite)
- Modern, responsive UI
- RESTful API (CRUD for properties, valuations)
- Config-driven ports and URLs
- Consistent, professional tooltips
- Robust, maintainable codebase

---
**Built for real estate investment professionals who demand precision and usability.**
