"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Property } from "@/types/property";
import { propertiesAPI } from "@/lib/api/properties";
import NewPropertyForm from "@/features/properties/NewPropertyForm";
import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";

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
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch property";
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
      <PageContainer>
        <Breadcrumbs last="Edit Property" />
        <div className="text-center text-gray-500">Loading...</div>
      </PageContainer>
    );
  }

  if (error || !property) {
    return (
      <PageContainer>
        <Breadcrumbs last="Edit Property" />
        <div className="text-center text-red-600">
          {error || "Property not found"}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Breadcrumbs last="Edit Property" propertyId={propertyId} />
      <NewPropertyForm property={property} />
    </PageContainer>
  );
}
