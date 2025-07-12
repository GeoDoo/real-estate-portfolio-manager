import { config } from "@/config";

// Base API configuration
const API_CONFIG = {
  baseUrl: config.apiBaseUrl,
  credentials: "include" as const,
  headers: {
    "Content-Type": "application/json",
  },
};

// Custom error class for API errors
export class APIError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
  }
}

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;

  const fetchOptions: RequestInit = {
    ...API_CONFIG,
    ...options,
    headers: {
      ...API_CONFIG.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If error response is not JSON, use default message
      }

      throw new APIError(errorMessage, response.status);
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    throw new APIError(
      error instanceof Error ? error.message : "Network error",
      0,
    );
  }
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string): Promise<T> =>
    apiFetch<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data?: unknown): Promise<T> =>
    apiFetch<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown): Promise<T> =>
    apiFetch<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown): Promise<T> =>
    apiFetch<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string): Promise<T> =>
    apiFetch<T>(endpoint, { method: "DELETE" }),
};

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new APIError(errorText || res.statusText, res.status);
  }

  // If there's no content, return null
  if (res.status === 204) return null as unknown as T;

  return res.json();
}
