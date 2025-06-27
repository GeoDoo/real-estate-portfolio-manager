"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { config } from '../../config';

export default function NewPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch(`${config.apiBaseUrl}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        throw new Error('Failed to create property');
      }

      const property = await res.json();
      router.push(`/properties/${property.id}/valuation`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Property</h1>
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
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 123 Main St, Apt 4B, New York, NY 10001"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Property'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 