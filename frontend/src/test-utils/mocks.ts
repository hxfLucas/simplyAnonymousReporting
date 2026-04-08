import { vi } from 'vitest';

/**
 * Factory for a mock admin auth context value.
 * Usage: mockUseAuthContext.mockReturnValue(makeAdminAuthContext())
 */
export function makeAdminAuthContext(overrides: Record<string, unknown> = {}) {
  return {
    user: { id: '1', email: 'admin@test.com', role: 'admin' as const },
    isLoading: false,
    updateSession: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

/**
 * Unauthenticated / null-user context value.
 */
export function makeNullAuthContext(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    isLoading: false,
    updateSession: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}
