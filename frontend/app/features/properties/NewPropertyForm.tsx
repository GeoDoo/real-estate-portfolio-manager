"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Property } from "@/types/property";
import { propertiesAPI } from "@/lib/api/properties";
import Button from "@/components/Button";
import PageContainer from "@/components/PageContainer";
import InfoTooltip from "@/components/InfoTooltip";

interface NewPropertyFormProps {
  property?: Property; // Optional - if provided, we're editing
}

export default function NewPropertyForm({ property }: NewPropertyFormProps) {
  const router = useRouter();
  const isEditing = !!property;
  const [form, setForm] = useState({
    address: "",
    postcode: "",
    listing_link: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with property data if editing
  useEffect(() => {
    if (property) {
      setForm({
        address: property.address,
        postcode: property.postcode || "",
        listing_link: property.listing_link || "",
      });
    }
  }, [property]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
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
        router.push("/");
      } else {
        // Create new property
        const newProperty = await propertiesAPI.create(form);
        router.push(`/properties/${newProperty.id}/valuation`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : isEditing
            ? "Failed to update property"
            : "Failed to create property";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Address
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="input"
              placeholder="e.g., 123 Main St, Apt 4B, New York, NY 10001"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-2 flex items-center gap-1"
              style={{ color: "var(--foreground)" }}
            >
              Postcode
              <InfoTooltip
                label={<span className="text-gray-400">&#9432;</span>}
                tooltip={
                  "Postcode is required to fetch comparable sales from Land Registry and other market data sources. Please enter the full UK postcode."
                }
              />
            </label>
            <input
              type="text"
              name="postcode"
              value={form.postcode}
              onChange={handleChange}
              className="input"
              placeholder="e.g., W8 4PX"
              required
              disabled={loading}
              pattern="[A-Za-z]{1,2}[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}"
              title="Please enter a valid UK postcode."
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Listing Link (optional)
            </label>
            <input
              type="url"
              name="listing_link"
              value={form.listing_link}
              onChange={handleChange}
              className="input"
              placeholder="e.g., https://www.rightmove.co.uk/properties/123456"
              disabled={loading}
              pattern="https?://.*"
            />
          </div>
          {error && (
            <div className="text-sm" style={{ color: "var(--error)" }}>
              {error}
            </div>
          )}
          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading
              ? isEditing
                ? "Updating..."
                : "Adding..."
              : isEditing
                ? "Update Property"
                : "Add Property"}
          </Button>
        </form>
      </div>
    </PageContainer>
  );
}
