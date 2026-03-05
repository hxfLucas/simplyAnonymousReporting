import '@testing-library/jest-dom';

// jsdom does not implement IntersectionObserver — provide a no-op stub
globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;
