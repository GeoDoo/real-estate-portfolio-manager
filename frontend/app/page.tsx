"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Property } from '../types/dcf';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from './Breadcrumbs';
import { config } from './config';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${config.apiBaseUrl}/api/properties`, {
          credentials: 'include'
        });
        if (!res.ok) {
          setError('Failed to fetch properties');
          setProperties([]);
          setLoading(false);
          return;
        }
        const json = await res.json();
        setProperties(Array.isArray(json) ? json : []);
      } catch {
        setError('Failed to fetch properties');
        setProperties([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Handler for viewing valuation
  const handleViewValuation = (propertyId: string) => {
    router.push(`/properties/${propertyId}/valuation`);
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-[30px] px-4 pb-12">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs last="Properties" propertyId="" />
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <Link
            href="/properties/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 mb-2">{property.address}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewValuation(property.id)}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:shadow text-blue-600 transition"
                    title="View valuation"
                  >
                    <EyeIcon className="w-4 h-4" aria-hidden="true" />
                    <span className="sr-only">View</span>
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Added: {property.created_at}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 