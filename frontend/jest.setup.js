const React = require('react');
require('@testing-library/jest-dom');

// Mock fetch globally for all tests
if (!global.fetch) {
  global.fetch = jest.fn((...args) => {
    // You can customize this default mock as needed for your tests
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
    });
  });
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Next.js link as a string to avoid referencing React
jest.mock('next/link', () => 'a');

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Ensure Jest mocks work properly with ES modules
jest.autoMockOff(); 