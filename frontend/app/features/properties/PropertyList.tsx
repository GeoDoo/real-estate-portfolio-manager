"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Property } from "@/types/property";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import Breadcrumbs from "@/components/Breadcrumbs";
import { propertiesAPI } from "@/lib/api/properties";
import { valuationsAPI } from "@/lib/api/valuations";
import { portfoliosAPI, Portfolio } from "@/lib/api/portfolios";
import PageContainer from "@/components/PageContainer";
import Button from "@/components/Button";
import InfoTooltip from "@/components/InfoTooltip";

type RibbonStatus = "loading" | "buy" | "no-buy" | "none";

interface RibbonData {
  status: RibbonStatus;
  npv?: number;
  irr?: number;
}

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ribbons, setRibbons] = useState<Record<string, RibbonData>>({});
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await propertiesAPI.getAll();
        setProperties(data);
        // For each property, fetch valuation and cash flows
        const ribbonsObj: Record<string, RibbonData> = {};
        await Promise.all(
          data.map(async (property) => {
            const valuation = await valuationsAPI.getByPropertyId(property.id);
            // Only treat as having a valuation if all required fields are positive numbers
            const requiredFields = [
              'initial_investment', 'annual_rental_income', 'maintenance', 'property_tax',
              'management_fees', 'transaction_costs', 'annual_rent_growth', 'discount_rate', 'holding_period'
            ];
            const optionalFields = ['service_charge', 'ground_rent', 'insurance'];
            if (!valuation ||
              !requiredFields.every(f => typeof (valuation as Record<string, any>)[f] === 'number' && (valuation as Record<string, any>)[f] > 0) ||
              !optionalFields.every(f => {
                const v = (valuation as Record<string, any>)[f];
                return v === undefined || v === null || (typeof v === 'number' && v >= 0);
              })
            ) {
              return;
            }
            // Only calculate cash flows and IRR if valuation exists and is valid
            const cashFlows = await valuationsAPI.calculateCashFlows(valuation);
            if (!cashFlows || cashFlows.length === 0) {
              // No ribbon if no cash flows
              return;
            }
            const npv = cashFlows[cashFlows.length - 1]?.cumulativePV;
            const netCashFlows = cashFlows.map((row) => row.netCashFlow);
            let irr: number | null = null;
            if (netCashFlows.length > 1) {
              try {
                irr = await valuationsAPI.calculateIRR(netCashFlows);
              } catch {
                irr = null;
              }
            }
            if (npv > 0 && irr && irr > 0) {
              ribbonsObj[property.id] = {
                status: "buy",
                npv,
                irr: irr || undefined,
              };
            } else {
              ribbonsObj[property.id] = {
                status: "no-buy",
                npv,
                irr: irr || undefined,
              };
            }
          }),
        );
        setRibbons(ribbonsObj);
        // Fetch portfolios
        const portfoliosData = await portfoliosAPI.getAll();
        setPortfolios(portfoliosData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch properties";
        setError(errorMessage);
        setProperties([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleEditProperty = (property: Property) => {
    router.push(`/properties/${property.id}/edit`);
  };

  return (
    <>
      <PageContainer>
        <Breadcrumbs last="Properties" propertyId="" />
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: "var(--foreground)" }}
          >
            Properties
          </h1>
          <Link href="/properties/new">
            <Button size="lg">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Property
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center" style={{ color: "var(--text-muted)" }}>
            Loading...
          </div>
        ) : error ? (
          <div className="text-center" style={{ color: "var(--error)" }}>
            {error.includes('CORS') || error.includes('Network')
              ? 'Could not connect to backend. Check CORS or server status.'
              : error}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center" style={{ color: "var(--text-muted)" }}>
            No properties found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {properties.map((property) => {
              // Format the date
              const date = property.created_at
                ? new Date(property.created_at)
                : null;
              const formattedDate = date
                ? date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "";
              const ribbon = ribbons[property.id];
              return (
                <div
                  key={property.id}
                  className="card p-6 min-h-[180px] h-full relative group transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col"
                  style={{
                    borderRadius: 20,
                    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Edit Button - top left */}
                  <button
                    onClick={() => handleEditProperty(property)}
                    className="absolute top-4 left-4 p-1 transition-colors z-30"
                    style={{ color: "var(--text-muted)" }}
                    title="Edit Property"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>

                  {/* BUY Ribbon */}
                  {ribbon && (ribbon.status === "buy" || ribbon.status === "no-buy") && (
                    <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                      <InfoTooltip
                        label={
                          <div
                            className="badge badge-success shadow text-xs font-semibold px-4 py-1 cursor-pointer"
                            style={{
                              background:
                                ribbon.status === "buy"
                                  ? "#10b981" // green for BUY
                                  : "#ef4444", // red for DO NOT BUY
                              color: "white",
                              borderRadius: 9999,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                              letterSpacing: 1,
                            }}
                          >
                            {ribbon.status === "buy"
                              ? "BUY"
                              : "DO NOT BUY"}
                          </div>
                        }
                        tooltip={
                          <span>
                            <b>NPV:</b> <span style={{color: ribbon.npv && ribbon.npv > 0 ? '#10b981' : ribbon.npv && ribbon.npv < 0 ? '#ef4444' : undefined}}>${ribbon.npv?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span><br/>
                            <b>IRR:</b> <span style={{color: ribbon.irr !== undefined && ribbon.irr > 0 ? '#10b981' : ribbon.irr !== undefined && ribbon.irr < 0 ? '#ef4444' : undefined}}>{ribbon.irr !== undefined ? `${ribbon.irr.toFixed(2)}%` : 'N/A'}</span><br/>
                            NPV is the total value of all future cash flows (income minus expenses), discounted to today's value. A positive NPV means the investment is expected to be profitable.
                          </span>
                        }
                      />
                    </div>
                  )}
                  <div className="mb-2 mt-2 flex-1 flex flex-col pt-6">
                    <div className="min-h-[72px]">
                      <Link
                        href={`/properties/${property.id}/valuation`}
                        className="text-2xl font-bold break-words hover:underline transition-colors block"
                        style={{ color: "var(--foreground)" }}
                      >
                        {property.address}
                      </Link>
                    </div>
                    {property.listing_link && (
                      <a
                        href={property.listing_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center hover:underline text-sm break-all transition-colors mt-3"
                        style={{
                          color: "#3777e3",
                          opacity: 0.85,
                          fontWeight: 500,
                        }}
                      >
                        View Listing
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="ml-1 h-4 w-4 inline"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 3h7m0 0v7m0-7L10 14m-7 7h7a2 2 0 002-2v-7"
                          />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div>
                    <div
                      className="flex justify-between items-center text-xs mb-2"
                      style={{ color: "var(--text-muted)", fontWeight: 500 }}
                    >
                      <span>Created:</span>
                      <span>{formattedDate}</span>
                    </div>
                    {/* Portfolio Assignment Controls */}
                    <div className="w-full">
                      <select
                        className="input w-full"
                        value={property.portfolio_id || ""}
                        onChange={async (e) => {
                          const portfolioId = e.target.value || null;
                          try {
                            await propertiesAPI.assignToPortfolio(
                              property.id,
                              portfolioId,
                            );
                            setProperties((prev) =>
                              prev.map((p) =>
                                p.id === property.id
                                  ? {
                                      ...p,
                                      portfolio_id: portfolioId || undefined,
                                    }
                                  : p,
                              ),
                            );
                            if (portfolioId) {
                              router.push(`/portfolios/${portfolioId}`);
                            }
                          } catch (error) {
                            console.error("Failed to update property:", error);
                          }
                        }}
                        style={{
                          width: "100%",
                          borderRadius: 12,
                          fontWeight: 500,
                          fontSize: "1rem",
                          lineHeight: "1.5",
                        }}
                      >
                        <option value="">No Portfolio</option>
                        {portfolios.map((portfolio) => (
                          <option key={portfolio.id} value={portfolio.id}>
                            {portfolio.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </>
  );
}
