"use client";
import React, { use, useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { portfoliosAPI } from "@/lib/api/portfolios";
import { valuationsAPI } from "@/lib/api/valuations";
import { CashFlowRow } from "@/types/cashflow";
import { formatCurrency } from "@/lib/utils";
import { Property } from "@/types/property";
import DcfTable from "@/components/DcfTable";

interface PropertyWithValuation extends Property {
  valuation?: {
    initial_investment: number;
    annual_rental_income: number;
    noi?: number;
    irr?: number | null;
    transaction_costs?: number;
    property_tax?: number;
  };
}

// Helper for consistent coloring
function getSummaryColor(value: number, type?: string) {
  if (type === 'investment') return '#111827'; // always neutral for investment
  if (value > 0) return '#10b981'; // green
  if (value < 0) return '#ef4444'; // red
  return '#111827'; // neutral/dark
}

export default function PortfolioDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params) as { id: string };
  const [portfolioName, setPortfolioName] = useState("");
  const [properties, setProperties] = useState<PropertyWithValuation[]>([]);
  const [aggregateRows, setAggregateRows] = useState<CashFlowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioIRR, setPortfolioIRR] = useState<number | null>(null);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const portfolio = await portfoliosAPI.getById(id);
        setPortfolioName(portfolio.name);
        const props: Property[] = (await portfoliosAPI.getProperties(id)) as Property[];
        
        // Fetch valuations for all properties
        const propertiesWithValuations: PropertyWithValuation[] = await Promise.all(
          props.map(async (prop: Property) => {
            const valuation = await valuationsAPI.getByPropertyId(prop.id);
            if (valuation) {
              // Calculate NOI from valuation data
              const noi = valuation.annual_rental_income - 
                (valuation.service_charge + valuation.ground_rent + valuation.maintenance + 
                 valuation.property_tax + valuation.insurance + 
                 (valuation.annual_rental_income * valuation.management_fees / 100));
              
              return {
                ...prop,
                valuation: {
                  initial_investment: valuation.initial_investment,
                  annual_rental_income: valuation.annual_rental_income,
                  noi: noi,
                  irr: null, // Will be calculated later if needed
                  transaction_costs: valuation.transaction_costs,
                  property_tax: valuation.property_tax
                }
              };
            }
            return prop;
          })
        );
        
        setProperties(propertiesWithValuations);
        
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

  // Calculate portfolio totals
  const totalInvestment = properties.reduce((sum, prop) => {
    const v = prop.valuation;
    return sum + ((v?.initial_investment || 0) + (v?.transaction_costs || 0) + (v?.property_tax || 0));
  }, 0);
  // Use DCF cash flows for Year 1 NOI (row with year === 1)
  const totalNOI = aggregateRows.length > 1 ? aggregateRows[1].noi : 0;
  const totalNPV = aggregateRows.length > 0 ? aggregateRows[aggregateRows.length - 1].cumulative_pv : 0;

  return (
    <PageContainer>
      <Breadcrumbs last={portfolioName} />
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: "var(--foreground)" }}
      >
        {portfolioName}
      </h1>

      {/* Properties Overview Section */}
      {!loading && properties.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            Properties in Portfolio <span className="text-base font-semibold text-gray-500">({properties.length})</span>
          </h2>
          <div className="mb-6 flex flex-col gap-2">
            {properties.map((property) => (
              <a
                key={property.id}
                href={`/properties/${property.id}/valuation`}
                className="text-blue-600 hover:underline font-medium"
              >
                {property.address}
              </a>
            ))}
          </div>
          {/* Portfolio Summary */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Portfolio Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: getSummaryColor(-Math.abs(totalInvestment)) }}>
                  £{formatCurrency(-Math.abs(totalInvestment), "")}
                </div>
                <div className="text-sm text-gray-600">Total Investment</div>
              </div>
              <div className="text-center">
                <div 
                  className="text-2xl font-extrabold"
                  style={{ color: getSummaryColor(totalNOI) }}
                >
                  £{formatCurrency(totalNOI, "")}
                </div>
                <div className="text-sm text-gray-600">Total Year 1 NOI</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: getSummaryColor(totalNPV) }}>
                  £{formatCurrency(totalNPV, "")}
                </div>
                <div className="text-sm text-gray-600">Total NPV</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold" style={{ color: getSummaryColor(portfolioIRR ?? 0) }}>
                  {portfolioIRR !== null ? `${portfolioIRR.toFixed(2)}%` : '-'}
                </div>
                <div className="text-sm text-gray-600">IRR</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-4" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      ) : properties.length === 0 ? (
        <div className="mt-4" style={{ color: "var(--text-muted)" }}>
          You have not added any properties yet.
        </div>
      ) : (
        <DcfTable rows={aggregateRows} title="Portfolio DCF Analysis" />
      )}
    </PageContainer>
  );
}
