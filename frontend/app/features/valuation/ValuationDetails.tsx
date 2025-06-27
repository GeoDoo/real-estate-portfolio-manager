"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CashFlowRow, DCFRow } from '@/types/dcf';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ValuationForm from '@/components/ValuationForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import { valuationsAPI } from '@/lib/api/valuations';

export default function ValuationDetailPage() {
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
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
    transaction_costs: '',
    annual_rent_growth: '',
    discount_rate: '',
    holding_period: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchValuation() {
      if (!propertyId) return;
      
      setLoading(true);
      setError(null);
      try {
        const json = await valuationsAPI.getByPropertyId(propertyId);
        if (json) {
          setValuation(json);
          setForm({
            initial_investment: String(json.initial_investment ?? ''),
            annual_rental_income: String(json.annual_rental_income ?? ''),
            service_charge: String(json.service_charge ?? ''),
            ground_rent: String(json.ground_rent ?? ''),
            maintenance: String(json.maintenance ?? ''),
            property_tax: String(json.property_tax ?? ''),
            insurance: String(json.insurance ?? ''),
            management_fees: String(json.management_fees ?? ''),
            transaction_costs: String(json.transaction_costs ?? ''),
            annual_rent_growth: String(json.annual_rent_growth ?? ''),
            discount_rate: String(json.discount_rate ?? ''),
            holding_period: String(json.holding_period ?? ''),
          });
          await fetchCashFlows(json);
        } else {
          setError("Valuation not found");
          setValuation(null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch valuation';
        setError(errorMessage);
        setValuation(null);
        setCashFlows([]);
        setIrr(null);
      }
      setLoading(false);
    }
    fetchValuation();
  }, [propertyId]);

  async function fetchCashFlows(valuationData: DCFRow) {
    try {
      const cashFlowsData = await valuationsAPI.calculateCashFlows(valuationData);
      setCashFlows(cashFlowsData);
      
      // Fetch IRR if cash flows are available
      if (cashFlowsData && cashFlowsData.length > 1) {
        const netCashFlows = cashFlowsData.map((row) => row.netCashFlow);
        const irrValue = await valuationsAPI.calculateIRR(netCashFlows);
        setIrr(irrValue);
      } else {
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
      initial_investment: String(valuation.initial_investment ?? ''),
      annual_rental_income: String(valuation.annual_rental_income ?? ''),
      service_charge: String(valuation.service_charge ?? ''),
      ground_rent: String(valuation.ground_rent ?? ''),
      maintenance: String(valuation.maintenance ?? ''),
      property_tax: String(valuation.property_tax ?? ''),
      insurance: String(valuation.insurance ?? ''),
      management_fees: String(valuation.management_fees ?? ''),
      transaction_costs: String(valuation.transaction_costs ?? ''),
      annual_rent_growth: String(valuation.annual_rent_growth ?? ''),
      discount_rate: String(valuation.discount_rate ?? ''),
      holding_period: String(valuation.holding_period ?? ''),
    });
    setIsEditing(false);
    setFormError(null);
  };

  const handleSave = async () => {
    if (!propertyId) return;
    
    setSaving(true);
    setFormError(null);
    const data = {
      initial_investment: parseFloat(form.initial_investment) || 0,
      annual_rental_income: parseFloat(form.annual_rental_income) || 0,
      service_charge: parseFloat(form.service_charge) || 0,
      ground_rent: parseFloat(form.ground_rent) || 0,
      maintenance: parseFloat(form.maintenance) || 0,
      property_tax: parseFloat(form.property_tax) || 0,
      insurance: parseFloat(form.insurance) || 0,
      management_fees: parseFloat(form.management_fees) || 0,
      transaction_costs: parseFloat(form.transaction_costs) || 0,
      annual_rent_growth: parseFloat(form.annual_rent_growth) || 0,
      discount_rate: parseFloat(form.discount_rate) || 0,
      holding_period: parseFloat(form.holding_period) || 0,
    };

    try {
      const updatedValuation = await valuationsAPI.save(propertyId, data);
      setValuation(updatedValuation);
      setIsEditing(false);
      setForm({
        initial_investment: String(updatedValuation.initial_investment ?? ''),
        annual_rental_income: String(updatedValuation.annual_rental_income ?? ''),
        service_charge: String(updatedValuation.service_charge ?? ''),
        ground_rent: String(updatedValuation.ground_rent ?? ''),
        maintenance: String(updatedValuation.maintenance ?? ''),
        property_tax: String(updatedValuation.property_tax ?? ''),
        insurance: String(updatedValuation.insurance ?? ''),
        management_fees: String(updatedValuation.management_fees ?? ''),
        transaction_costs: String(updatedValuation.transaction_costs ?? ''),
        annual_rent_growth: String(updatedValuation.annual_rent_growth ?? ''),
        discount_rate: String(updatedValuation.discount_rate ?? ''),
        holding_period: String(updatedValuation.holding_period ?? ''),
      });
      await fetchCashFlows(updatedValuation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setFormError(errorMessage);
    }
    setSaving(false);
  };

  return (
    <main className="bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs propertyId={propertyId} last="Valuation" />
        
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Property Valuation</h1>
              <div className="flex space-x-3">
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
                    style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#00cfa6')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                  >
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Edit
                  </button>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
                      style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                      onMouseOver={e => (e.currentTarget.style.backgroundColor = '#00cfa6')}
                      onMouseOut={e => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
                    >
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <XMarkIcon className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Valuation Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <ValuationForm
                form={form}
                onChange={handleFormChange}
                disabled={!isEditing}
                error={formError}
              />
            </div>

            {/* Results */}
            {cashFlows.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 relative">
                {/* Recommendation Ribbon */}
                {(() => {
                  const npv = cashFlows[cashFlows.length - 1].cumulativePV;
                  const irrValue = irr ?? 0;
                  const isBuy = npv > 0 && irrValue > 0;
                  return (
                    <div
                      className={`absolute top-0 right-0 px-6 py-2 rounded-bl-lg text-sm font-bold shadow-lg z-10 ${
                        isBuy ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
                      }`}
                      style={{ transform: 'translateY(-1px) translateX(1px)' }}
                    >
                      {isBuy ? 'BUY' : 'DO NOT BUY'}
                    </div>
                  );
                })()}
                <h2 className="text-xl font-bold text-gray-900 mb-4">Valuation Results</h2>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <span className={
                      cashFlows[cashFlows.length - 1].cumulativePV > 0
                        ? 'text-green-700'
                        : cashFlows[cashFlows.length - 1].cumulativePV < 0
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }>
                      ${cashFlows[cashFlows.length - 1].cumulativePV.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <div className="text-sm text-gray-600">Net Present Value</div>
                  </div>
                  <div className="text-center">
                    <span className={
                      irr && irr > 0
                        ? 'text-green-700'
                        : irr && irr < 0
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }>
                      {irr ? `${irr.toFixed(2)}%` : 'N/A'}
                    </span>
                    <div className="text-sm text-gray-600">Internal Rate of Return</div>
                  </div>
                </div>

                {/* Cash Flow Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-4 text-left">Year</th>
                        <th className="py-2 px-4 text-right">Revenue ($)</th>
                        <th className="py-2 px-4 text-right">Expenses ($)</th>
                        <th className="py-2 px-4 text-right">Net Cash Flow ($)</th>
                        <th className="py-2 px-4 text-right">Present Value ($)</th>
                        <th className="py-2 px-4 text-right">Cumulative PV ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashFlows.map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-4">{row.year}</td>
                          <td className={`py-2 px-4 text-right`}>
                            <span className={
                              row.revenue > 0 ? 'text-green-700' : row.revenue < 0 ? 'text-red-600' : 'text-gray-900'
                            }>
                              {row.revenue.toLocaleString()}
                            </span>
                          </td>
                          <td className={`py-2 px-4 text-right`}>
                            <span className={
                              -row.totalExpenses < 0 ? 'text-red-600' : 'text-gray-900'
                            }>
                              {-row.totalExpenses !== 0 ? `-${row.totalExpenses.toLocaleString()}` : '0'}
                            </span>
                          </td>
                          <td className={`py-2 px-4 text-right`}>
                            <span className={
                              row.netCashFlow > 0 ? 'text-green-700' : row.netCashFlow < 0 ? 'text-red-600' : 'text-gray-900'
                            }>
                              {row.netCashFlow.toLocaleString()}
                            </span>
                          </td>
                          <td className={`py-2 px-4 text-right`}>
                            <span className={
                              row.presentValue > 0 ? 'text-green-700' : row.presentValue < 0 ? 'text-red-600' : 'text-gray-900'
                            }>
                              {row.presentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className={`py-2 px-4 text-right`}>
                            <span className={
                              row.cumulativePV > 0 ? 'text-green-700' : row.cumulativePV < 0 ? 'text-red-600' : 'text-gray-900'
                            }>
                              {row.cumulativePV.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 