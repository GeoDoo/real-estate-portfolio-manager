import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { DCFRow } from '@/types/cashflow';

// Place the mock at the very top
const mockGet: any = jest.fn();
const mockPost: any = jest.fn();
const mockPut: any = jest.fn();

jest.mock('@/lib/api', () => ({
  api: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
  },
  APIError: class APIError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

describe('valuationsAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('getByPropertyId returns valuation data', async () => {
    mockGet.mockResolvedValue({ data: { id: '123', property_id: 'abc' } });
    const { valuationsAPI } = await import('./valuations');
    const result = await valuationsAPI.getByPropertyId('abc');
    expect(mockGet).toHaveBeenCalledWith('/api/properties/abc/valuation');
    expect(result).toEqual({ id: '123', property_id: 'abc' });
  });

  it('getByPropertyId returns null for 404', async () => {
    const { APIError } = await import('@/lib/api');
    const error = new APIError('Not found', 404);
    mockGet.mockRejectedValue(error);
    const { valuationsAPI } = await import('./valuations');
    const result = await valuationsAPI.getByPropertyId('abc');
    expect(result).toBeNull();
  });

  it('getByPropertyId throws other API errors', async () => {
    const { APIError } = await import('@/lib/api');
    const error = new APIError('Server error', 500);
    mockGet.mockRejectedValue(error);
    const { valuationsAPI } = await import('./valuations');
    await expect(valuationsAPI.getByPropertyId('abc')).rejects.toThrow('Server error');
  });

  it('save sends data and returns updated valuation', async () => {
    mockPut.mockResolvedValue({ id: '123', property_id: 'abc', purchase_price: 100000 });
    const { valuationsAPI } = await import('./valuations');
    const result = await valuationsAPI.save('abc', { purchase_price: 100000 } as Partial<DCFRow>);
    expect(mockPut).toHaveBeenCalledWith('/api/properties/abc/valuation', { purchase_price: 100000 });
    expect(result).toEqual({ id: '123', property_id: 'abc', purchase_price: 100000 });
  });

  it('calculateCashFlows returns cash flow rows', async () => {
    mockPost.mockResolvedValue({ cashFlows: [{ year: 0, revenue: 100 }] });
    const { valuationsAPI } = await import('./valuations');
    const result = await valuationsAPI.calculateCashFlows({} as DCFRow);
    expect(mockPost).toHaveBeenCalledWith('/api/cashflows/calculate', {});
    expect(result).toEqual([{ year: 0, revenue: 100 }]);
  });

  it('calculateIRR returns IRR value', async () => {
    mockPost.mockResolvedValue({ irr: 0.123 });
    const { valuationsAPI } = await import('./valuations');
    const result = await valuationsAPI.calculateIRR([1, 2, 3]);
    expect(mockPost).toHaveBeenCalledWith('/api/cashflows/irr', { cash_flows: [1, 2, 3] });
    expect(result).toBe(0.123);
  });

  it('getCashFlows returns cash flow rows', async () => {
    mockGet.mockResolvedValue({ cashFlows: [{ year: 1, revenue: 200 }] });
    const { valuationsAPI } = await import('./valuations');
    const result = await valuationsAPI.getCashFlows('pid', 'vid');
    expect(mockGet).toHaveBeenCalledWith('/api/properties/pid/valuation/cashflows/vid');
    expect(result).toEqual([{ year: 1, revenue: 200 }]);
  });
}); 