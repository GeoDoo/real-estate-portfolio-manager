"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DCFRow } from '@/types/dcf';

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm bg-white rounded-lg shadow-md">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Created At</th>
                  <th className="py-3 px-2">Initial Investment</th>
                  <th className="py-3 px-2">Annual Rental Income</th>
                  <th className="py-3 px-2">Service Charge</th>
                  <th className="py-3 px-2">Ground Rent</th>
                  <th className="py-3 px-2">Maintenance</th>
                  <th className="py-3 px-2">Property Tax</th>
                  <th className="py-3 px-2">Insurance</th>
                  <th className="py-3 px-2">Management Fees</th>
                  <th className="py-3 px-2">One-time Expenses</th>
                  <th className="py-3 px-2">Growth Rate (%)</th>
                  <th className="py-3 px-2">Discount Rate (%)</th>
                  <th className="py-3 px-2">Holding Period</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {valuations.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">{row.id.substring(0, 8)}...</td>
                    <td className="py-2 px-2">{row.created_at}</td>
                    <td className="py-2 px-2">{row.initial_investment}</td>
                    <td className="py-2 px-2">{row.annual_rental_income}</td>
                    <td className="py-2 px-2">{row.service_charge}</td>
                    <td className="py-2 px-2">{row.ground_rent}</td>
                    <td className="py-2 px-2">{row.maintenance}</td>
                    <td className="py-2 px-2">{row.property_tax}</td>
                    <td className="py-2 px-2">{row.insurance}</td>
                    <td className="py-2 px-2">{row.management_fees}</td>
                    <td className="py-2 px-2">{row.one_time_expenses}</td>
                    <td className="py-2 px-2">{row.cash_flow_growth_rate}</td>
                    <td className="py-2 px-2">{row.discount_rate}</td>
                    <td className="py-2 px-2">{row.holding_period}</td>
                    <td className="py-2 px-2">
                      <Link
                        href={`/valuations/${row.id}`}
                        className="inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold shadow"
                      >
                        View
                      </Link>
                    </td>
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