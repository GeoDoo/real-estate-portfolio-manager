import { api } from "@/lib/api";

export interface ComparableSale {
  id: string;
  address: string;
  postcode: string;
  sale_price: number;
  sale_date: string;
  property_type: string;
  new_build: boolean;
  estate_type: string;
  source: string;
  latitude?: number;
  longitude?: number;
}

export interface MarketDataSummary {
  total_sales: number;
  average_price: number;
  min_price: number;
  max_price: number;
  price_range: number;
}

export interface MarketDataResponse {
  sales: ComparableSale[];
  summary: MarketDataSummary;
  postcode: string;
  source: string;
}

export const marketDataAPI = {
  // Get comparable sales from Land Registry
  getComparableSales: async (postcode: string, limit: number = 50): Promise<MarketDataResponse> => {
    try {
      const response = await api.get<MarketDataResponse>(
        `/api/market-data/comparables/${postcode}?limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch comparable sales:', error);
      throw error;
    }
  },

  // Extract postcode from UK address
  extractPostcode: (address: string): string | null => {
    // UK postcode regex pattern
    const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i;
    const match = address.match(postcodeRegex);
    return match ? match[0].toUpperCase() : null;
  },

  // Format sale date for display
  formatSaleDate: (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  },

  // Calculate price per square foot (if square footage available)
  calculatePricePerSqFt: (salePrice: number, squareFeet?: number): number | null => {
    if (!squareFeet || squareFeet <= 0) return null;
    return salePrice / squareFeet;
  },

  // Filter sales by date range
  filterSalesByDateRange: (sales: ComparableSale[], daysBack: number): ComparableSale[] => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    return sales.filter(sale => {
      try {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= cutoffDate;
      } catch {
        return false;
      }
    });
  }
}; 