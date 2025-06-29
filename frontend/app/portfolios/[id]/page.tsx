"use client";
import React, { use, useEffect, useState, useRef } from "react";
import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { portfoliosAPI } from "@/lib/api/portfolios";
import { valuationsAPI } from "@/lib/api/valuations";
import { CashFlowRow } from "@/types/cashflow";
import { getNumberColor, formatCurrency } from "@/lib/utils";

export default function PortfolioDetailsPage({ params }: { params: any }) {
  const { id } = use(params) as { id: string };
  const [portfolioName, setPortfolioName] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [aggregateRows, setAggregateRows] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive target state (with localStorage persistence)
  const [targetNetWorth, setTargetNetWorth] = useState(10000000);
  const [targetYear, setTargetYear] = useState(25);

  // Dynamic width refs for inputs
  const netWorthInputRef = useRef<HTMLInputElement>(null);
  const netWorthSpanRef = useRef<any>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const yearSpanRef = useRef<any>(null);

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
        const props: any[] = (await portfoliosAPI.getProperties(id)) as any[];
        setProperties(props);
        // Fetch all cash flows for properties
        const allCashFlows: CashFlowRow[][] = await Promise.all(
          props.map(async (prop: any) => {
            const valuation = await valuationsAPI.getByPropertyId(prop.id);
            if (!valuation) return [];
            return await valuationsAPI.calculateCashFlows(valuation);
          }),
        );
        // Aggregate cash flows by year
        const yearMap: Map<number, CashFlowRow> = new Map();
        for (const cashFlows of allCashFlows) {
          for (const row of cashFlows) {
            if (!yearMap.has(row.year)) {
              yearMap.set(row.year, { ...row });
            } else {
              const agg = yearMap.get(row.year)!;
              agg.revenue += row.revenue;
              agg.totalExpenses += row.totalExpenses;
              agg.netCashFlow += row.netCashFlow;
              agg.presentValue += row.presentValue;
              agg.cumulativePV += row.cumulativePV;
            }
          }
        }
        setAggregateRows(
          Array.from(yearMap.values()).sort((a, b) => a.year - b.year),
        );
      } catch {
        setPortfolioName("Portfolio Not Found");
        setProperties([]);
        setAggregateRows([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const projectedRow = aggregateRows.find((r) => r.year === targetYear);
  const projectedNetWorth = projectedRow ? projectedRow.cumulativePV : 0;
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
          <div className="flex flex-col md:flex-row md:items-center gap-6 min-w-0">
            <div className="flex-1 min-w-[260px]">
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
            <div className="flex-1 min-w-[260px]">
              <div
                className="text-base font-semibold mb-2 tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Net Gain/Loss at Present
              </div>
              <div
                className={`text-3xl font-extrabold ${projectedNetWorth >= targetNetWorth ? "text-green-600" : "text-red-600"}`}
              >
                £{formatCurrency(projectedNetWorth, "")}
              </div>
              <div
                className="text-base mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Gap:{" "}
                <span className={gap > 0 ? "text-red-600" : "text-green-700"}>
                  £{formatCurrency(gap, "")}
                </span>
              </div>
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
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-left">Year</th>
                <th className="text-right">Revenue ($)</th>
                <th className="text-right">Expenses ($)</th>
                <th className="text-right">Net Cash Flow ($)</th>
                <th className="text-right">Present Value ($)</th>
                <th className="text-right">Cumulative PV ($)</th>
              </tr>
            </thead>
            <tbody>
              {aggregateRows.map((row) => (
                <tr key={row.year}>
                  <td style={{ color: "var(--foreground)" }}>{row.year}</td>
                  <td
                    className="text-right font-bold"
                    style={{ color: getNumberColor(row.revenue) }}
                  >
                    {formatCurrency(row.revenue)}
                  </td>
                  <td
                    className="text-right font-bold"
                    style={{ color: getNumberColor(row.totalExpenses) }}
                  >
                    {formatCurrency(row.totalExpenses)}
                  </td>
                  <td
                    className="text-right font-bold"
                    style={{ color: getNumberColor(row.netCashFlow) }}
                  >
                    {formatCurrency(row.netCashFlow)}
                  </td>
                  <td
                    className="text-right font-bold"
                    style={{ color: getNumberColor(row.presentValue) }}
                  >
                    {formatCurrency(row.presentValue)}
                  </td>
                  <td
                    className="text-right font-bold"
                    style={{ color: getNumberColor(row.cumulativePV) }}
                  >
                    {formatCurrency(row.cumulativePV)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
