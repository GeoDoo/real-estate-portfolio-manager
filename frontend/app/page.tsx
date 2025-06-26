'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DCFInput } from '../types/dcf';

export default function Home() {
  const router = useRouter();
  // Form state as strings
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
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow numbers and empty string
    if (/^\d*$/.test(value)) {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    setFormError(null);
    // Convert all values to numbers, default to 0 if empty
    const data: DCFInput = {
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
    // Validation: require at least initial_investment > 0
    if (data.initial_investment <= 0) {
      setFormError('Initial Investment must be greater than 0.');
      return;
    }
    try {
      const res = await fetch('http://localhost:8000/api/valuations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.id) {
          router.push(`/valuations/${json.id}`);
        } else {
          setSaveStatus('Error saving data');
        }
      } else {
        setSaveStatus('Error saving data');
      }
    } catch {
      setSaveStatus('Error saving data');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Valuation Calculator</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Initial Costs (Year 0) */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center">
                <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Year 0</span>
                Initial Investment & Setup Costs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Investment ($)
                  </label>
                  <input
                    type="number"
                    name="initial_investment"
                    value={form.initial_investment}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    One-time Expenses ($)
                  </label>
                  <input
                    type="number"
                    name="one_time_expenses"
                    value={form.one_time_expenses}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Annual Revenue & Expenses */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Annual</span>
                Ongoing Revenue & Expenses
              </h2>
              
              {/* Revenue */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">Revenue</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Rental Income ($)
                  </label>
                  <input
                    type="number"
                    name="annual_rental_income"
                    value={form.annual_rental_income}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Annual Expenses */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-700">Annual Expenses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Charge ($)
                    </label>
                    <input
                      type="number"
                      name="service_charge"
                      value={form.service_charge}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ground Rent ($)
                    </label>
                    <input
                      type="number"
                      name="ground_rent"
                      value={form.ground_rent}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance ($)
                    </label>
                    <input
                      type="number"
                      name="maintenance"
                      value={form.maintenance}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Tax ($)
                    </label>
                    <input
                      type="number"
                      name="property_tax"
                      value={form.property_tax}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Insurance ($)
                    </label>
                    <input
                      type="number"
                      name="insurance"
                      value={form.insurance}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Management Fees (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="management_fees"
                      value={form.management_fees}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assumptions */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Model</span>
                Analysis Parameters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cash Flow Growth Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="cash_flow_growth_rate"
                    value={form.cash_flow_growth_rate}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="discount_rate"
                    value={form.discount_rate}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holding Period (years)
                  </label>
                  <input
                    type="number"
                    name="holding_period"
                    value={form.holding_period}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            {formError && (
              <div className="text-center text-red-600 font-semibold mb-4">{formError}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-lg transition-colors"
            >
              Save Data
            </button>
            {saveStatus && (
              <div className="mt-4 text-center text-green-600 font-semibold">{saveStatus}</div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
