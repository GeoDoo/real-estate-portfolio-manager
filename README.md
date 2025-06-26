# Real Estate Portfolio Manager

A Next.js application for managing real estate investments with DCF (Discounted Cash Flow) valuation tools.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Structure

- `src/backend/` — Python Flask backend for DCF/NPV calculations (mathematically precise)
- `src/app/` — Next.js/React frontend for UI display

## Backend (Python/Flask)

1. **Setup**
   ```sh
   cd src/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Run the backend**
   ```sh
   python app.py
   ```
   The API will be available at `http://localhost:5000/api/dcf`.

3. **API Usage**
   - POST JSON to `/api/dcf` with DCF input fields:
     ```json
     {
       "initial_investment": 200000,
       "annual_rental_income": 20000,
       "service_charge": 3000,
       "ground_rent": 500,
       "maintenance": 1000,
       "property_tax": 6000,
       "insurance": 300,
       "management_fees": 12,
       "one_time_expenses": 0,
       "cash_flow_growth_rate": 2,
       "discount_rate": 15,
       "holding_period": 25
     }
     ```
   - Response: `{ "cashFlows": [ ... ] }`

## Frontend (Next.js/React)

1. **Setup**
   ```sh
   npm install
   npm run dev
   ```

2. **Usage**
   - The frontend will fetch DCF results from the Python backend and display them.
   - Make sure the backend is running before using the UI.

---

**All DCF/NPV calculations are now handled in Python for mathematical precision.**
