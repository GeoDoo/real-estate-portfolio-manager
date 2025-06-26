"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CashFlowRow, DCFRow } from '../../../types/dcf';

export default function ValuationDetailPage() {
  const { id } = useParams();
  const [valuation, setValuation] = useState<DCFRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>([]);
  const [irr, setIrr] = useState<number|null>(null);

  useEffect(() => {
    async function fetchValuation() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:8000/api/valuations/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          setError("Valuation not found");
          setValuation(null);
        } else {
          const json: DCFRow = await res.json();
          setValuation(json);
          // Fetch cash flows breakdown
          const cfRes = await fetch(`http://localhost:8000/api/valuations/${id}/cashflows`, {
            credentials: "include",
          });
          if (cfRes.ok) {
            const cfJson = await cfRes.json();
            setCashFlows(cfJson.cashFlows as CashFlowRow[] || []);
            // Fetch IRR if cash flows are available
            if (cfJson.cashFlows && cfJson.cashFlows.length > 1) {
              const netCashFlows = (cfJson.cashFlows as CashFlowRow[]).map((row) => row.netCashFlow);
              const irrRes = await fetch("http://localhost:8000/api/cashflows/irr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cash_flows: netCashFlows }),
              });
              if (irrRes.ok) {
                const irrJson = await irrRes.json();
                setIrr(irrJson.irr);
              } else {
                setIrr(null);
              }
            } else {
              setIrr(null);
            }
          } else {
            setCashFlows([]);
            setIrr(null);
          }
        }
      } catch {
        setError("Failed to fetch valuation");
        setValuation(null);
        setCashFlows([]);
        setIrr(null);
      }
      setLoading(false);
    }
    if (id) fetchValuation();
  }, [id]);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Valuation Details
        </h1>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : valuation ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            {cashFlows.length > 0 && (
              <div className="overflow-x-auto mb-8">
                <h2 className="text-xl font-bold mb-4">DCF / NPV Breakdown</h2>
                <table className="min-w-full text-sm bg-white rounded-lg shadow-md">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 text-center">Year</th>
                      <th className="py-2 px-4 text-right">Revenue ($)</th>
                      <th className="py-2 px-4 text-right">Total Expenses ($)</th>
                      <th className="py-2 px-4 text-right">Net Cash Flow ($)</th>
                      <th className="py-2 px-4 text-right">Present Value ($)</th>
                      <th className="py-2 px-4 text-right">Cumulative PV ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                        <td className="py-2 px-4 text-center">{row.year}</td>
                        <td className="py-2 px-4 text-right">{row.revenue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        <td className="py-2 px-4 text-right">{row.totalExpenses.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        <td className={`py-2 px-4 text-right font-semibold ${row.netCashFlow < 0 ? 'text-red-600' : 'text-green-700'}`}>{row.netCashFlow.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        <td className={`py-2 px-4 text-right font-semibold ${row.presentValue < 0 ? 'text-red-600' : 'text-green-700'}`}>{row.presentValue.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                        <td className={`py-2 px-4 text-right font-semibold ${row.cumulativePV < 0 ? 'text-red-600' : 'text-green-700'}`}>{row.cumulativePV.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 text-lg font-bold text-right">
                  NPV: <span className={
                    cashFlows.length > 0 && cashFlows[cashFlows.length - 1].cumulativePV < 0
                      ? 'text-red-600'
                      : 'text-green-700'
                  }>
                    {cashFlows.length > 0 ? cashFlows[cashFlows.length - 1].cumulativePV.toLocaleString(undefined, {maximumFractionDigits: 2}) : "-"}
                  </span>
                  {irr !== null && (
                    <span className="ml-8">IRR: <span className={irr < 0 ? 'text-red-600' : 'text-green-700'}>{irr.toFixed(2)}%</span></span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
} 