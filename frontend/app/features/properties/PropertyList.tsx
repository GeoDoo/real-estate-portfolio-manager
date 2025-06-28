"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Property } from '@/types/property';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '@/components/Breadcrumbs';
import { propertiesAPI } from '@/lib/api/properties';
import { valuationsAPI } from '@/lib/api/valuations';
import { portfoliosAPI, Portfolio } from '@/lib/api/portfolios';
import PageContainer from '@/components/PageContainer';

type RibbonStatus = 'loading' | 'buy' | 'no-buy' | 'none';

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
        await Promise.all(data.map(async (property) => {
          ribbonsObj[property.id] = { status: 'loading' };
          const valuation = await valuationsAPI.getByPropertyId(property.id);
          if (!valuation) {
            ribbonsObj[property.id] = { status: 'none' };
            return;
          }
          const cashFlows = await valuationsAPI.calculateCashFlows(valuation);
          const npv = cashFlows[cashFlows.length - 1]?.cumulativePV;
          const netCashFlows = cashFlows.map(row => row.netCashFlow);
          let irr: number | null = null;
          try {
            irr = await valuationsAPI.calculateIRR(netCashFlows);
          } catch {
            irr = null;
          }
          if (npv > 0 && irr && irr > 0) {
            ribbonsObj[property.id] = { status: 'buy', npv, irr: irr || undefined };
          } else {
            ribbonsObj[property.id] = { status: 'no-buy', npv, irr: irr || undefined };
          }
        }));
        setRibbons(ribbonsObj);
        // Fetch portfolios
        const portfoliosData = await portfoliosAPI.getAll();
        setPortfolios(portfoliosData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch properties';
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

  const renderRecommendationTooltip = (ribbon: RibbonData) => {
    if (ribbon.status === 'loading') return <span>Calculating...</span>;
    if (ribbon.status === 'none') return <span>No valuation data available</span>;

    const npv = ribbon.npv ?? 0;
    const irr = ribbon.irr ?? 0;
    const npvStatus = npv > 0 ? 'positive' : npv < 0 ? 'negative' : 'zero';
    const irrStatus = irr > 0 ? 'positive' : irr < 0 ? 'negative' : 'zero';

    if (ribbon.status === 'buy') {
      return (
        <div>
          <div className="font-semibold mb-2">BUY Recommendation</div>
          <ul className="mb-2 list-disc list-inside space-y-1">
            <li>NPV: <span className="font-mono">${npv.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> <span className="text-green-400">({npvStatus})</span></li>
            <li>IRR: <span className="font-mono">{irr.toFixed(2)}%</span> <span className="text-green-400">({irrStatus})</span></li>
          </ul>
          <div>This property is recommended because both NPV and IRR are positive, indicating a profitable investment under your assumptions.</div>
        </div>
      );
    } else {
      const reasons = [];
      if (npv <= 0) {
        reasons.push(<li key="npv">NPV: <span className="font-mono">${npv.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> <span className="text-red-400">({npvStatus}, not profitable)</span></li>);
      }
      if (irr <= 0) {
        reasons.push(<li key="irr">IRR: <span className="font-mono">{irr.toFixed(2)}%</span> <span className="text-red-400">({irrStatus}, below required return)</span></li>);
      }
      if (reasons.length === 0) {
        reasons.push(<li key="other">Does not meet investment criteria</li>);
      }
      return (
        <div>
          <div className="font-semibold mb-2">DO NOT BUY Recommendation</div>
          <ul className="mb-2 list-disc list-inside space-y-1">{reasons}</ul>
          <div>This property is not recommended because one or both key metrics are not positive.<br/>Consider adjusting your assumptions or looking for other opportunities.</div>
        </div>
      );
    }
  };

  return (
    <>
      <PageContainer>
        <Breadcrumbs last="Properties" propertyId="" />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <Link
            href="/properties/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#00cfa6')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Property
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : properties.length === 0 ? (
          <div className="text-center text-gray-500">No properties found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              // Format the date
              const date = property.created_at ? new Date(property.created_at) : null;
              const formattedDate = date ? date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              const ribbon = ribbons[property.id];
              return (
                <div
                  key={property.id}
                  className="bg-white rounded-lg shadow-md p-8 min-h-[180px] hover:shadow-lg transition-shadow block focus:outline-none focus:ring-2 relative"
                  style={{ textDecoration: 'none', '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                >
                  {/* Edit Button - top left */}
                  <button
                    onClick={() => handleEditProperty(property)}
                    className="absolute top-0 left-0 m-2 p-1 text-gray-400 hover:text-gray-600 transition-colors z-30"
                    title="Edit Property"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  
                  {/* Ribbon */}
                  {ribbon && ribbon.status !== 'none' && (
                    <div className="absolute top-0 right-0 z-30 group" style={{ minWidth: 120 }}>
                      <div
                        className={`px-6 py-2 rounded-tr-2xl rounded-bl-2xl text-base font-bold shadow-lg cursor-help ${
                          ribbon.status === 'buy' ? 'bg-green-500 text-white' : ribbon.status === 'no-buy' ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-700'
                        }`}
                        style={{ textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                      >
                        {ribbon.status === 'loading' ? '...' : ribbon.status === 'buy' ? 'BUY' : 'DO NOT BUY'}
                      </div>
                      {/* Tooltip */}
                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{top: '100%'}}>
                        <div className="bg-gray-900 text-white text-[15px] leading-snug rounded-lg px-4 py-3 shadow-2xl max-w-xs min-w-[200px] border border-gray-700 relative animate-fadein whitespace-normal">
                          {renderRecommendationTooltip(ribbon)}
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-l border-t border-gray-700 transform rotate-45 shadow-sm"></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mb-6 mt-4">
                    <Link
                      href={`/properties/${property.id}/valuation`}
                      className="text-2xl font-bold text-gray-900 mb-2 break-words hover:underline"
                      style={{ display: 'inline-block' }}
                    >
                      {property.address}
                    </Link>
                    {property.listing_link && (
                      <a
                        href={property.listing_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:underline text-sm break-all"
                        style={{ wordBreak: 'break-all' }}
                      >
                        View Listing
                        <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14m-7 7h7a2 2 0 002-2v-7" /></svg>
                      </a>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formattedDate && `Added: ${formattedDate}`}
                  </div>
                  {/* Add to Portfolio - simple inline */}
                  <div className="mt-6 flex items-center gap-2">
                    {property.portfolio_id ? (
                      <>
                        <span className="text-gray-700 text-base">In portfolio:</span>
                        <span className="font-semibold text-blue-700">
                          {portfolios.find(p => p.id === property.portfolio_id)?.name || 'Unknown'}
                        </span>
                        <button
                          className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium border border-red-200"
                          onClick={async () => {
                            await propertiesAPI.assignToPortfolio(property.id, null);
                            setProperties(prev => prev.map(p => p.id === property.id ? { ...p, portfolio_id: undefined } : p));
                          }}
                        >Remove</button>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-700 text-base">Add to portfolio:</span>
                        <select
                          className="border border-gray-300 rounded px-3 py-1 text-base text-gray-900 focus:ring-2 focus:border-transparent"
                          value=""
                          onChange={async e => {
                            const portfolioId = e.target.value;
                            if (portfolioId) {
                              await propertiesAPI.assignToPortfolio(property.id, portfolioId);
                              router.push(`/portfolios/${portfolioId}`);
                            }
                          }}
                        >
                          <option value="" disabled>Select...</option>
                          {portfolios.length > 0 ? (
                            portfolios.map(portfolio => (
                              <option key={portfolio.id} value={portfolio.id}>{portfolio.name}</option>
                            ))
                          ) : (
                            <option value="" disabled>No portfolios. Create one first.</option>
                          )}
                        </select>
                        {portfolios.length === 0 && (
                          <Link href="/portfolios" className="text-blue-600 underline ml-2">Create one</Link>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
      <style jsx global>{`
@keyframes fadein {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadein {
  animation: fadein 0.25s ease;
}
`}</style>
    </>
  );
} 