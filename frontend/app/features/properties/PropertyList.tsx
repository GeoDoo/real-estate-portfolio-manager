"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Property } from '../../../types/dcf';
import { PlusIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '../../components/Breadcrumbs';
import { config } from '../../config';

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              return (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}/valuation`}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow block focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="mb-4">
                    <p className="text-xl font-bold text-gray-900 mb-2 break-words">{property.address}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formattedDate && `Added: ${formattedDate}`}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
} 