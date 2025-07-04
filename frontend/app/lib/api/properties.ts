import { apiRequest } from "@/lib/api";
import { config } from "@/config";
import { Property } from "@/types/property";

const BASE = config.apiBaseUrl;

// Property API functions
export const propertiesAPI = {
  // Get all properties
  getAll: async (): Promise<Property[]> => {
    const response = await apiRequest<{ items: Property[] }>(`${BASE}/api/properties`);
    return response.items;
  },

  // Create a new property
  create: async (data: {
    address: string;
    postcode: string;
    listing_link?: string;
  }): Promise<Property> => {
    const response = await apiRequest<{ data: Property }>(`${BASE}/api/properties`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Update a property
  update: async (
    id: string,
    data: { address: string; postcode: string; listing_link?: string },
  ): Promise<Property> => {
    const response = await apiRequest<{ data: Property }>(`${BASE}/api/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Get a specific property by ID
  getById: async (id: string): Promise<Property> => {
    const response = await apiRequest<{ data: Property }>(`${BASE}/api/properties/${id}`);
    return response.data;
  },

  // Delete a property
  delete: async (id: string): Promise<void> => {
    await apiRequest(`${BASE}/api/properties/${id}`, { method: "DELETE" });
  },

  assignToPortfolio: async (propertyId: string, portfolioId: string | null) => {
    return apiRequest(`${BASE}/api/properties/${propertyId}`, {
      method: "PATCH",
      body: JSON.stringify({ portfolio_id: portfolioId }),
    });
  },
};
