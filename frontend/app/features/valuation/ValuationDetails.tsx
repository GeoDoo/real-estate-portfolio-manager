"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CashFlowRow, DCFRow } from '@/types/dcf';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ValuationForm from '@/components/ValuationForm';
import Breadcrumbs from '@/components/Breadcrumbs';
import { valuationsAPI } from '@/lib/api/valuations';
import Button from '@/components/Button';

function getNumberColorClass(n: number) {
  if (n > 0) return 'text-green-700 font-bold';
  if (n < 0) return 'text-red-600 font-bold';
  return 'text-gray-500 font-bold';
}

function getChanceLabel(prob: number) {
  if (prob < 0.05) return 'Highly Unlikely';
  if (prob < 0.2) return 'Unlikely';
  if (prob < 0.4) return 'Somewhat Unlikely';
  if (prob < 0.6) return 'Even Odds';
  if (prob < 0.8) return 'Somewhat Likely';
  if (prob < 0.95) return 'Likely';
  return 'Highly Likely';
}

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
  const [mcRentGrowthMean, setMcRentGrowthMean] = useState(2);
  const [mcRentGrowthStd, setMcRentGrowthStd] = useState(1);
  const [mcDiscountMean, setMcDiscountMean] = useState(15);
  const [mcDiscountStd, setMcDiscountStd] = useState(2);
  const [mcNumSim, setMcNumSim] = useState(10000);
  const [mcResults, setMcResults] = useState<number[]>([]);
  const [mcSummary, setMcSummary] = useState<any>(null);
  const [mcProgress, setMcProgress] = useState(0);
  const [mcTotal, setMcTotal] = useState(0);
  const [mcRunning, setMcRunning] = useState(false);

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

  const runMonteCarlo = async () => {
    if (!valuation) return;
    setMcRunning(true);
    setMcProgress(0);
    setMcTotal(mcNumSim);
    setMcResults([]);
    setMcSummary(null);
    const params = new URLSearchParams({
      ...Object.fromEntries(Object.entries(valuation).map(([k, v]) => [k, String(v)])),
      annual_rent_growth: encodeURIComponent(JSON.stringify({ distribution: 'normal', mean: mcRentGrowthMean, stddev: mcRentGrowthStd })),
      discount_rate: encodeURIComponent(JSON.stringify({ distribution: 'normal', mean: mcDiscountMean, stddev: mcDiscountStd })),
      num_simulations: String(mcNumSim),
    });
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/valuations/monte-carlo-stream?${params.toString()}`;
    const es = new window.EventSource(url);
    let allNPVs: number[] = [];
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.done) {
        setMcResults(data.npvs);
        setMcSummary(data.summary);
        setMcProgress(mcNumSim);
        setMcRunning(false);
        es.close();
      } else {
        setMcProgress(data.progress);
        setMcTotal(data.total);
        allNPVs = data.npvs;
        setMcResults([...allNPVs]);
      }
    };
    es.onerror = () => {
      setMcRunning(false);
      es.close();
    };
  };

  function getHistogram(data: number[], bins: number) {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data), max = Math.max(...data);
    if (min === max) {
      // All values are the same, put them in a single bin
      return [{ count: data.length, range: [min, max], height: 100 }];
    }
    const binSize = (max - min) / bins;
    // Always create bins as objects
    const hist = Array.from({ length: bins }, (_, i) => ({
      count: 0,
      range: [min + i * binSize, min + (i + 1) * binSize],
      height: 0,
    }));
    data.forEach(val => {
      let idx = Math.floor((val - min) / binSize);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      hist[idx].count += 1;
    });
    const maxCount = Math.max(...hist.map(b => b.count));
    hist.forEach(b => { b.height = maxCount > 0 ? Math.round((b.count / maxCount) * 100) : 0; });
    return hist;
  }

  function formatXAxisTick(n: number) {
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return Math.round(n).toLocaleString();
  }

  function formatYAxisTick(n: number) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
    if (n >= 1e3) return (n / 1e3).toFixed(0) + 'k';
    return n.toLocaleString();
  }

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
                  <Button
                onClick={handleEdit}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
                  </Button>
            )}
            {isEditing && (
              <>
                    <Button
                  onClick={handleSave}
                  disabled={saving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                  onClick={handleCancel}
                      variant="secondary"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                    </Button>
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
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 relative">
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

            {/* Monte Carlo Simulation */}
            {!isEditing && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">Monte Carlo Simulation</h2>
                <p className="text-gray-600 mb-6">Simulate thousands of possible outcomes for this property based on your assumptions. Adjust the values below and click Run Simulation to see the range of possible results.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Rent Growth</h3>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mean (%)</label>
                    <input type="number" value={mcRentGrowthMean} onChange={e => setMcRentGrowthMean(Number(e.target.value))} className="w-full p-2 border rounded mb-2" disabled={mcRunning} />
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stddev (%)</label>
                    <input type="number" value={mcRentGrowthStd} onChange={e => setMcRentGrowthStd(Number(e.target.value))} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Discount Rate</h3>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mean (%)</label>
                    <input type="number" value={mcDiscountMean} onChange={e => setMcDiscountMean(Number(e.target.value))} className="w-full p-2 border rounded mb-2" />
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stddev (%)</label>
                    <input type="number" value={mcDiscountStd} onChange={e => setMcDiscountStd(Number(e.target.value))} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Simulation Settings</h3>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Simulations</label>
                    <input type="number" value={mcNumSim} min={10000} onChange={e => setMcNumSim(Math.max(10000, Number(e.target.value)))} className="w-full p-2 border rounded" />
                    <Button
                      onClick={runMonteCarlo}
                      className="w-full mt-8 px-4 py-2"
                      disabled={mcRunning}
                    >
                      {mcRunning ? `Running... (${mcProgress}/${mcTotal})` : 'Run Simulation'}
                    </Button>
                  </div>
                </div>
                {mcRunning && (
                  <div className="w-full bg-gray-200 rounded h-2 mt-4 mb-4">
                    <div
                      className="bg-[var(--primary)] h-2 rounded"
                      style={{ width: `${(mcProgress / mcTotal) * 100}%` }}
                    />
                  </div>
                )}
                {mcSummary && (
                  <div className="mt-8">
                    <h3 className="font-bold mb-2 text-lg">Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-max w-auto text-base border-separate border-spacing-y-2">
                        <tbody>
                          <tr>
                            <td className="font-bold text-right pr-4 text-[var(--color-dark)]">NPV Mean:</td>
                            <td><span className={getNumberColorClass(mcSummary.npv_mean)}>{mcSummary.npv_mean > 0 ? '+' : ''}${mcSummary.npv_mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-right pr-4 text-[var(--color-dark)]">NPV 5th Percentile:</td>
                            <td><span className={getNumberColorClass(mcSummary.npv_5th_percentile)}>${mcSummary.npv_5th_percentile.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-right pr-4 text-[var(--color-dark)]">NPV 95th Percentile:</td>
                            <td><span className={getNumberColorClass(mcSummary.npv_95th_percentile)}>${mcSummary.npv_95th_percentile.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-right pr-4 text-[var(--color-dark)]">IRR Mean:</td>
                            <td><span className={getNumberColorClass(mcSummary.irr_mean)}>{(mcSummary.irr_mean * 100).toFixed(2)}%</span></td>
                          </tr>
                          <tr>
                            <td className="font-bold text-right pr-4 text-[var(--color-dark)]">Chance of Positive NPV:</td>
                            <td>
                              <span className="text-gray-500 font-bold">{getChanceLabel(mcSummary.probability_npv_positive)} </span>
                              <span className="text-gray-500 font-normal">({(mcSummary.probability_npv_positive * 100).toFixed(1)}%)</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {mcSummary.probability_npv_positive < 0.5 && (
                      <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 font-semibold mt-4">
                        Warning: This scenario is unlikely to be profitable under your current assumptions.
                      </div>
                    )}
                  </div>
                )}
                {mcResults && mcResults.length > 0 && (
                  <div className="mt-6">
                    <div className="flex justify-center">
                      <div
                        className="relative bg-white border border-gray-200 rounded-lg"
                        style={{ width: '100%', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}
                      >
                        {/* Y-axis label */}
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-base text-gray-600 font-medium"
                          style={{ transform: 'translateY(-100%)' }}
                        >
                          Simulations
                        </span>
                        {/* X-axis label (now inside the border, just above the bottom edge) */}
                        <span
                          className="absolute left-1/2 text-base text-gray-600 font-medium"
                          style={{ transform: 'translateX(-100%)', bottom: 24 }}
                        >
                          Net Present Value ($)
                        </span>
                        {/* Y-axis ticks */}
                        {(() => {
                          const hist = getHistogram(mcResults, 20);
                          const maxCount = hist.length > 0 ? Math.max(...hist.map(b => b.count)) : 0;
                          return [0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                            <span
                              key={i}
                              className="absolute left-10 text-sm text-gray-400 font-semibold"
                              style={{ bottom: `${60 + t * 360}px`, maxWidth: 48, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {formatYAxisTick(Math.round(maxCount * t))}
                            </span>
                          ));
                        })()}
                        {/* X-axis ticks */}
                        {(() => {
                          const hist = getHistogram(mcResults, 20);
                          const min = hist.length > 0 ? hist[0].range[0] : 0;
                          const max = hist.length > 0 ? hist[hist.length - 1].range[1] : 0;
                          return [0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                            <span
                              key={i}
                              className="absolute bottom-14 text-sm text-gray-400 font-semibold"
                              style={{ left: `calc(${60 + t * 860}px)`, maxWidth: 60, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {formatXAxisTick(min + t * (max - min))}
                            </span>
                          ));
                        })()}
                        {/* NPV=0 line (only if in range) */}
                        {(() => {
                          const data = mcResults;
                          const min = Math.min(...data), max = Math.max(...data);
                          if (min < 0 && max > 0) {
                            const zeroPos = ((0 - min) / (max - min)) * 100;
                            return (
                              <div
                                style={{
                                  position: 'absolute',
                                  left: `calc(${zeroPos}% + 60px)`,
                                  top: 64,
                                  bottom: 64,
                                  width: 3,
                                  background: 'var(--color-danger, #e11d48)',
                                  opacity: 0.35,
                                  zIndex: 10,
                                  borderRadius: 2,
                                }}
                                title="NPV = 0"
                              />
                            );
                          }
                          return null;
                        })()}
                        {/* Histogram bars with counts and tooltips */}
                        <div
                          className="flex items-end h-full w-full"
                          style={{ paddingLeft: 60, paddingRight: 40, paddingTop: 96, paddingBottom: 80, gap: 8, overflow: 'visible' }}
                        >
                          {(() => {
                            const hist = getHistogram(mcResults, 20);
                            if (hist.length > 0) {
                              return hist.map((bin, i) => (
                                <div
                                  key={i}
                                  className="relative flex flex-col items-center group"
                                  style={{ width: 28 }}
                                >
                                  <div
                                    style={{
                                      width: 20,
                                      height: bin.height * 3.2,
                                      background: 'var(--primary)',
                                      marginRight: 2,
                                      borderRadius: 6,
                                      transition: 'background 0.2s',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                      cursor: 'pointer',
                                    }}
                                    title={`$${formatXAxisTick(bin.range[0])} to $${formatXAxisTick(bin.range[1])}: ${bin.count} simulations`}
                                  />
                                  <span
                                    className="text-base text-gray-700 font-bold mt-2"
                                    style={{ minWidth: 20, textAlign: 'center', letterSpacing: 0, maxWidth: 40, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                  >
                                    {bin.count > 0 ? formatYAxisTick(bin.count) : ''}
                                  </span>
                                  {/* Tooltip on hover */}
                                  <span
                                    className="absolute z-20 px-2 py-1 rounded bg-gray-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                    style={{ bottom: 40, whiteSpace: 'nowrap' }}
                                  >
                                    ${formatXAxisTick(bin.range[0])} to ${formatXAxisTick(bin.range[1])}<br />
                                    {bin.count} simulations
                                  </span>
                                </div>
                              ));
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                </div>
              </div>
            )}
          </div>
            )}
          </>
        )}
      </div>
    </main>
  );
} 