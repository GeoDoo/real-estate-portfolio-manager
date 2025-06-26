"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DCFRow } from '@/types/dcf';
import { calculateCashFlows } from '@/dcf-utils';

type CashFlowRow = {
  year: number;
  revenue: number;
  totalExpenses: number;
  netCashFlow: number;
  presentValue: number;
  cumulativePV: number;
};

export default function ValuationDetailsPage() {
  const { id } = useParams();
  const [valuation, setValuation] = useState<DCFRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id || typeof id !== 'string') {
        setError('Invalid ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/valuations/${id}`);
        const json = await res.json();
        if (json.success) {
          setValuation(json.data);
        } else {
          setError('Not found');
        }
      } catch {
        setError('Not found');
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const cashFlows: CashFlowRow[] = valuation ? calculateCashFlows(valuation) : [];

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Valuation Results</h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : valuation ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Valuation Details</h2>
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">ID:</span> <span className="font-mono">{valuation.id}</span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Created:</span> {valuation.created_at}
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6">Cash Flow Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Year</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Revenue ($)</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Total Expenses ($)</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Net Cash Flow ($)</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Present Value ($)</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Cumulative PV ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlows.map((row, index) => (
                    <tr key={index} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                      <td className="py-3 px-2 font-medium">{row.year}</td>
                      <td className="py-3 px-2 text-right">{row.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-2 text-right">{row.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className={`py-3 px-2 text-right font-medium ${row.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.netCashFlow.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className={`py-3 px-2 text-right ${row.presentValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.presentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td className={`py-3 px-2 text-right font-medium ${row.cumulativePV >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.cumulativePV.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
} 