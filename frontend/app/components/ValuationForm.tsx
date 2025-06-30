"use client";
import React from "react";

interface ValuationFormProps {
  form: Record<string, string>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  disabled?: boolean;
  error?: string | null;
}

export default function ValuationForm({
  form,
  onChange,
  onSubmit,
  disabled = false,
  error,
}: ValuationFormProps) {
  // Add a helper for required field label
  function RequiredLabel({ children }: { children: React.ReactNode }) {
    return <span>{children} <span style={{color: 'red'}}>*</span></span>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {/* Initial Investment & One-off Costs */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Initial Investment & One-off Costs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Purchase Price (£)</RequiredLabel>
            </label>
            <input
              type="text"
              name="initial_investment"
              value={form.initial_investment ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Transaction Costs (£)</RequiredLabel>
            </label>
            <input
              type="text"
              name="transaction_costs"
              value={form.transaction_costs ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Property Tax (£)</RequiredLabel>
            </label>
            <input
              type="text"
              name="property_tax"
              value={form.property_tax ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Annual Income */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Annual Income
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Annual Rental Income (£)</RequiredLabel>
            </label>
            <input
              type="text"
              name="annual_rental_income"
              value={form.annual_rental_income ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vacancy Rate (%)
            </label>
            <input
              type="text"
              name="vacancy_rate"
              value={form.vacancy_rate ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="e.g. 5"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Annual Expenses */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Annual Expenses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Charge (£)
            </label>
            <input
              type="text"
              name="service_charge"
              value={form.service_charge ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ground Rent (£)
            </label>
            <input
              type="text"
              name="ground_rent"
              value={form.ground_rent ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Maintenance (£)</RequiredLabel>
            </label>
            <input
              type="text"
              name="maintenance"
              value={form.maintenance ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance (£)
            </label>
            <input
              type="text"
              name="insurance"
              value={form.insurance ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Management Fees (%)</RequiredLabel>
            </label>
            <input
              type="text"
              name="management_fees"
              value={form.management_fees ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={
                { "--tw-ring-color": "var(--primary)" } as React.CSSProperties
              }
              placeholder="e.g. 12"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CapEx (£)
            </label>
            <input
              type="text"
              name="capex"
              value={form.capex ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties }
              placeholder="0"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Assumptions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2">
          Assumptions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Annual Rent Growth (%)</RequiredLabel>
            </label>
            <input
              type="text"
              name="annual_rent_growth"
              value={form.annual_rent_growth ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={{
                "--tw-ring-color": "var(--primary)",
              } as React.CSSProperties}
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Discount Rate (%)</RequiredLabel>
            </label>
            <input
              type="text"
              name="discount_rate"
              value={form.discount_rate ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={{
                "--tw-ring-color": "var(--primary)",
              } as React.CSSProperties}
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RequiredLabel>Holding Period (Years)</RequiredLabel>
            </label>
            <input
              type="text"
              name="holding_period"
              value={form.holding_period ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={{
                "--tw-ring-color": "var(--primary)",
              } as React.CSSProperties}
              placeholder="0"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LTV (%)
            </label>
            <input
              type="text"
              name="ltv"
              value={form.ltv ?? ""}
              onChange={onChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
              style={{
                "--tw-ring-color": "var(--primary)",
              } as React.CSSProperties}
              placeholder="e.g. 80"
              disabled={disabled}
            />
          </div>
          {parseFloat(form.ltv) > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (%)
              </label>
              <input
                type="text"
                name="interest_rate"
                value={form.interest_rate ?? ""}
                onChange={onChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                style={{
                  "--tw-ring-color": "var(--primary)",
                } as React.CSSProperties}
                placeholder="e.g. 5"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>

      {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
    </form>
  );
}
