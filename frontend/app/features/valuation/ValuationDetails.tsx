"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CashFlowRow, DCFRow } from "@/types/cashflow";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import ValuationForm from "@/components/ValuationForm";
import Breadcrumbs from "@/components/Breadcrumbs";
import { valuationsAPI } from "@/lib/api/valuations";
import Button from "@/components/Button";
import PageContainer from "@/components/PageContainer";
import { getNumberColor } from "@/lib/utils";
import { config } from "../../config";
import {
  isValidValuationForm,
  hasValidValuation,
} from "../properties/validation";
import InfoTooltip from "@/components/InfoTooltip";
import { formatCurrency } from "@/lib/utils";

interface MonteCarloSummary {
  npv_mean: number;
  npv_5th_percentile: number;
  npv_95th_percentile: number;
  irr_mean: number;
  probability_npv_positive: number;
  mean_valid_irr?: number | null;
  percent_valid_irr?: number | null;
}

interface RentalAnalysis {
  metrics: {
    monthly_cash_flow: number;
    annual_cash_flow: number;
    roi_percent: number;
    cap_rate_percent: number;
    cash_on_cash_percent: number;
    break_even_rent: number;
    rent_coverage_ratio: number;
  };
  monthly_breakdown: {
    gross_rental_income: number;
    effective_rental_income: number;
    mortgage_payment: number;
    property_tax: number;
    insurance: number;
    maintenance: number;
    property_management: number;
    capex: number;
    total_expenses: number;
    cash_flow: number;
  };
  loan_details: {
    down_payment: number;
    loan_amount: number;
    monthly_mortgage: number;
    total_investment: number;
  };
}

function getChanceLabel(prob: number) {
  if (prob < 0.05) return "Highly Unlikely";
  if (prob < 0.2) return "Unlikely";
  if (prob < 0.4) return "Somewhat Unlikely";
  if (prob < 0.6) return "Even Odds";
  if (prob < 0.8) return "Somewhat Likely";
  if (prob < 0.95) return "Likely";
  return "Highly Likely";
}

// Helper for zero formatting and color
function renderCell(value: number, colorFn: (n: number) => string) {
  const isZero = Number(value) === 0 || Object.is(value, -0);
  return (
    <span
      className="font-bold"
      style={{ color: isZero ? "#6B7280" : colorFn(value) }} // Tailwind gray-500
    >
      {isZero ? "0" : value.toLocaleString()}
    </span>
  );
}

