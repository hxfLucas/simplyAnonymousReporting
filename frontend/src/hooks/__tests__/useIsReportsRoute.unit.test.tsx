import React from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useIsReportsRoute from '../useIsReportsRoute';

describe('useIsReportsRoute', () => {
  it('returns true when at /acp/reports', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/acp/reports']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useIsReportsRoute(), { wrapper });
    expect(result.current).toBe(true);
  });

  it('returns false when at /acp/users', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/acp/users']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useIsReportsRoute(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('returns false when at /acp/reports/123 (end: true means no sub-paths)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/acp/reports/123']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useIsReportsRoute(), { wrapper });
    expect(result.current).toBe(false);
  });

  it('returns false when at /', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useIsReportsRoute(), { wrapper });
    expect(result.current).toBe(false);
  });
});
