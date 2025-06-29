import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { valuationsAPI } from './valuations';

jest.mock('@/lib/api', () => {
  // Create a mock APIError that will work with instanceof checks
  class MockAPIError extends Error {
    status: number;
    constructor(message: string, status: number = 500) {
      super(message);
      this.status = status;
      this.name = 'APIError';
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockApi: any = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  };
  
  return {
    api: mockApi,
    APIError: MockAPIError,
  };
});

// Import the mocked api and APIError after jest.mock
import { api, APIError } from '@/lib/api';

describe('valuationsAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getByPropertyId returns valuation data', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.get as any).mockResolvedValue({ id: '123', property_id: 'abc' });
    const result = await valuationsAPI.getByPropertyId('abc');
    expect(api.get).toHaveBeenCalledWith('/api/properties/abc/valuation');
    expect(result).toEqual({ id: '123', property_id: 'abc' });
  });

  it('getByPropertyId returns null for 404', async () => {
    const error = new APIError('Not found', 404);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.get as any).mockRejectedValue(error);
    const result = await valuationsAPI.getByPropertyId('abc');
    expect(result).toBeNull();
  });

  it('getByPropertyId throws other API errors', async () => {
    const error = new APIError('Server error', 500);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.get as any).mockRejectedValue(error);
    await expect(valuationsAPI.getByPropertyId('abc')).rejects.toThrow('Server error');
  });

  it('save sends data and returns updated valuation', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.put as any).mockResolvedValue({ id: '123', property_id: 'abc', purchase_price: 100000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await valuationsAPI.save('abc', { purchase_price: 100000 } as any);
    expect(api.put).toHaveBeenCalledWith('/api/properties/abc/valuation', { purchase_price: 100000 });
    expect(result).toEqual({ id: '123', property_id: 'abc', purchase_price: 100000 });
  });

  it('calculateCashFlows returns cash flow rows', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.post as any).mockResolvedValue({ cashFlows: [{ year: 0, revenue: 100 }] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await valuationsAPI.calculateCashFlows({} as any);
    expect(api.post).toHaveBeenCalledWith('/api/cashflows/calculate', {});
    expect(result).toEqual([{ year: 0, revenue: 100 }]);
  });

  it('calculateIRR returns IRR value', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.post as any).mockResolvedValue({ irr: 0.123 });
    const result = await valuationsAPI.calculateIRR([1, 2, 3]);
    expect(api.post).toHaveBeenCalledWith('/api/cashflows/irr', { cash_flows: [1, 2, 3] });
    expect(result).toBe(0.123);
  });

  it('getCashFlows returns cash flow rows', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (api.get as any).mockResolvedValue({ cashFlows: [{ year: 1, revenue: 200 }] });
    const result = await valuationsAPI.getCashFlows('pid', 'vid');
    expect(api.get).toHaveBeenCalledWith('/api/properties/pid/valuation/cashflows/vid');
    expect(result).toEqual([{ year: 1, revenue: 200 }]);
  });
}); 