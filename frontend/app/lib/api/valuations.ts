import { api, APIError } from '@/lib/api';
import { DCFRow, CashFlowRow } from '@/types/dcf';

// Valuation API functions
export const valuationsAPI = {
  // Get valuation for a property
  getByPropertyId: async (propertyId: string): Promise<DCFRow | null> => {
    try {
      return await api.get<DCFRow>(`/api/properties/${propertyId}/valuation`);
    } catch (error) {
      if (error instanceof APIError && error.status === 404) {
        return null; // No valuation exists yet
      }
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch valuation');
    }
  },

  // Create or update valuation for a property
  save: async (propertyId: string, data: Partial<DCFRow>): Promise<DCFRow> => {
    try {
      return await api.put<DCFRow>(`/api/properties/${propertyId}/valuation`, data);
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to save valuation');
    }
  },

  // Calculate cash flows for a valuation
  calculateCashFlows: async (valuationData: DCFRow): Promise<CashFlowRow[]> => {
    try {
      const response = await api.post<{ cashFlows: CashFlowRow[] }>('/api/cashflows/calculate', valuationData);
      return response.cashFlows || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to calculate cash flows');
    }
  },

  // Calculate IRR for cash flows
  calculateIRR: async (cashFlows: number[]): Promise<number> => {
    try {
      const response = await api.post<{ irr: number }>('/api/cashflows/irr', { cash_flows: cashFlows });
      return response.irr;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to calculate IRR');
    }
  },

  // Get cash flows for a specific valuation
  getCashFlows: async (propertyId: string, valuationId: string): Promise<CashFlowRow[]> => {
    try {
      const response = await api.get<{ cashFlows: CashFlowRow[] }>(`/api/properties/${propertyId}/valuation/cashflows/${valuationId}`);
      return response.cashFlows || [];
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Failed to fetch cash flows');
    }
  },
}; 