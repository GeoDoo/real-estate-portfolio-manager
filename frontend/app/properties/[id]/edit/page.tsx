"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Property } from '@/types/dcf';
import { propertiesAPI } from '@/lib/api/properties';
import NewPropertyForm from '@/features/properties/NewPropertyForm';

export default function EditPropertyPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const data = await propertiesAPI.getById(propertyId);
        setProperty(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch property';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-red-600">{error || 'Property not found'}</div>
        </div>
      </main>
    );
  }

  return <NewPropertyForm property={property} />;
} 