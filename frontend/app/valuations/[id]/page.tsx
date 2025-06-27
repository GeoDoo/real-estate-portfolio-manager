"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CashFlowRow, DCFRow } from '../../../types/dcf';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ValuationForm from '../../ValuationForm';

export default function ValuationDetailPage() {
  const { id } = useParams();
  const [valuation, setValuation] = useState<DCFRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>([]);
  const [irr, setIrr] = useState<number|null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    initial_investment: '',
    annual_rental_income: '',
    service_charge: '',
    ground_rent: '',
    maintenance: '',
    property_tax: '',
    insurance: '',
    management_fees: '',
    one_time_expenses: '',
    cash_flow_growth_rate: '',
    discount_rate: '',
    holding_period: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
          setForm({
            initial_investment: String(json.initial_investment),
            annual_rental_income: String(json.annual_rental_income),
            service_charge: String(json.service_charge),
            ground_rent: String(json.ground_rent),
            maintenance: String(json.maintenance),
            property_tax: String(json.property_tax),
            insurance: String(json.insurance),
            management_fees: String(json.management_fees),
            one_time_expenses: String(json.one_time_expenses),
            cash_flow_growth_rate: String(json.cash_flow_growth_rate),
            discount_rate: String(json.discount_rate),
            holding_period: String(json.holding_period),
          });
          await fetchCashFlows(json);
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

  async function fetchCashFlows(valuationData: DCFRow) {
    try {
      const cfRes = await fetch(`http://localhost:8000/api/cashflows/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valuationData),
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
    } catch {
      setCashFlows([]);
      setIrr(null);
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^-?\d*\.?\d*$/.test(value)) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormError(null);
  };

  const handleCancel = () => {
    if (!valuation) return;
    setForm({
      initial_investment: String(valuation.initial_investment),
      annual_rental_income: String(valuation.annual_rental_income),
      service_charge: String(valuation.service_charge),
      ground_rent: String(valuation.ground_rent),
      maintenance: String(valuation.maintenance),
      property_tax: String(valuation.property_tax),
      insurance: String(valuation.insurance),
      management_fees: String(valuation.management_fees),
      one_time_expenses: String(valuation.one_time_expenses),
      cash_flow_growth_rate: String(valuation.cash_flow_growth_rate),
      discount_rate: String(valuation.discount_rate),
      holding_period: String(valuation.holding_period),
    });
    setIsEditing(false);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!valuation) return;
    setSaving(true);
    setFormError(null);
    // Convert all values to numbers, default to 0 if empty
    const data = {
      initial_investment: Number(form.initial_investment) || 0,
      annual_rental_income: Number(form.annual_rental_income) || 0,
      service_charge: Number(form.service_charge) || 0,
      ground_rent: Number(form.ground_rent) || 0,
      maintenance: Number(form.maintenance) || 0,
      property_tax: Number(form.property_tax) || 0,
      insurance: Number(form.insurance) || 0,
      management_fees: Number(form.management_fees) || 0,
      one_time_expenses: Number(form.one_time_expenses) || 0,
      cash_flow_growth_rate: Number(form.cash_flow_growth_rate) || 0,
      discount_rate: Number(form.discount_rate) || 0,
      holding_period: Number(form.holding_period) || 0,
    };
    try {
      const res = await fetch(`http://localhost:8000/api/valuations/${valuation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updatedValuation = await res.json();
        setValuation(updatedValuation);
        setIsEditing(false);
        setForm({
          initial_investment: String(updatedValuation.initial_investment),
          annual_rental_income: String(updatedValuation.annual_rental_income),
          service_charge: String(updatedValuation.service_charge),
          ground_rent: String(updatedValuation.ground_rent),
          maintenance: String(updatedValuation.maintenance),
          property_tax: String(updatedValuation.property_tax),
          insurance: String(updatedValuation.insurance),
          management_fees: String(updatedValuation.management_fees),
          one_time_expenses: String(updatedValuation.one_time_expenses),
          cash_flow_growth_rate: String(updatedValuation.cash_flow_growth_rate),
          discount_rate: String(updatedValuation.discount_rate),
          holding_period: String(updatedValuation.holding_period),
        });
        await fetchCashFlows(updatedValuation);
      } else {
        setFormError("Failed to save changes");
      }
    } catch {
      setFormError("Failed to save changes");
    }
    setSaving(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Valuation Details</h1>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
          {isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <CheckIcon className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <ValuationForm
            form={form}
            onChange={handleFormChange}
            disabled={!isEditing}
            error={formError}
          />
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : valuation ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            {/* DCF Results Section */}
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