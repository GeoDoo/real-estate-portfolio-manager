"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DCFRow } from '@/types/dcf';
import { EyeIcon } from '@heroicons/react/24/outline';

export default function ValuationsListPage() {
  const [valuations, setValuations] = useState<DCFRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/valuations');
        const json = await res.json();
        if (json.success) {
          setValuations(json.data);
        } else {
          setError('Failed to fetch valuations');
        }
      } catch {
        setError('Failed to fetch valuations');
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Saved Valuations</h1>
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
                      <Link
                        href={`/valuations/${row.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow text-blue-600 transition"
                        title="View details"
                      >
                        <EyeIcon className="w-4 h-4" aria-hidden="true" />
                        <span className="sr-only">View</span>
                      </Link>
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