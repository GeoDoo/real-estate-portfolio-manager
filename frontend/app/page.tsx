"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DCFRow } from '../types/dcf';
import { EyeIcon, PlusIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const [valuations, setValuations] = useState<DCFRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:8000/api/valuations', {
          credentials: 'include'
        });
        if (!res.ok) {
          setError('Failed to fetch valuations');
          setValuations([]);
          setLoading(false);
          return;
        }
        const json = await res.json();
        setValuations(Array.isArray(json) ? json : []);
      } catch {
        setError('Failed to fetch valuations');
        setValuations([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const createNewScenario = async (baseValuation: DCFRow) => {
    try {
      const newValuation = {
        initial_investment: baseValuation.initial_investment,
        annual_rental_income: baseValuation.annual_rental_income,
        service_charge: baseValuation.service_charge,
        ground_rent: baseValuation.ground_rent,
        maintenance: baseValuation.maintenance,
        property_tax: baseValuation.property_tax,
        insurance: baseValuation.insurance,
        management_fees: baseValuation.management_fees,
        one_time_expenses: baseValuation.one_time_expenses,
        cash_flow_growth_rate: baseValuation.cash_flow_growth_rate,
        discount_rate: baseValuation.discount_rate,
        holding_period: baseValuation.holding_period,
      };

      const res = await fetch('http://localhost:8000/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newValuation),
      });

      if (res.ok) {
        const newValuationData = await res.json();
        // Redirect to the new valuation for editing
        window.location.href = `/valuations/${newValuationData.id}`;
      } else {
        setError('Failed to create new scenario');
      }
    } catch {
      setError('Failed to create new scenario');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-left">Saved Valuations</h1>
          {valuations.length > 1 && (
            <Link
              href="/valuations/compare"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Compare Valuations
            </Link>
          )}
        </div>
        
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : valuations.length === 0 ? (
          <div className="text-center text-gray-500">No valuations found.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1400px] w-full text-sm bg-white rounded-lg shadow-md">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 whitespace-nowrap sticky left-0 z-10 bg-white border-r border-gray-200 text-center align-middle shadow-md">Actions</th>
                  <th className="py-3 px-4 whitespace-nowrap">ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Created At</th>
                  <th className="py-3 px-4 whitespace-nowrap">Initial Investment ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Annual Rental Income ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Service Charge ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Ground Rent ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Maintenance ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Property Tax ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Insurance ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Management Fees (%)</th>
                  <th className="py-3 px-4 whitespace-nowrap">One-time Expenses ($)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Growth Rate (%)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Discount Rate (%)</th>
                  <th className="py-3 px-4 whitespace-nowrap">Holding Period</th>
                </tr>
              </thead>
              <tbody>
                {valuations.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                    <td className="py-2 px-4 sticky left-0 z-10 bg-white border-r border-gray-200 text-center align-middle shadow-md">
                      <div className="flex space-x-2 justify-center">
                        <Link
                          href={`/valuations/${row.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow text-blue-600 transition"
                          title="View details"
                        >
                          <EyeIcon className="w-4 h-4" aria-hidden="true" />
                          <span className="sr-only">View</span>
                        </Link>
                        <button
                          onClick={() => createNewScenario(row)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-green-200 hover:border-green-400 hover:bg-green-50 hover:shadow text-green-600 transition"
                          title="Create new scenario"
                        >
                          <PlusIcon className="w-4 h-4" aria-hidden="true" />
                          <span className="sr-only">New Scenario</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-4 font-mono text-xs">{row.id.substring(0, 8)}...</td>
                    <td className="py-2 px-4">{row.created_at}</td>
                    <td className="py-2 px-4">{row.initial_investment}</td>
                    <td className="py-2 px-4">{row.annual_rental_income}</td>
                    <td className="py-2 px-4">{row.service_charge}</td>
                    <td className="py-2 px-4">{row.ground_rent}</td>
                    <td className="py-2 px-4">{row.maintenance}</td>
                    <td className="py-2 px-4">{row.property_tax}</td>
                    <td className="py-2 px-4">{row.insurance}</td>
                    <td className="py-2 px-4">{row.management_fees}%</td>
                    <td className="py-2 px-4">{row.one_time_expenses}</td>
                    <td className="py-2 px-4">{row.cash_flow_growth_rate}</td>
                    <td className="py-2 px-4">{row.discount_rate}</td>
                    <td className="py-2 px-4">{row.holding_period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
} 