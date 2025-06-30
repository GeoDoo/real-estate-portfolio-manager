import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { portfoliosAPI } from './portfolios';

// Define types for test data
interface Portfolio {
  id: string;
  name: string;
}
interface Property {
  id: string;
}

type GetMock = jest.MockedFunction<(url: string) => Promise<Portfolio[] | Portfolio | Property[] | { irr?: number } | object>>;
type PostMock = jest.MockedFunction<(url: string, body: { name: string }) => Promise<Portfolio>>;

jest.mock('@/lib/api', () => {
  const mockGet: GetMock = jest.fn();
  const mockPost: PostMock = jest.fn();
  (globalThis as unknown as { __mockGet: GetMock }).__mockGet = mockGet;
  (globalThis as unknown as { __mockPost: PostMock }).__mockPost = mockPost;
  return {
    api: {
      get: mockGet,
      post: mockPost,
    },
  };
});

const mockGet = (globalThis as unknown as { __mockGet: GetMock }).__mockGet;
const mockPost = (globalThis as unknown as { __mockPost: PostMock }).__mockPost;

describe('portfoliosAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAll fetches all portfolios', async () => {
    mockGet.mockResolvedValue([{ id: '1', name: 'A' }] as Portfolio[]);
    const result = await portfoliosAPI.getAll();
    expect(mockGet).toHaveBeenCalledWith('/api/portfolios');
    expect(result).toEqual([{ id: '1', name: 'A' }]);
  });

  it('create posts new portfolio', async () => {
    mockPost.mockResolvedValue({ id: '2', name: 'B' } as Portfolio);
    const result = await portfoliosAPI.create('B');
    expect(mockPost).toHaveBeenCalledWith('/api/portfolios', { name: 'B' });
    expect(result).toEqual({ id: '2', name: 'B' });
  });

  it('getById fetches portfolio by id', async () => {
    mockGet.mockResolvedValue({ id: '3', name: 'C' } as Portfolio);
    const result = await portfoliosAPI.getById('3');
    expect(mockGet).toHaveBeenCalledWith('/api/portfolios/3');
    expect(result).toEqual({ id: '3', name: 'C' });
  });

  it('getProperties fetches properties for a portfolio', async () => {
    mockGet.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }] as Property[]);
    const result = await portfoliosAPI.getProperties('4');
    expect(mockGet).toHaveBeenCalledWith('/api/portfolios/4/properties');
    expect(result).toEqual([{ id: 'p1' }, { id: 'p2' }]);
  });

  it('getPortfolioIRR fetches IRR and returns value', async () => {
    mockGet.mockResolvedValue({ irr: 0.123 } as { irr: number });
    const result = await portfoliosAPI.getPortfolioIRR('5');
    expect(mockGet).toHaveBeenCalledWith('/api/portfolios/5/irr');
    expect(result).toBe(0.123);
  });

  it('getPortfolioIRR returns null if irr is missing', async () => {
    mockGet.mockResolvedValue({} as object);
    const result = await portfoliosAPI.getPortfolioIRR('6');
    expect(result).toBeNull();
  });

  it('getPortfolioIRR returns null on error', async () => {
    mockGet.mockRejectedValue(new Error('fail'));
    const result = await portfoliosAPI.getPortfolioIRR('7');
    expect(result).toBeNull();
  });
}); 