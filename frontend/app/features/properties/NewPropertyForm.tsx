"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Property } from '@/types/property';
import { propertiesAPI } from '@/lib/api/properties';
import Button from '@/components/Button';

interface NewPropertyFormProps {
  property?: Property; // Optional - if provided, we're editing
}

export default function NewPropertyForm({ property }: NewPropertyFormProps) {
  const router = useRouter();
  const isEditing = !!property;
  const [form, setForm] = useState({
    address: '',
    listing_link: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with property data if editing
  useEffect(() => {
    if (property) {
      setForm({
        address: property.address,
        listing_link: property.listing_link || '',
      });
    }
  }, [property]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditing && property) {
        // Update existing property
        await propertiesAPI.update(property.id, form);
        router.push('/');
      } else {
        // Create new property
        const newProperty = await propertiesAPI.create(form);
        router.push(`/properties/${newProperty.id}/valuation`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 
        isEditing ? 'Failed to update property' : 'Failed to create property';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Property' : 'Add New Property'}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                placeholder="e.g., 123 Main St, Apt 4B, New York, NY 10001"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Link (optional)
              </label>
              <input
                type="url"
                name="listing_link"
                value={form.listing_link}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
                placeholder="e.g., https://www.rightmove.co.uk/properties/123456"
                disabled={loading}
                pattern="https?://.*"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading}
            >
              {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Property' : 'Add Property')}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
} 