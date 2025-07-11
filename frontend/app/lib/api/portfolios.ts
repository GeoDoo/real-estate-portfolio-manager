import { api } from "@/lib/api";
import { Property } from "@/types/property";

export interface Portfolio {
  id: string;
  name: string;
}

export const portfoliosAPI = {
  // List all portfolios
  getAll: async (): Promise<Portfolio[]> => {
    const response = await api.get<{ items: Portfolio[] }>("/api/portfolios");
    return response.items;
  },

  // Create a new portfolio
  create: async (name: string): Promise<Portfolio> => {
    const response = await api.post<{ data: Portfolio }>("/api/portfolios", {
      name,
    });
    return response.data;
  },

  // Get a portfolio by id
  getById: async (id: string): Promise<Portfolio> => {
    const response = await api.get<{ data: Portfolio }>(
      `/api/portfolios/${id}`,
    );
    return response.data;
  },

  // Get all properties in a portfolio
  getProperties: async (id: string): Promise<Property[]> => {
    const response = await api.get<{ items: Property[] }>(
      `/api/portfolios/${id}/properties`,
    );
    return response.items;
  },

  // Get IRR for a portfolio (use shared api.get for consistency)
  getPortfolioIRR: async (id: string): Promise<number | null> => {
    try {
      const data = await api.get<{ irr: number }>(`/api/portfolios/${id}/irr`);
      return typeof data.irr === "number" ? data.irr : null;
    } catch {
      return null;
    }
  },

  // Get payback period for a portfolio
  getPortfolioPayback: async (
    id: string,
  ): Promise<{
    simple_payback: number | null;
    discounted_payback: number | null;
  } | null> => {
    try {
      const data = await api.get<{
        simple_payback: number | null;
        discounted_payback: number | null;
      }>(`/api/portfolios/${id}/payback`);
      return data;
    } catch {
      return null;
    }
  },
};
