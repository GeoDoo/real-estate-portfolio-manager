// Mock config import for Jest environment
jest.mock("@/config", () => ({ config: {} }));

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { apiRequest, APIError } from "./api";

// Mock fetch globally for tests
const mockFetch = jest.fn();
Object.defineProperty(globalThis, 'fetch', {
  value: mockFetch,
  writable: true,
});

describe("apiRequest", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return data for a successful request", async () => {
    const mockData = { foo: "bar" };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });
    const result = await apiRequest<{ foo: string }>("/api/test");
    expect(result).toEqual(mockData);
  });

  it("should throw APIError for a failed request", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Not Found",
    });
    await expect(apiRequest("/api/fail")).rejects.toThrow(APIError);
    await expect(apiRequest("/api/fail")).rejects.toMatchObject({ status: 404 });
  });

  it("should return null for 204 No Content", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => undefined,
    });
    const result = await apiRequest("/api/nocontent");
    expect(result).toBeNull();
  });
}); 