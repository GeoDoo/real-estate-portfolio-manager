'use client';

import { useState } from 'react';
import { DCFInput } from '@/types/dcf';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
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
    // Debug: log the data being sent
    console.log('Saving DCF:', data);
    try {
      const res = await fetch('/api/save-dcf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveStatus('Saved!');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">DCF Calculator</h1>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('input')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'input'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Input Parameters
              </button>
              <button
                onClick={() => setActiveTab('results')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled
              >
                Results
                <span className="ml-2 text-xs text-gray-400">(Not implemented)</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'input' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Investment */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Investment</h2>
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
              </div>

              {/* Revenue */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Revenue</h2>
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

              {/* Expenses */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Annual Expenses</h2>
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
                      Management Fees ($)
                    </label>
                    <input
                      type="number"
                      name="management_fees"
                      value={form.management_fees}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
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

              {/* Assumptions */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Assumptions</h2>
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
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-6">Cash Flow Breakdown</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Year</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Total Expenses</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Net Cash Flow</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Present Value</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-700">Cumulative PV</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Add table rows here */}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No results available. Please calculate DCF first.</p>
          </div>
        )}
    </div>
    </main>
  );
}