export default function ValuationDetailPage() {
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const [valuation, setValuation] = useState<DCFRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>([]);
  const [irr, setIrr] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    initial_investment: "",
    annual_rental_income: "",
    vacancy_rate: "",
    service_charge: "",
    ground_rent: "",
    maintenance: "",
    property_tax: "",
    insurance: "",
    management_fees: "",
    transaction_costs: "",
    annual_rent_growth: "",
    discount_rate: "",
    holding_period: "",
    ltv: "",
    interest_rate: "",
    capex: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mcDist, setMcDist] = useState<"normal" | "pareto">("normal");
  const [mcRentGrowthMean, setMcRentGrowthMean] = useState(3);
  const [mcRentGrowthStd, setMcRentGrowthStd] = useState(1);
  const [mcRentGrowthShape, setMcRentGrowthShape] = useState(4);
  const [mcDiscountMean, setMcDiscountMean] = useState(8);
  const [mcDiscountStd, setMcDiscountStd] = useState(2);
  const [mcDiscountShape, setMcDiscountShape] = useState(2.5);
  const [mcInterestMean, setMcInterestMean] = useState(5);
  const [mcInterestStd, setMcInterestStd] = useState(1);
  const [mcInterestShape, setMcInterestShape] = useState(4);
  const [mcNumSim, setMcNumSim] = useState(10000);
  const [mcResults, setMcResults] = useState<number[]>([]);
  const [mcSummary, setMcSummary] = useState<MonteCarloSummary | null>(null);
  const [mcProgress, setMcProgress] = useState(0);
  const [mcTotal, setMcTotal] = useState(0);
  const [mcRunning, setMcRunning] = useState(false);
  const [rentalAnalysis, setRentalAnalysis] = useState<RentalAnalysis | null>(
    null
  );
  const [rentalLoading, setRentalLoading] = useState(false);
  const [marketScenario, setMarketScenario] = useState<
    "custom" | "bullish" | "bearish"
  >("custom");
  const [capRate, setCapRate] = useState(4.5);

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
            initial_investment: String(json.initial_investment ?? ""),
            annual_rental_income: String(json.annual_rental_income ?? ""),
            vacancy_rate: String(json.vacancy_rate ?? ""),
            service_charge: String(json.service_charge ?? ""),
            ground_rent: String(json.ground_rent ?? ""),
            maintenance: String(json.maintenance ?? ""),
            property_tax: String(json.property_tax ?? ""),
            insurance: String(json.insurance ?? ""),
            management_fees: String(json.management_fees ?? ""),
            transaction_costs: String(json.transaction_costs ?? ""),
            annual_rent_growth: String(json.annual_rent_growth ?? ""),
            discount_rate: String(json.discount_rate ?? ""),
            holding_period: String(json.holding_period ?? ""),
            ltv: String(json.ltv ?? ""),
            interest_rate: String(json.interest_rate ?? ""),
            capex: String(json.capex ?? ""),
          });
          await fetchCashFlows(json);
        } else {
          setError("Valuation not found");
          setValuation(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch valuation";
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
      const cashFlowsData =
        await valuationsAPI.calculateCashFlows(valuationData);
      setCashFlows(cashFlowsData);

      // Fetch IRR if cash flows are available
      if (cashFlowsData && cashFlowsData.length > 1) {
        const netCashFlows = cashFlowsData.map((row) => row.net_cash_flow);
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
      initial_investment: String(valuation.initial_investment ?? ""),
      annual_rental_income: String(valuation.annual_rental_income ?? ""),
      vacancy_rate: String(valuation.vacancy_rate ?? ""),
      service_charge: String(valuation.service_charge ?? ""),
      ground_rent: String(valuation.ground_rent ?? ""),
      maintenance: String(valuation.maintenance ?? ""),
      property_tax: String(valuation.property_tax ?? ""),
      insurance: String(valuation.insurance ?? ""),
      management_fees: String(valuation.management_fees ?? ""),
      transaction_costs: String(valuation.transaction_costs ?? ""),
      annual_rent_growth: String(valuation.annual_rent_growth ?? ""),
      discount_rate: String(valuation.discount_rate ?? ""),
      holding_period: String(valuation.holding_period ?? ""),
      ltv: String(valuation.ltv ?? ""),
      interest_rate: String(valuation.interest_rate ?? ""),
      capex: String(valuation.capex ?? ""),
    });
    setIsEditing(false);
    setFormError(null);
  };

  // Use shared validation logic
  function isFormValid() {
    return isValidValuationForm(form);
  }

  const handleSave = async () => {
    if (!propertyId) return;
    if (!isFormValid()) {
      setFormError("All fields must be positive numbers.");
      return;
    }

    setSaving(true);
    setFormError(null);
    const data = {
      initial_investment: parseFloat(form.initial_investment) || 0,
      annual_rental_income: parseFloat(form.annual_rental_income) || 0,
      vacancy_rate: parseFloat(form.vacancy_rate) || 0,
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
      ltv: form.ltv !== "" ? parseFloat(form.ltv) : 0,
      interest_rate:
        form.interest_rate !== "" ? parseFloat(form.interest_rate) : 0,
      capex: form.capex !== "" ? parseFloat(form.capex) : 0,
    };

    try {
      const updatedValuation = await valuationsAPI.save(propertyId, data);
      setValuation(updatedValuation);
      setIsEditing(false);
      setForm({
        initial_investment: String(updatedValuation.initial_investment ?? ""),
        annual_rental_income: String(
          updatedValuation.annual_rental_income ?? ""
        ),
        vacancy_rate: String(updatedValuation.vacancy_rate ?? ""),
        service_charge: String(updatedValuation.service_charge ?? ""),
        ground_rent: String(updatedValuation.ground_rent ?? ""),
        maintenance: String(updatedValuation.maintenance ?? ""),
        property_tax: String(updatedValuation.property_tax ?? ""),
        insurance: String(updatedValuation.insurance ?? ""),
        management_fees: String(updatedValuation.management_fees ?? ""),
        transaction_costs: String(updatedValuation.transaction_costs ?? ""),
        annual_rent_growth: String(updatedValuation.annual_rent_growth ?? ""),
        discount_rate: String(updatedValuation.discount_rate ?? ""),
        holding_period: String(updatedValuation.holding_period ?? ""),
        ltv: String(updatedValuation.ltv ?? ""),
        interest_rate: String(updatedValuation.interest_rate ?? ""),
        capex: String(updatedValuation.capex ?? ""),
      });
      await fetchCashFlows(updatedValuation);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save changes";
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
    // Prepare the request body for POST
    const body: Record<string, unknown> = {
      ...valuation,
      annual_rent_growth:
        mcDist === "normal"
          ? {
              distribution: "normal",
              mean: mcRentGrowthMean,
              stddev: mcRentGrowthStd,
            }
          : {
              distribution: "pareto",
              mean: mcRentGrowthMean,
              shape: mcRentGrowthShape,
            },
      discount_rate:
        mcDist === "normal"
          ? {
              distribution: "normal",
              mean: mcDiscountMean,
              stddev: mcDiscountStd,
            }
          : {
              distribution: "pareto",
              mean: mcDiscountMean,
              shape: mcDiscountShape,
            },
      num_simulations: mcNumSim,
    };
    if (parseFloat(String(valuation.ltv ?? "")) > 0) {
      body.interest_rate =
        mcDist === "normal"
          ? {
              distribution: "normal",
              mean: mcInterestMean,
              stddev: mcInterestStd,
            }
          : {
              distribution: "pareto",
              mean: mcInterestMean,
              shape: mcInterestShape,
            };
    } else {
      body.interest_rate = {
        distribution: "normal",
        mean: 0,
        stddev: 0,
      };
    }
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/valuations/monte-carlo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        setError(`Failed to run simulation: ${response.status} ${errorText}`);
        console.error("Simulation error:", response.status, errorText);
        return;
      }
      const data = await response.json();
      setMcResults(data.npv_results);
      setMcSummary(data.summary);
      setMcProgress(mcNumSim);
    } catch (err) {
      setError("Failed to run simulation (network or JS error)");
      console.error("Simulation JS/network error:", err);
    } finally {
      setMcRunning(false);
    }
  };

  const runRentalAnalysis = async () => {
    if (!valuation) return;
    setRentalLoading(true);
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/api/valuations/rental-analysis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(valuation),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRentalAnalysis(data);
      } else {
        console.error("Failed to run rental analysis");
      }
    } catch (error) {
      console.error("Error running rental analysis:", error);
    } finally {
      setRentalLoading(false);
    }
  };

  function getHistogram(data: number[], bins: number) {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data),
      max = Math.max(...data);
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
    data.forEach((val) => {
      let idx = Math.floor((val - min) / binSize);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      hist[idx].count += 1;
    });
    const maxCount = Math.max(...hist.map((b) => b.count));
    hist.forEach((b) => {
      b.height = maxCount > 0 ? Math.round((b.count / maxCount) * 100) : 0;
    });
    return hist;
  }

  function formatXAxisTick(n: number) {
    if (Math.abs(n) >= 1e6)
      return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + "k";
    return Math.round(n).toLocaleString();
  }

  function formatYAxisTick(n: number) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "k";
    return n.toLocaleString();
  }

  // Helper to set scenario values
  function setScenarioValues(scenario: "bullish" | "bearish") {
    if (scenario === "bullish") {
      setMcRentGrowthMean(4.5);
      setMcRentGrowthShape(6.5);
      setMcDiscountMean(6.5);
      setMcDiscountShape(4.5);
      setMcInterestMean(3.75);
      setMcInterestShape(7.5);
    } else if (scenario === "bearish") {
      setMcRentGrowthMean(0.5);
      setMcRentGrowthShape(2.5);
      setMcDiscountMean(10.5);
      setMcDiscountShape(2.5);
      setMcInterestMean(7);
      setMcInterestShape(2.5);
    }
  }

  // Compute first-year NOI from cashFlows (if available)
  const firstYearNOI =
    cashFlows && cashFlows.length > 1 ? cashFlows[1].noi : null;
  const directCapValue =
    firstYearNOI && capRate > 0 ? firstYearNOI / (capRate / 100) : null;

  return (
    <PageContainer>
      <Breadcrumbs propertyId={propertyId} last="Valuation" />

      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Property Valuation
            </h1>
            <div className="flex space-x-3">
              {!isEditing && (
                <Button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={!isFormValid() || saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="secondary"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium"
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Valuation Results
              </h2>
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <span
                    className={`text-2xl font-bold ${
                      cashFlows[cashFlows.length - 1].cumulative_pv > 0
                        ? "text-green-700"
                        : cashFlows[cashFlows.length - 1].cumulative_pv < 0
                          ? "text-red-600"
                          : "text-gray-900"
                    }`}
                  >
                    £
                    {cashFlows[
                      cashFlows.length - 1
                    ].cumulative_pv.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <div className="text-base font-semibold text-gray-600 flex items-center justify-center gap-1">
                    Net Present Value
                    <span className="relative group ml-1 cursor-pointer">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="inline-block align-baseline text-gray-400 group-hover:text-gray-700"
                      >
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <text
                          x="12"
                          y="16"
                          textAnchor="middle"
                          fontSize="12"
                          fill="currentColor"
                        >
                          i
                        </text>
                      </svg>
                      <span
                        className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-900 text-white text-sm rounded-lg px-5 py-3 shadow-xl max-w-2xl min-w-[300px]"
                        style={{ top: "100%" }}
                      >
                        NPV is the total value of all future cash flows (income
                        minus expenses), discounted to today's value. A positive
                        NPV means the investment is expected to be profitable.
                      </span>
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <span
                    className={`text-2xl font-bold ${
                      irr && irr > 0
                        ? "text-green-700"
                        : irr && irr < 0
                          ? "text-red-600"
                          : "text-gray-900"
                    }`}
                  >
                    {irr ? `${irr.toFixed(2)}%` : "N/A"}
                  </span>
                  <div className="text-base font-semibold text-gray-600 flex items-center justify-center gap-1">
                    Internal Rate of Return
                    <span className="relative group ml-1 cursor-pointer">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        className="inline-block align-baseline text-gray-400 group-hover:text-gray-700"
                      >
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <text
                          x="12"
                          y="16"
                          textAnchor="middle"
                          fontSize="12"
                          fill="currentColor"
                        >
                          i
                        </text>
                      </svg>
                      <span
                        className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gray-900 text-white text-sm rounded-lg px-5 py-3 shadow-xl max-w-2xl min-w-[300px]"
                        style={{ top: "100%" }}
                      >
                        IRR is the annualized rate of return that makes the net
                        present value of all cash flows equal to zero. A higher
                        IRR means a better return on investment.
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Flow Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 px-4 text-left">Year</th>
                      <th className="py-2 px-4 text-right">Gross Rent (£)</th>
                      <th className="py-2 px-4 text-right">Vacancy Loss (£)</th>
                      <th className="py-2 px-4 text-right">
                        Effective Rent (£)
                      </th>
                      <th className="py-2 px-4 text-right">
                        Operating Expenses (£)
                      </th>
                      <th className="py-2 px-4 text-right">NOI (£)</th>
                      <th className="py-2 px-4 text-right">CapEx (£)</th>
                      <th className="py-2 px-4 text-right">
                        Net Cash Flow (£)
                      </th>
                      <th className="py-2 px-4 text-right">Discount Factor</th>
                      <th className="py-2 px-4 text-right">
                        Present Value (£)
                      </th>
                      <th className="py-2 px-4 text-right">
                        Cumulative PV (£)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlows.map((row, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="py-2 px-4">{row.year}</td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(row.gross_rent, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(-row.vacancy_loss, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(row.effective_rent, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(-row.operating_expenses, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(row.noi, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(-row.capex, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(row.net_cash_flow, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <span
                            className="font-bold"
                            style={{
                              color:
                                Number(row.discount_factor) === 0 ||
                                Object.is(row.discount_factor, -0)
                                  ? "#6B7280"
                                  : undefined,
                            }}
                          >
                            {Number(row.discount_factor) === 0 ||
                            Object.is(row.discount_factor, -0)
                              ? "0"
                              : row.discount_factor.toLocaleString(undefined, {
                                  maximumFractionDigits: 6,
                                })}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(row.present_value, getNumberColor)}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {renderCell(row.cumulative_pv, getNumberColor)}
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
              <h2 className="text-xl font-bold mb-4">
                Monte Carlo Simulation (
                {mcDist === "normal" ? "Gaussian" : "Pareto"})
              </h2>
              <div className="flex items-center gap-8 mb-6">
                <div>
                  <label className="text-base font-semibold mr-2">
                    Distribution
                  </label>
                  <select
                    value={mcDist}
                    onChange={(e) =>
                      setMcDist(e.target.value as "normal" | "pareto")
                    }
                    className="border rounded p-2 text-base"
                    disabled={mcRunning}
                  >
                    <option value="normal">Normal (Gaussian)</option>
                    <option value="pareto">Pareto (Power-law)</option>
                  </select>
                </div>
                {mcDist === "pareto" && (
                  <div>
                    <label className="text-base font-semibold mr-2">
                      Market Scenario
                    </label>
                    <select
                      value={marketScenario}
                      onChange={(e) => {
                        const val = e.target.value as
                          | "custom"
                          | "bullish"
                          | "bearish";
                        setMarketScenario(val);
                        if (val !== "custom") setScenarioValues(val);
                      }}
                      className="border rounded p-2 text-base"
                      disabled={mcRunning}
                    >
                      <option value="custom">Custom</option>
                      <option value="bullish">Bullish Cycle</option>
                      <option value="bearish">Bearish Cycle</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Rent Growth
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    Mean (%){" "}
                    <InfoTooltip
                      label={
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <text
                            x="12"
                            y="16"
                            textAnchor="middle"
                            fontSize="12"
                            fill="currentColor"
                          >
                            i
                          </text>
                        </svg>
                      }
                      tooltip="The average annual growth rate for rental income. This represents the expected increase in rent over time."
                    />
                  </div>
                  <input
                    type="number"
                    value={mcRentGrowthMean}
                    onChange={(e) => {
                      setMcRentGrowthMean(Number(e.target.value));
                      setMarketScenario("custom");
                    }}
                    className="w-full p-2 border rounded mb-2"
                    disabled={mcRunning}
                  />
                  {mcDist === "normal" ? (
                    <>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        Stddev (%){" "}
                        <InfoTooltip
                          label={
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <text
                                x="12"
                                y="16"
                                textAnchor="middle"
                                fontSize="12"
                                fill="currentColor"
                              >
                                i
                              </text>
                            </svg>
                          }
                          tooltip="The standard deviation of rent growth. Higher values indicate more uncertainty in future rent increases."
                        />
                      </div>
                      <input
                        type="number"
                        value={mcRentGrowthStd}
                        onChange={(e) => {
                          setMcRentGrowthStd(Number(e.target.value));
                          setMarketScenario("custom");
                        }}
                        className="w-full p-2 border rounded"
                        disabled={mcRunning}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        Shape (α){" "}
                        <InfoTooltip
                          label={
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <text
                                x="12"
                                y="16"
                                textAnchor="middle"
                                fontSize="12"
                                fill="currentColor"
                              >
                                i
                              </text>
                            </svg>
                          }
                          tooltip="The shape parameter α controls how 'wild' the distribution is. Lower values (closer to 1) mean more extreme rent growth rates and fatter tails. Typical values: 1.1–3."
                        />
                      </div>
                      <input
                        type="number"
                        value={mcRentGrowthShape}
                        min={1.01}
                        step={0.01}
                        onChange={(e) => {
                          setMcRentGrowthShape(Number(e.target.value));
                          setMarketScenario("custom");
                        }}
                        className="w-full p-2 border rounded"
                        disabled={mcRunning}
                      />
                    </>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Discount Rate
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    Mean (%){" "}
                    <InfoTooltip
                      label={
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <text
                            x="12"
                            y="16"
                            textAnchor="middle"
                            fontSize="12"
                            fill="currentColor"
                          >
                            i
                          </text>
                        </svg>
                      }
                      tooltip="The average discount rate used to calculate present values. This represents the required rate of return for the investment."
                    />
                  </div>
                  <input
                    type="number"
                    value={mcDiscountMean}
                    onChange={(e) => {
                      setMcDiscountMean(Number(e.target.value));
                      setMarketScenario("custom");
                    }}
                    className="w-full p-2 border rounded mb-2"
                    disabled={mcRunning}
                  />
                  {mcDist === "normal" ? (
                    <>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        Stddev (%){" "}
                        <InfoTooltip
                          label={
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <text
                                x="12"
                                y="16"
                                textAnchor="middle"
                                fontSize="12"
                                fill="currentColor"
                              >
                                i
                              </text>
                            </svg>
                          }
                          tooltip="The standard deviation of the discount rate. Higher values indicate more uncertainty in the required rate of return."
                        />
                      </div>
                      <input
                        type="number"
                        value={mcDiscountStd}
                        onChange={(e) => {
                          setMcDiscountStd(Number(e.target.value));
                          setMarketScenario("custom");
                        }}
                        className="w-full p-2 border rounded"
                        disabled={mcRunning}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        Shape (α){" "}
                        <InfoTooltip
                          label={
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <text
                                x="12"
                                y="16"
                                textAnchor="middle"
                                fontSize="12"
                                fill="currentColor"
                              >
                                i
                              </text>
                            </svg>
                          }
                          tooltip="The shape parameter α controls how 'wild' the distribution is. Lower values (closer to 1) mean more extreme discount rates and fatter tails. Typical values: 1.1–3."
                        />
                      </div>
                      <input
                        type="number"
                        value={mcDiscountShape}
                        min={1.01}
                        step={0.01}
                        onChange={(e) => {
                          setMcDiscountShape(Number(e.target.value));
                          setMarketScenario("custom");
                        }}
                        className="w-full p-2 border rounded"
                        disabled={mcRunning}
                      />
                    </>
                  )}
                </div>
                <div>
                  {/* Interest Rate (only if LTV > 0) */}
                  {parseFloat(String(valuation?.ltv ?? "")) > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">
                        Interest Rate
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        Mean (%){" "}
                        <InfoTooltip
                          label={
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                            >
                              <circle cx="12" cy="12" r="10" strokeWidth="2" />
                              <text
                                x="12"
                                y="16"
                                textAnchor="middle"
                                fontSize="12"
                                fill="currentColor"
                              >
                                i
                              </text>
                            </svg>
                          }
                          tooltip="The average interest rate for the mortgage loan. This affects monthly mortgage payments and overall cash flow."
                        />
                      </div>
                      <input
                        type="number"
                        value={mcInterestMean}
                        onChange={(e) => {
                          setMcInterestMean(Number(e.target.value));
                          setMarketScenario("custom");
                        }}
                        className="w-full p-2 border rounded mb-2"
                        disabled={mcRunning}
                      />
                      {mcDist === "normal" ? (
                        <>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            Stddev (%){" "}
                            <InfoTooltip
                              label={
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x="12"
                                    y="16"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="currentColor"
                                  >
                                    i
                                  </text>
                                </svg>
                              }
                              tooltip="The standard deviation of interest rates. Higher values indicate more uncertainty in future interest rate changes."
                            />
                          </div>
                          <input
                            type="number"
                            value={mcInterestStd}
                            onChange={(e) => {
                              setMcInterestStd(Number(e.target.value));
                              setMarketScenario("custom");
                            }}
                            className="w-full p-2 border rounded"
                            disabled={mcRunning}
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            Shape (α){" "}
                            <InfoTooltip
                              label={
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x="12"
                                    y="16"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="currentColor"
                                  >
                                    i
                                  </text>
                                </svg>
                              }
                              tooltip="The shape parameter α controls how 'wild' the distribution is. Lower values (closer to 1) mean more extreme interest rates and fatter tails. Typical values: 1.1–3."
                            />
                          </div>
                          <input
                            type="number"
                            value={mcInterestShape}
                            min={1.01}
                            step={0.01}
                            onChange={(e) => {
                              setMcInterestShape(Number(e.target.value));
                              setMarketScenario("custom");
                            }}
                            className="w-full p-2 border rounded"
                            disabled={mcRunning}
                          />
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    Simulation Settings
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    Simulations{" "}
                    <InfoTooltip
                      label={
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                        >
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <text
                            x="12"
                            y="16"
                            textAnchor="middle"
                            fontSize="12"
                            fill="currentColor"
                          >
                            i
                          </text>
                        </svg>
                      }
                      tooltip="The number of Monte Carlo simulations to run. More simulations provide more accurate results but take longer to compute."
                    />
                  </div>
                  <input
                    type="number"
                    value={mcNumSim}
                    min={10000}
                    onChange={(e) =>
                      setMcNumSim(Math.max(10000, Number(e.target.value)))
                    }
                    className="w-full p-2 border rounded"
                  />
                  <Button
                    onClick={runMonteCarlo}
                    className="w-full mt-8 px-4 py-3"
                    disabled={
                      mcRunning || !hasValidValuation(valuation as DCFRow)
                    }
                  >
                    {mcRunning
                      ? `Running... (${mcProgress}/${mcTotal})`
                      : "Run Simulation"}
                  </Button>
                  {!hasValidValuation(valuation as DCFRow) && (
                    <div className="text-xs text-red-500 mt-2 text-center">
                      Please enter and save a valid valuation before running the
                      simulation.
                    </div>
                  )}
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
                          <td
                            className="font-bold text-right pr-4"
                            style={{ color: "var(--foreground)" }}
                          >
                            NPV Mean (£):
                          </td>
                          <td>
                            <span
                              className="font-bold"
                              style={{
                                color: getNumberColor(mcSummary.npv_mean),
                              }}
                            >
                              {mcSummary.npv_mean > 0 ? "+" : ""}
                              {mcSummary.npv_mean.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td
                            className="font-bold text-right pr-4"
                            style={{ color: "var(--foreground)" }}
                          >
                            NPV 95th Percentile (£)
                            <InfoTooltip
                              label={
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  className="inline-block align-baseline text-gray-400 hover:text-gray-700 ml-1"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x="12"
                                    y="16"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="currentColor"
                                  >
                                    i
                                  </text>
                                </svg>
                              }
                              tooltip="The 95th percentile of simulated Net Present Value (NPV) outcomes. Only 5% of simulations are above this value. This is an optimistic estimate of upside potential."
                            />
                            :
                          </td>
                          <td>
                            <span
                              className="font-bold"
                              style={{
                                color: getNumberColor(
                                  mcSummary.npv_95th_percentile
                                ),
                              }}
                            >
                              {mcSummary.npv_95th_percentile.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td
                            className="font-bold text-right pr-4"
                            style={{ color: "var(--foreground)" }}
                          >
                            NPV 5th Percentile (£)
                            <InfoTooltip
                              label={
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  className="inline-block align-baseline text-gray-400 hover:text-gray-700 ml-1"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x="12"
                                    y="16"
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="currentColor"
                                  >
                                    i
                                  </text>
                                </svg>
                              }
                              tooltip="The 5th percentile of simulated Net Present Value (NPV) outcomes. 95% of simulations are above this value. This is a conservative estimate of downside risk."
                            />
                            :
                          </td>
                          <td>
                            <span
                              className="font-bold"
                              style={{
                                color: getNumberColor(
                                  mcSummary.npv_5th_percentile
                                ),
                              }}
                            >
                              {mcSummary.npv_5th_percentile.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td
                            className="font-bold text-right pr-4"
                            style={{ color: "var(--foreground)" }}
                          >
                            IRR Mean (All, %):
                          </td>
                          <td>
                            <span
                              className="font-bold"
                              style={{
                                color: getNumberColor(mcSummary.irr_mean),
                              }}
                            >
                              {Number.isFinite(mcSummary.irr_mean) &&
                              mcSummary.irr_mean !== null &&
                              mcSummary.irr_mean !== undefined
                                ? (mcSummary.irr_mean * 100).toFixed(2)
                                : "N/A"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-bold text-right pr-4 text-[var(--color-dark)]">
                            IRR Mean (Valid Only, %):
                          </td>
                          <td>
                            <span
                              className="font-bold"
                              style={{
                                color: getNumberColor(
                                  Number.isFinite(mcSummary.mean_valid_irr)
                                    ? mcSummary.mean_valid_irr!
                                    : 0
                                ),
                              }}
                            >
                              {Number.isFinite(mcSummary.mean_valid_irr) &&
                              mcSummary.mean_valid_irr !== null &&
                              mcSummary.mean_valid_irr !== undefined
                                ? (mcSummary.mean_valid_irr * 100).toFixed(2)
                                : "N/A"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td
                            className="font-bold text-right pr-4"
                            style={{ color: "var(--foreground)" }}
                          >
                            % of Valid IRR Scenarios:
                          </td>
                          <td>
                            <span className="font-bold">
                              {mcSummary.percent_valid_irr !== null &&
                              mcSummary.percent_valid_irr !== undefined
                                ? mcSummary.percent_valid_irr.toFixed(1)
                                : "N/A"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="font-bold text-right pr-4 text-[var(--color-dark)]">
                            Chance of Positive NPV:
                          </td>
                          <td>
                            <span className="text-gray-500 font-bold">
                              {getChanceLabel(
                                mcSummary.probability_npv_positive
                              )}{" "}
                            </span>
                            <span className="text-gray-500 font-normal">
                              (
                              {(
                                mcSummary.probability_npv_positive * 100
                              ).toFixed(1)}
                              %)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {mcSummary.probability_npv_positive < 0.5 && (
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 font-semibold mt-4">
                      Warning: This scenario is unlikely to be profitable under
                      your current assumptions.
                    </div>
                  )}
                </div>
              )}
              {mcResults && mcResults.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-center">
                    <div
                      className="relative bg-white border border-gray-200 rounded-lg"
                      style={{
                        width: "100%",
                        height: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "visible",
                      }}
                    >
                      {/* Y-axis label */}
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-base text-gray-600 font-medium"
                        style={{ transform: "translateY(-100%)" }}
                      >
                        Simulations
                      </span>
                      {/* X-axis label (now inside the border, just above the bottom edge) */}
                      <span
                        className="absolute left-1/2 text-base text-gray-600 font-medium"
                        style={{ transform: "translateX(-100%)", bottom: 24 }}
                      >
                        Net Present Value (£)
                      </span>
                      {/* Y-axis ticks */}
                      {(() => {
                        const hist = getHistogram(mcResults, 20);
                        const maxCount =
                          hist.length > 0
                            ? Math.max(...hist.map((b) => b.count))
                            : 0;
                        return [0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                          <span
                            key={i}
                            className="absolute left-10 text-sm text-gray-400 font-semibold"
                            style={{
                              bottom: `${60 + t * 360}px`,
                              maxWidth: 48,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {formatYAxisTick(Math.round(maxCount * t))}
                          </span>
                        ));
                      })()}
                      {/* X-axis ticks */}
                      {(() => {
                        const hist = getHistogram(mcResults, 20);
                        const min = hist.length > 0 ? hist[0].range[0] : 0;
                        const max =
                          hist.length > 0 ? hist[hist.length - 1].range[1] : 0;
                        return [0, 0.25, 0.5, 0.75, 1].map((t, i) => (
                          <span
                            key={i}
                            className="absolute bottom-14 text-sm text-gray-400 font-semibold"
                            style={{
                              left: `calc(${60 + t * 860}px)`,
                              maxWidth: 60,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {formatXAxisTick(min + t * (max - min))}
                          </span>
                        ));
                      })()}
                      {/* NPV=0 line (only if in range) */}
                      {(() => {
                        const data = mcResults;
                        const min = Math.min(...data),
                          max = Math.max(...data);
                        if (min < 0 && max > 0) {
                          const zeroPos = ((0 - min) / (max - min)) * 100;
                          return (
                            <div
                              style={{
                                position: "absolute",
                                left: `calc(${zeroPos}% + 60px)`,
                                top: 64,
                                bottom: 64,
                                width: 3,
                                background: "var(--color-danger, #e11d48)",
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
                        style={{
                          paddingLeft: 60,
                          paddingRight: 40,
                          paddingTop: 96,
                          paddingBottom: 80,
                          gap: 8,
                          overflow: "visible",
                        }}
                      >
                        {(() => {
                          const hist = getHistogram(mcResults, 20);
                          if (hist.length > 0) {
                            return hist.map((bin, i) => (
                              <div
                                key={i}
                                className="relative flex flex-col items-center"
                                style={{ width: 28 }}
                              >
                                <InfoTooltip
                                  label={
                                    <div
                                      style={{
                                        width: 20,
                                        height: bin.height * 3.2,
                                        background: "var(--primary)",
                                        marginRight: 2,
                                        borderRadius: 6,
                                        transition: "background 0.2s",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                        cursor: "pointer",
                                      }}
                                    />
                                  }
                                  tooltip={
                                    <>
                                      £{formatXAxisTick(bin.range[0])} to £
                                      {formatXAxisTick(bin.range[1])}
                                      <br />
                                      {bin.count} simulations
                                    </>
                                  }
                                />
                                <span
                                  className="text-base text-gray-700 font-bold mt-2"
                                  style={{
                                    minWidth: 20,
                                    textAlign: "center",
                                    letterSpacing: 0,
                                    maxWidth: 40,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {bin.count > 0
                                    ? formatYAxisTick(bin.count)
                                    : ""}
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

          {/* Rental Analysis */}
          {!isEditing && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Rental Analysis</h2>
              <p className="text-gray-600 mb-6">
                Analyze the rental performance of this property. Calculate key
                metrics like ROI, cap rate, and cash flow.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <Button
                    onClick={runRentalAnalysis}
                    className="w-full px-4 py-3"
                    variant="primary"
                    size="md"
                    disabled={
                      rentalLoading || !hasValidValuation(valuation as DCFRow)
                    }
                  >
                    {rentalLoading ? "Analyzing..." : "Run Rental Analysis"}
                  </Button>

                  {!hasValidValuation(valuation as DCFRow) && (
                    <div className="text-xs text-red-500 mt-2 text-center">
                      Please enter and save a valid valuation before running the
                      analysis.
                    </div>
                  )}
                </div>
              </div>

              {rentalAnalysis && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div>
                    <h3 className="font-bold mb-3 text-lg">Key Metrics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Monthly Cash Flow (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The monthly cash flow after all expenses including mortgage, taxes, insurance, maintenance, and property management fees."
                          />
                        </div>
                        <div
                          className={`text-xl font-bold ${getNumberColor(rentalAnalysis.metrics.monthly_cash_flow)}`}
                        >
                          {Number.isFinite(
                            rentalAnalysis.metrics.monthly_cash_flow
                          )
                            ? rentalAnalysis.metrics.monthly_cash_flow.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Annual Cash Flow (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The annual cash flow after all expenses. This represents the net income from the rental property each year."
                          />
                        </div>
                        <div
                          className={`text-xl font-bold ${getNumberColor(rentalAnalysis.metrics.annual_cash_flow)}`}
                        >
                          {Number.isFinite(
                            rentalAnalysis.metrics.annual_cash_flow
                          )
                            ? rentalAnalysis.metrics.annual_cash_flow.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          ROI (%){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="Return on Investment. Calculated as (Annual Cash Flow / Total Investment) × 100. Shows the percentage return on your total investment."
                          />
                        </div>
                        <div
                          className={`text-xl font-bold ${getNumberColor(rentalAnalysis.metrics.roi_percent)}`}
                        >
                          {Number.isFinite(rentalAnalysis.metrics.roi_percent)
                            ? rentalAnalysis.metrics.roi_percent.toFixed(2)
                            : "-"}
                        </div>
                      </div>                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Cash-on-Cash Return (%){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="Cash-on-Cash Return. Calculated as (Annual Cash Flow / Down Payment) × 100. Shows the return on your actual cash investment."
                          />
                        </div>
                        <div
                          className={`text-xl font-bold ${getNumberColor(rentalAnalysis.metrics.cash_on_cash_percent)}`}
                        >
                          {Number.isFinite(
                            rentalAnalysis.metrics.cash_on_cash_percent
                          )
                            ? rentalAnalysis.metrics.cash_on_cash_percent.toFixed(
                                2
                              )
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Break-even Rent (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The minimum monthly rent needed to cover all expenses and achieve zero cash flow. This is your break-even point."
                          />
                        </div>
                        <div className="text-xl font-bold text-gray-800">
                          {Number.isFinite(
                            rentalAnalysis.metrics.break_even_rent
                          )
                            ? rentalAnalysis.metrics.break_even_rent.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Rent Coverage Ratio (x){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="How well rental income covers expenses. Calculated as Monthly Rent ÷ Total Monthly Expenses. A ratio above 1.0 means positive cash flow."
                          />
                        </div>
                        <div
                          className={`text-xl font-bold ${getNumberColor(rentalAnalysis.metrics.rent_coverage_ratio > 1 ? 1 : -1)}`}
                        >
                          {Number.isFinite(
                            rentalAnalysis.metrics.rent_coverage_ratio
                          )
                            ? rentalAnalysis.metrics.rent_coverage_ratio.toFixed(
                                2
                              )
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Breakdown */}
                  <div>
                    <h3 className="font-bold mb-3 text-lg">
                      Monthly Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                              Item
                            </th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                              Amount (£)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Gross Rental Income
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  rentalAnalysis.monthly_breakdown
                                    .gross_rental_income
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown
                                .gross_rental_income !== 0
                                ? rentalAnalysis.monthly_breakdown.gross_rental_income.toLocaleString()
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Effective Rental Income
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  rentalAnalysis.monthly_breakdown
                                    .effective_rental_income
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown
                                .effective_rental_income !== 0
                                ? rentalAnalysis.monthly_breakdown.effective_rental_income.toLocaleString()
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Mortgage Payment
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown
                                      .mortgage_payment
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown
                                .mortgage_payment !== 0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.mortgage_payment).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Property Tax
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown
                                      .property_tax
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown.property_tax !==
                              0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.property_tax).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Insurance
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown.insurance
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown.insurance !== 0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.insurance).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Maintenance
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown.maintenance
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown.maintenance !==
                              0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.maintenance).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              Property Management
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown
                                      .property_management
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown
                                .property_management !== 0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.property_management).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-600">
                              CapEx
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown.capex
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown.capex !== 0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.capex).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-800">
                              Total Expenses
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-medium"
                              style={{
                                color: getNumberColor(
                                  -Math.abs(
                                    rentalAnalysis.monthly_breakdown
                                      .total_expenses
                                  )
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown
                                .total_expenses !== 0
                                ? `-${Math.abs(rentalAnalysis.monthly_breakdown.total_expenses).toLocaleString()}`
                                : "0"}
                            </td>
                          </tr>
                          <tr className="border-t-2 border-gray-300 bg-blue-50">
                            <td className="px-4 py-2 text-sm font-bold text-gray-800">
                              Monthly Cash Flow
                            </td>
                            <td
                              className="px-4 py-2 text-right text-sm font-bold"
                              style={{
                                color: getNumberColor(
                                  rentalAnalysis.monthly_breakdown.cash_flow
                                ),
                              }}
                            >
                              {rentalAnalysis.monthly_breakdown.cash_flow > 0
                                ? rentalAnalysis.monthly_breakdown.cash_flow.toLocaleString()
                                : rentalAnalysis.monthly_breakdown.cash_flow < 0
                                  ? `-${Math.abs(rentalAnalysis.monthly_breakdown.cash_flow).toLocaleString()}`
                                  : "0"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div>
                    <h3 className="font-bold mb-3 text-lg">Loan Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Down Payment (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The amount of money you need to pay upfront to get the loan."
                          />
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {Number.isFinite(
                            rentalAnalysis.loan_details.down_payment
                          )
                            ? rentalAnalysis.loan_details.down_payment.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Loan Amount (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The total amount of money you need to borrow to buy the property."
                          />
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {Number.isFinite(
                            rentalAnalysis.loan_details.loan_amount
                          )
                            ? rentalAnalysis.loan_details.loan_amount.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Monthly Mortgage (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The amount of money you need to pay each month to cover the interest and principal of the loan."
                          />
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {Number.isFinite(
                            rentalAnalysis.loan_details.monthly_mortgage
                          )
                            ? rentalAnalysis.loan_details.monthly_mortgage.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          Total Investment (£){" "}
                          <InfoTooltip
                            label={
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                className="inline-block align-baseline text-gray-400 hover:text-gray-700"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  strokeWidth="2"
                                />
                                <text
                                  x="12"
                                  y="16"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="currentColor"
                                >
                                  i
                                </text>
                              </svg>
                            }
                            tooltip="The total amount of money you need to invest in the property."
                          />
                        </div>
                        <div className="text-lg font-bold text-gray-800">
                          {Number.isFinite(
                            rentalAnalysis.loan_details.total_investment
                          )
                            ? rentalAnalysis.loan_details.total_investment.toLocaleString()
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Direct Capitalization Value */}
          <div className="mt-8 mb-8 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <span className="font-bold text-lg mr-2">
                Direct Capitalization Value
              </span>
              <InfoTooltip
                label={
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="inline-block align-baseline text-gray-400 hover:text-gray-700 ml-1"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fontSize="12"
                      fill="currentColor"
                    >
                      i
                    </text>
                  </svg>
                }
                tooltip="The Direct Capitalization Method estimates value as NOI divided by Cap Rate. Common for quick market value checks."
              />
            </div>
            <div className="flex flex-wrap items-center gap-1 mb-2">
              <label className="font-medium">Cap Rate (%)</label>
              <InfoTooltip
                className="mr-4"
                label={
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="inline-block align-baseline text-gray-400 hover:text-gray-700 ml-1"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fontSize="12"
                      fill="currentColor"
                    >
                      i
                    </text>
                  </svg>
                }
                tooltip="Cap rate is the expected yield for this property type. Typical values: London flats 3.5–4.5%, regional offices 5–6%."
              />
              <input
                type="number"
                min={1}
                max={15}
                step={0.01}
                value={capRate}
                onChange={(e) => setCapRate(Number(e.target.value))}
                className="p-1 border rounded text-left"
              />
            </div>
            <div className="mb-2">
              <span className="font-medium text-gray-700">Year 1 NOI:</span>
              <span
                className="ml-1 font-bold"
                style={{ color: getNumberColor(firstYearNOI ?? 0) }}
              >
                {firstYearNOI !== null ? (
                  formatCurrency(firstYearNOI)
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Direct Cap Value:
              </span>
              <span
                className="ml-1 font-bold text-lg"
                style={{ color: getNumberColor(directCapValue ?? 0) }}
              >
                {directCapValue !== null ? (
                  formatCurrency(directCapValue)
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </span>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
