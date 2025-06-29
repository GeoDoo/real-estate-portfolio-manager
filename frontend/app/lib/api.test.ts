// Mock config import for Jest environment
jest.mock("@/config", () => ({ config: {} }));

declare var global: any;

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { apiRequest, APIError } from "./api";

describe("apiRequest", () => {
  beforeEach(() => {
    // @ts-expect-error: mocking global.fetch for test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should return data for a successful request", async () => {
    const mockData = { foo: "bar" };
    // @ts-expect-error: mocking global.fetch for test
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    });
    const result = await apiRequest<{ foo: string }>("/api/test");
    expect(result).toEqual(mockData);
  });

  it("should throw APIError for a failed request", async () => {
    // @ts-expect-error: mocking global.fetch for test
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      text: async () => "Not Found",
    });
    await expect(apiRequest("/api/fail")).rejects.toThrow(APIError);
    await expect(apiRequest("/api/fail")).rejects.toMatchObject({ status: 404 });
  });

  it("should return null for 204 No Content", async () => {
    // @ts-expect-error: mocking global.fetch for test
    global.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => undefined,
    });
    const result = await apiRequest("/api/nocontent");
    expect(result).toBeNull();
  });
}); 