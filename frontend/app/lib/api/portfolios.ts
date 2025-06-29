import { api } from "@/lib/api";

export interface Portfolio {
  id: string;
  name: string;
}

export const portfoliosAPI = {
  // List all portfolios
  getAll: async (): Promise<Portfolio[]> => {
    return await api.get<Portfolio[]>("/api/portfolios");
  },

  // Create a new portfolio
  create: async (name: string): Promise<Portfolio> => {
    return await api.post<Portfolio>("/api/portfolios", { name });
  },

  // Get a portfolio by id
  getById: async (id: string): Promise<Portfolio> => {
    return await api.get<Portfolio>(`/api/portfolios/${id}`);
  },

  // Get all properties in a portfolio
  getProperties: async (id: string) => {
    return await api.get(`/api/portfolios/${id}/properties`);
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
};
