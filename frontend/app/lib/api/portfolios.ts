import { api } from '@/lib/api';

export interface Portfolio {
  id: string;
  name: string;
}

export const portfoliosAPI = {
  // List all portfolios
  getAll: async (): Promise<Portfolio[]> => {
    return await api.get<Portfolio[]>('/api/portfolios');
  },

  // Create a new portfolio
  create: async (name: string): Promise<Portfolio> => {
    return await api.post<Portfolio>('/api/portfolios', { name });
  },
}; 