"use client";
import React, { use, useEffect, useState, useRef } from "react";
import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { portfoliosAPI } from "@/lib/api/portfolios";
import { valuationsAPI } from "@/lib/api/valuations";
import { CashFlowRow } from "@/types/cashflow";
import { getNumberColor, formatCurrency } from "@/lib/utils";
import { Property } from "@/types/property";

// Helper function to render table cells with proper formatting
function renderCell(value: number, colorFn: (n: number) => string) {
  return (
    <span className="font-bold" style={{ color: colorFn(value) }}>
      {value > 0
        ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : value < 0
        ? `-${Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        : "0"}
    </span>
  );
}

export default function PortfolioDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) as { id: string };
  const [portfolioName, setPortfolioName] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [aggregateRows, setAggregateRows] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioIRR, setPortfolioIRR] = useState<number | null>(null);

  // Interactive target state (with localStorage persistence)
  const [targetNetWorth, setTargetNetWorth] = useState(10000000);
  const [targetYear, setTargetYear] = useState(25);

  // Dynamic width refs for inputs
  const netWorthInputRef = useRef<HTMLInputElement>(null);
  const netWorthSpanRef = useRef<React.ElementRef<'span'>>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const yearSpanRef = useRef<React.ElementRef<'span'>>(null);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNetWorth = window.localStorage.getItem("targetNetWorth");
      if (savedNetWorth) setTargetNetWorth(parseFloat(savedNetWorth));
      const savedYear = window.localStorage.getItem("targetYear");
      if (savedYear) setTargetYear(parseInt(savedYear));
    }
  }, []);
  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("targetNetWorth", String(targetNetWorth));
    }
  }, [targetNetWorth]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("targetYear", String(targetYear));
    }
  }, [targetYear]);

  // Adjust input width on value change
  useEffect(() => {
    if (netWorthInputRef.current && netWorthSpanRef.current) {
      netWorthInputRef.current.style.width = `${netWorthSpanRef.current.offsetWidth + 24}px`;
    }
  }, [targetNetWorth]);
  useEffect(() => {
    if (yearInputRef.current && yearSpanRef.current) {
      yearInputRef.current.style.width = `${yearSpanRef.current.offsetWidth + 16}px`;
    }
  }, [targetYear]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const portfolio = await portfoliosAPI.getById(id);
        setPortfolioName(portfolio.name);
        const props: Property[] = (await portfoliosAPI.getProperties(id)) as Property[];
        setProperties(Array.isArray(props) ? props : []);
        
        // Fetch all cash flows for properties
        const allCashFlows: CashFlowRow[][] = await Promise.all(
          props.map(async (prop: Property) => {
            const valuation = await valuationsAPI.getByPropertyId(prop.id);
            if (!valuation) return [];
            return await valuationsAPI.calculateCashFlows(valuation);
          }),
        );

        // Aggregate cash flows by year with proper portfolio-level calculation
        const yearMap: Map<number, CashFlowRow> = new Map();
        const maxYear = Math.max(...allCashFlows.flat().map(cf => cf.year), 0);
        
        // Initialize all years from 0 to maxYear
        for (let year = 0; year <= maxYear; year++) {
          yearMap.set(year, {
            year,
            gross_rent: 0,
            vacancy_loss: 0,
            effective_rent: 0,
            operating_expenses: 0,
            noi: 0,
            capex: 0,
            net_cash_flow: 0,
            discount_factor: 0,
            present_value: 0,
            cumulative_pv: 0,
          });
        }

        // Aggregate all properties' cash flows by year
        for (const cashFlows of allCashFlows) {
          for (const row of cashFlows) {
            const agg = yearMap.get(row.year);
            if (agg) {
              agg.gross_rent += row.gross_rent;
              agg.vacancy_loss += row.vacancy_loss;
              agg.effective_rent += row.effective_rent;
              agg.operating_expenses += row.operating_expenses;
              agg.noi += row.noi;
              agg.capex += row.capex;
              agg.net_cash_flow += row.net_cash_flow;
              // Note: We'll recalculate discount factors and PVs at portfolio level
            }
          }
        }

        // Calculate portfolio-level discount factors and present values
        // Use a portfolio-level discount rate (could be weighted average or fixed)
        const portfolioDiscountRate = 8; // Default portfolio discount rate
        let cumulativePV = 0;
        
        const sortedRows = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
        for (const row of sortedRows) {
          // Calculate portfolio-level discount factor
          row.discount_factor = 1 / Math.pow(1 + portfolioDiscountRate / 100, row.year);
          
          // Calculate present value
          row.present_value = row.net_cash_flow * row.discount_factor;
          
          // Calculate cumulative PV
          cumulativePV += row.present_value;
          row.cumulative_pv = cumulativePV;
        }

        setAggregateRows(sortedRows);
        
        // Calculate portfolio IRR from aggregated net cash flows
        const netCashFlows = sortedRows.map(row => row.net_cash_flow);
        if (netCashFlows.length > 1) {
          const irr = await valuationsAPI.calculateIRR(netCashFlows);
          setPortfolioIRR(irr);
        } else {
          setPortfolioIRR(null);
        }
      } catch {
        setPortfolioName("Portfolio Not Found");
        setProperties([]);
        setAggregateRows([]);
        setPortfolioIRR(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const projectedRow = aggregateRows.find((r) => r.year === targetYear);
  const projectedNetWorth = projectedRow ? projectedRow.cumulative_pv : 0;
  const gap = targetNetWorth - projectedNetWorth;

  return (
    <PageContainer>
      <Breadcrumbs last={portfolioName} />
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: "var(--foreground)" }}
      >
        {portfolioName}
      </h1>
      {/* Target Net Worth Section */}
      <div className="mb-10">
        <div
          className="card p-6 border-l-8"
          style={{ borderLeftColor: "var(--primary)" }}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-6 min-w-0">
            <div className="basis-full md:basis-1/2 min-w-[260px] flex flex-col">
              <div
                className="text-base font-semibold mb-2 tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Target Net Worth
              </div>
              <div className="flex items-end gap-2 min-w-0">
                <span
                  className="text-3xl font-extrabold"
                  style={{ color: "var(--primary)" }}
                >
                  £
                </span>
                <input
                  ref={netWorthInputRef}
                  type="number"
                  className="text-3xl font-extrabold bg-gray-50 border border-gray-200 focus:border-[#00cfa6] focus:ring-2 focus:ring-[#00cfa6]/30 px-4 py-2 rounded-lg transition-all outline-none shadow-sm text-center"
                  value={targetNetWorth}
                  min={0}
                  step={10000}
                  onChange={(e) => setTargetNetWorth(Number(e.target.value))}
                  style={{
                    width: "auto",
                    minWidth: 60,
                    maxWidth: 220,
                    display: "inline-block",
                    color: "var(--primary)",
                  }}
                />
                {/* Hidden span for measuring width */}
                <span
                  ref={netWorthSpanRef}
                  className="invisible absolute text-3xl font-extrabold px-4"
                  style={{ whiteSpace: "pre" }}
                >
                  {targetNetWorth || 0}
                </span>
                <span
                  className="text-base ml-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  in
                </span>
                <input
                  ref={yearInputRef}
                  type="number"
                  className="text-2xl font-bold bg-gray-50 border border-gray-200 focus:border-[#00cfa6] focus:ring-2 focus:ring-[#00cfa6]/30 px-2 py-1 rounded-lg ml-2 outline-none shadow-sm text-center"
                  value={targetYear}
                  min={1}
                  max={100}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  style={{
                    width: "auto",
                    minWidth: 36,
                    maxWidth: 80,
                    display: "inline-block",
                    color: "var(--primary)",
                  }}
                />
                {/* Hidden span for measuring width */}
                <span
                  ref={yearSpanRef}
                  className="invisible absolute text-2xl font-bold px-2"
                  style={{ whiteSpace: "pre" }}
                >
                  {targetYear || 0}
                </span>
                <span
                  className="text-base ml-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  years
                </span>
              </div>
            </div>
            <div className="basis-full md:basis-1/4 min-w-[180px] flex flex-col">
              <div
                className="text-base font-semibold mb-2 tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Total NPV
              </div>
              <span
                className={`text-3xl font-extrabold ${
                  projectedNetWorth > 0
                    ? "text-green-600"
                    : projectedNetWorth < 0
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                £{formatCurrency(projectedNetWorth, "")}
              </span>
              <div
                className="text-base mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Gap: {" "}
                <span className={gap > 0 ? "text-red-600" : "text-green-700"}>
                  £{formatCurrency(gap, "")}
                </span>
              </div>
            </div>
            <div className="basis-full md:basis-1/4 min-w-[180px] flex flex-col">
              <div
                className="text-base font-semibold mb-2 tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                IRR
              </div>
              <span
                className={`text-3xl font-extrabold align-middle ${
                  portfolioIRR !== null && portfolioIRR >= 8
                    ? "text-green-600"
                    : portfolioIRR !== null && portfolioIRR >= 4
                    ? "text-orange-500"
                    : "text-red-600"
                }`}
                style={{ minWidth: 80, display: "inline-block" }}
              >
                {portfolioIRR !== null ? `${portfolioIRR.toFixed(2)}%` : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="mt-4" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      ) : properties.length === 0 ? (
        <div className="mt-4" style={{ color: "var(--text-muted)" }}>
          You have not added any properties yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Portfolio DCF Analysis</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 px-4 text-left">Year</th>
                  <th className="py-2 px-4 text-right">Gross Rent (£)</th>
                  <th className="py-2 px-4 text-right">Vacancy Loss (£)</th>
                  <th className="py-2 px-4 text-right">Effective Rent (£)</th>
                  <th className="py-2 px-4 text-right">Operating Expenses (£)</th>
                  <th className="py-2 px-4 text-right">NOI (£)</th>
                  <th className="py-2 px-4 text-right">CapEx (£)</th>
                  <th className="py-2 px-4 text-right">Net Cash Flow (£)</th>
                  <th className="py-2 px-4 text-right">Discount Factor</th>
                  <th className="py-2 px-4 text-right">Present Value (£)</th>
                  <th className="py-2 px-4 text-right">Cumulative PV (£)</th>
                </tr>
              </thead>
              <tbody>
                {aggregateRows.map((row, index) => (
                  <tr
                    key={row.year}
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
    </PageContainer>
  );
}
