import { describe, it, expect, jest, afterEach } from '@jest/globals';

const mockApiRequest: any = jest.fn();

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
    mockApiRequest.mockResolvedValue({ items: [{ id: '1', address: 'A', postcode: 'P1' }] });
    const { propertiesAPI } = await import('./properties');
    const result = await propertiesAPI.getAll();
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties');
    expect(result).toEqual([{ id: '1', address: 'A', postcode: 'P1' }]);
  });

  it('create posts new property', async () => {
    mockApiRequest.mockResolvedValue({ data: { id: '2', address: 'B', postcode: 'P2' } });
    const { propertiesAPI } = await import('./properties');
    const data = { address: 'B', postcode: 'P2', listing_link: 'link' };
    const result = await propertiesAPI.create(data);
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties', expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual({ id: '2', address: 'B', postcode: 'P2' });
  });

  it('update puts property', async () => {
    mockApiRequest.mockResolvedValue({ data: { id: '3', address: 'C', postcode: 'P3' } });
    const { propertiesAPI } = await import('./properties');
    const result = await propertiesAPI.update('3', { address: 'C', postcode: 'P3' });
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/3', expect.objectContaining({ method: 'PUT' }));
    expect(result).toEqual({ id: '3', address: 'C', postcode: 'P3' });
  });

  it('getById fetches property by id', async () => {
    mockApiRequest.mockResolvedValue({ data: { id: '4', address: 'D', postcode: 'P4' } });
    const { propertiesAPI } = await import('./properties');
    const result = await propertiesAPI.getById('4');
    expect(mockApiRequest).toHaveBeenCalledWith('http://localhost:5050/api/properties/4');
    expect(result).toEqual({ id: '4', address: 'D', postcode: 'P4' });
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