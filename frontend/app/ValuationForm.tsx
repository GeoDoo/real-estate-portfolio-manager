import React from 'react';

interface ValuationFormProps {
  form: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  disabled?: boolean;
  error?: string | null;
}

export default function ValuationForm({ form, onChange, onSubmit, disabled = false, error }: ValuationFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-8">
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
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              disabled={disabled}
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
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              disabled={disabled}
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
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              disabled={disabled}
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
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={disabled}
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
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={disabled}
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
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={disabled}
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
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={disabled}
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
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Management Fees (%)
              </label>
              <input
                type="number"
                name="management_fees"
                value={form.management_fees}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Parameters */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2 flex items-center">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Model</span>
          Analysis Parameters
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Rent Growth (%)
            </label>
            <input
              type="number"
              name="annual_rent_growth"
              value={form.annual_rent_growth}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Rate (%)
            </label>
            <input
              type="number"
              name="discount_rate"
              value={form.discount_rate}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              disabled={disabled}
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
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </form>
  );
} 