import { describe, it, expect, jest, afterEach } from '@jest/globals';
import { propertiesAPI } from './properties';

jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn(),
  config: { apiBaseUrl: 'http://localhost:5050' },
}));
import { apiRequest } from '@/lib/api';

describe('propertiesAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAll fetches all properties', async () => {
    (apiRequest as any).mockResolvedValue([{ id: '1', address: 'A' }]);
    const result = await propertiesAPI.getAll();
    expect(apiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties');
    expect(result).toEqual([{ id: '1', address: 'A' }]);
  });

  it('create posts new property', async () => {
    (apiRequest as any).mockResolvedValue({ id: '2', address: 'B' });
    const data = { address: 'B', listing_link: 'link' };
    const result = await propertiesAPI.create(data);
    expect(apiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties', expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual({ id: '2', address: 'B' });
  });

  it('update puts property', async () => {
    (apiRequest as any).mockResolvedValue({ id: '3', address: 'C' });
    const result = await propertiesAPI.update('3', { address: 'C' });
    expect(apiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/3', expect.objectContaining({ method: 'PUT' }));
    expect(result).toEqual({ id: '3', address: 'C' });
  });

  it('getById fetches property by id', async () => {
    (apiRequest as any).mockResolvedValue({ id: '4', address: 'D' });
    const result = await propertiesAPI.getById('4');
    expect(apiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/4');
    expect(result).toEqual({ id: '4', address: 'D' });
  });

  it('delete calls delete endpoint', async () => {
    (apiRequest as any).mockResolvedValue(undefined);
    await propertiesAPI.delete('5');
    expect(apiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/5', expect.objectContaining({ method: 'DELETE' }));
  });

  it('assignToPortfolio patches property', async () => {
    (apiRequest as any).mockResolvedValue({});
    await propertiesAPI.assignToPortfolio('6', '7');
    expect(apiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/6', expect.objectContaining({ method: 'PATCH' }));
  });

  it('handles errors from apiRequest', async () => {
    (apiRequest as any).mockRejectedValue(new Error('fail'));
    await expect(propertiesAPI.getAll()).rejects.toThrow('fail');
    await expect(propertiesAPI.create({ address: 'X' })).rejects.toThrow('fail');
    await expect(propertiesAPI.update('id', { address: 'Y' })).rejects.toThrow('fail');
    await expect(propertiesAPI.getById('id')).rejects.toThrow('fail');
    await expect(propertiesAPI.delete('id')).rejects.toThrow('fail');
    await expect(propertiesAPI.assignToPortfolio('id', null)).rejects.toThrow('fail');
  });
}); 