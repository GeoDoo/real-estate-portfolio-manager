import { describe, it, expect, jest, afterEach } from '@jest/globals';

const mockApiRequest = jest.fn();

jest.mock('@/lib/api', () => ({
  apiRequest: mockApiRequest,
  config: { apiBaseUrl: 'http://localhost:5050' },
}));

describe('propertiesAPI', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('getAll fetches all properties', async () => {
    mockApiRequest.mockResolvedValue([{ id: '1', address: 'A' }]);
    const { propertiesAPI } = await import('./properties');
    const result = await propertiesAPI.getAll();
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties');
    expect(result).toEqual([{ id: '1', address: 'A' }]);
  });

  it('create posts new property', async () => {
    mockApiRequest.mockResolvedValue({ id: '2', address: 'B' });
    const { propertiesAPI } = await import('./properties');
    const data = { address: 'B', listing_link: 'link' };
    const result = await propertiesAPI.create(data);
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties', expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual({ id: '2', address: 'B' });
  });

  it('update puts property', async () => {
    mockApiRequest.mockResolvedValue({ id: '3', address: 'C' });
    const { propertiesAPI } = await import('./properties');
    const result = await propertiesAPI.update('3', { address: 'C' });
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/3', expect.objectContaining({ method: 'PUT' }));
    expect(result).toEqual({ id: '3', address: 'C' });
  });

  it('getById fetches property by id', async () => {
    mockApiRequest.mockResolvedValue({ id: '4', address: 'D' });
    const { propertiesAPI } = await import('./properties');
    const result = await propertiesAPI.getById('4');
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/4');
    expect(result).toEqual({ id: '4', address: 'D' });
  });

  it('delete calls delete endpoint', async () => {
    mockApiRequest.mockResolvedValue(undefined);
    const { propertiesAPI } = await import('./properties');
    await propertiesAPI.delete('5');
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/5', expect.objectContaining({ method: 'DELETE' }));
  });

  it('assignToPortfolio patches property', async () => {
    mockApiRequest.mockResolvedValue({});
    const { propertiesAPI } = await import('./properties');
    await propertiesAPI.assignToPortfolio('6', '7');
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/6', expect.objectContaining({ method: 'PATCH' }));
  });

  it('handles errors from apiRequest', async () => {
    mockApiRequest.mockRejectedValue(new Error('fail'));
    const { propertiesAPI } = await import('./properties');
    await expect(propertiesAPI.getAll()).rejects.toThrow('fail');
    await expect(propertiesAPI.create({ address: 'X' })).rejects.toThrow('fail');
    await expect(propertiesAPI.update('id', { address: 'Y' })).rejects.toThrow('fail');
    await expect(propertiesAPI.getById('id')).rejects.toThrow('fail');
    await expect(propertiesAPI.delete('id')).rejects.toThrow('fail');
    await expect(propertiesAPI.assignToPortfolio('id', null)).rejects.toThrow('fail');
  });
}); 