"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Property } from '@/types/dcf';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '@/components/Breadcrumbs';
import { propertiesAPI } from '@/lib/api/properties';
import { valuationsAPI } from '@/lib/api/valuations';

export default function HomePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ribbons, setRibbons] = useState<Record<string, { status: 'loading' | 'buy' | 'no-buy' | 'none' }>>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const data = await propertiesAPI.getAll();
        setProperties(data);
        // For each property, fetch valuation and cash flows
        const ribbonsObj: Record<string, { status: 'loading' | 'buy' | 'no-buy' | 'none' }> = {};
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
            ribbonsObj[property.id] = { status: 'buy' };
          } else {
            ribbonsObj[property.id] = { status: 'no-buy' };
          }
        }));
        setRibbons(ribbonsObj);
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

  return (
    <main className="min-h-screen bg-gray-50 pt-[30px] px-4 pb-12">
      <div className="max-w-6xl mx-auto">
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
                    <div
                      className={`absolute top-0 right-0 px-6 py-2 rounded-tr-2xl rounded-bl-2xl text-base font-bold shadow-lg z-20 ${
                        ribbon.status === 'buy' ? 'bg-green-500 text-white' : ribbon.status === 'no-buy' ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-700'
                      }`}
                      style={{ minWidth: 120, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
                    >
                      {ribbon.status === 'loading' ? '...' : ribbon.status === 'buy' ? 'BUY' : 'DO NOT BUY'}
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
} 