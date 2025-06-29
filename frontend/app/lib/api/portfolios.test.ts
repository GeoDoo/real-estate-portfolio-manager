import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { portfoliosAPI } from './portfolios';

jest.mock('@/lib/api', () => {
  const mockApi: any = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return { api: mockApi };
});
import { api } from '@/lib/api';

describe('portfoliosAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAll fetches all portfolios', async () => {
    (api.get as any).mockResolvedValue([{ id: '1', name: 'A' }]);
    const result = await portfoliosAPI.getAll();
    expect(api.get).toHaveBeenCalledWith('/api/portfolios');
    expect(result).toEqual([{ id: '1', name: 'A' }]);
  });

  it('create posts new portfolio', async () => {
    (api.post as any).mockResolvedValue({ id: '2', name: 'B' });
    const result = await portfoliosAPI.create('B');
    expect(api.post).toHaveBeenCalledWith('/api/portfolios', { name: 'B' });
    expect(result).toEqual({ id: '2', name: 'B' });
  });

  it('getById fetches portfolio by id', async () => {
    (api.get as any).mockResolvedValue({ id: '3', name: 'C' });
    const result = await portfoliosAPI.getById('3');
    expect(api.get).toHaveBeenCalledWith('/api/portfolios/3');
    expect(result).toEqual({ id: '3', name: 'C' });
  });

  it('getProperties fetches properties for a portfolio', async () => {
    (api.get as any).mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    const result = await portfoliosAPI.getProperties('4');
    expect(api.get).toHaveBeenCalledWith('/api/portfolios/4/properties');
    expect(result).toEqual([{ id: 'p1' }, { id: 'p2' }]);
  });

  it('getPortfolioIRR fetches IRR and returns value', async () => {
    (api.get as any).mockResolvedValue({ irr: 0.123 });
    const result = await portfoliosAPI.getPortfolioIRR('5');
    expect(api.get).toHaveBeenCalledWith('/api/portfolios/5/irr');
    expect(result).toBe(0.123);
  });

  it('getPortfolioIRR returns null if irr is missing', async () => {
    (api.get as any).mockResolvedValue({});
    const result = await portfoliosAPI.getPortfolioIRR('6');
    expect(result).toBeNull();
  });

  it('getPortfolioIRR returns null on error', async () => {
    (api.get as any).mockRejectedValue(new Error('fail'));
    const result = await portfoliosAPI.getPortfolioIRR('7');
    expect(result).toBeNull();
  });
}); 