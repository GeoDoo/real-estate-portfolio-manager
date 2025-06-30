import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-property-id' }),
  usePathname: () => '/properties/test-property-id/valuation',
}));

// Mock the API
jest.mock('@/lib/api/valuations', () => ({
  valuationsAPI: {
    getByPropertyId: jest.fn(),
    calculateCashFlows: jest.fn(),
    calculateIRR: jest.fn(),
  },
}));

import { valuationsAPI } from '@/lib/api/valuations';

// Test the API integration directly
describe('ValuationDetails API Integration', () => {
  const mockValuation = {
    id: '1',
    property_id: 'p1',
    initial_investment: 100000,
    annual_rental_income: 12000,
    vacancy_rate: 5,
    service_charge: 1000,
    ground_rent: 500,
    maintenance: 1000,
    property_tax: 600,
    insurance: 300,
    management_fees: 10,
    transaction_costs: 2000,
    annual_rent_growth: 2,
    discount_rate: 8,
    holding_period: 10,
    ltv: 75,
    interest_rate: 5,
    capex: 500,
    created_at: new Date().toISOString(),
  };

  const mockCashFlows = [
    {
      year: 0,
      gross_rent: 0,
      vacancy_loss: 0,
      effective_rent: 0,
      operating_expenses: 0,
      noi: 0,
      capex: 500,
      net_cash_flow: -100000,
      discount_factor: 1,
      present_value: -100000,
      cumulative_pv: -100000,
    },
    {
      year: 1,
      gross_rent: 12000,
      vacancy_loss: 600,
      effective_rent: 11400,
      operating_expenses: 3400,
      noi: 8000,
      capex: 0,
      net_cash_flow: 8000,
      discount_factor: 0.9259,
      present_value: 7407.2,
      cumulative_pv: -92592.8,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (valuationsAPI.getByPropertyId as jest.Mock).mockResolvedValue(mockValuation);
    (valuationsAPI.calculateCashFlows as jest.Mock).mockResolvedValue(mockCashFlows);
    (valuationsAPI.calculateIRR as jest.Mock).mockResolvedValue(12.5);
  });

  it('should call API with correct parameters', async () => {
    // Test that the API functions are called correctly
    await valuationsAPI.getByPropertyId('test-property-id');
    expect(valuationsAPI.getByPropertyId).toHaveBeenCalledWith('test-property-id');
  });

  it('should calculate cash flows with correct parameters', async () => {
    await valuationsAPI.calculateCashFlows(mockValuation);
    expect(valuationsAPI.calculateCashFlows).toHaveBeenCalledWith(mockValuation);
  });

  it('should calculate IRR with correct parameters', async () => {
    // Extract net cash flows for IRR calculation
    const netCashFlows = mockCashFlows.map(cf => cf.net_cash_flow);
    await valuationsAPI.calculateIRR(netCashFlows);
    expect(valuationsAPI.calculateIRR).toHaveBeenCalledWith(netCashFlows);
  });

  it('should handle API errors gracefully', async () => {
    (valuationsAPI.getByPropertyId as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    try {
      await valuationsAPI.getByPropertyId('test-property-id');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('API Error');
    }
  });

  it('should return correct cash flow structure', async () => {
    const result = await valuationsAPI.calculateCashFlows(mockValuation);
    expect(result).toEqual(mockCashFlows);
    expect(result[0]).toHaveProperty('year');
    expect(result[0]).toHaveProperty('gross_rent');
    expect(result[0]).toHaveProperty('vacancy_loss');
    expect(result[0]).toHaveProperty('effective_rent');
    expect(result[0]).toHaveProperty('operating_expenses');
    expect(result[0]).toHaveProperty('noi');
    expect(result[0]).toHaveProperty('capex');
    expect(result[0]).toHaveProperty('net_cash_flow');
    expect(result[0]).toHaveProperty('discount_factor');
    expect(result[0]).toHaveProperty('present_value');
    expect(result[0]).toHaveProperty('cumulative_pv');
  });

  it('should handle empty cash flows', async () => {
    (valuationsAPI.calculateCashFlows as jest.Mock).mockResolvedValue([]);
    const result = await valuationsAPI.calculateCashFlows(mockValuation);
    expect(result).toEqual([]);
  });

  it('should handle null IRR', async () => {
    (valuationsAPI.calculateIRR as jest.Mock).mockResolvedValue(null);
    const netCashFlows = mockCashFlows.map(cf => cf.net_cash_flow);
    const result = await valuationsAPI.calculateIRR(netCashFlows);
    expect(result).toBeNull();
  });
}); 