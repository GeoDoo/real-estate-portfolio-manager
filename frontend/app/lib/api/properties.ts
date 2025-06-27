import { api, APIError } from '@/lib/api';
import { Property } from '@/types/dcf';

// Property API functions
export const propertiesAPI = {
  // Get all properties
  getAll: async (): Promise<Property[]> => {
    try {
      return await api.get<Property[]>('/api/properties');
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch properties');
    }
  },

  // Create a new property
  create: async (data: { address: string; listing_link?: string }): Promise<Property> => {
    try {
      return await api.post<Property>('/api/properties', data);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to create property');
    }
  },

  // Update a property
  update: async (id: string, data: { address: string; listing_link?: string }): Promise<Property> => {
    try {
      return await api.put<Property>(`/api/properties/${id}`, data);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to update property');
    }
  },

  // Get a specific property by ID
  getById: async (id: string): Promise<Property> => {
    try {
      return await api.get<Property>(`/api/properties/${id}`);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch property');
    }
  },

  // Delete a property
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/properties/${id}`);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to delete property');
    }
  },
}; 