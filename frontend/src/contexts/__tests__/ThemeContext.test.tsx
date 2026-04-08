import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useThemeContext, ThemeMode } from '../ThemeContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to light mode when no value in localStorage', () => {
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    expect(result.current.mode).toBe('light');
  });

  it('honors value stored in localStorage on initial render', () => {
    localStorage.setItem('themeMode', 'dark');
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    expect(result.current.mode).toBe('dark');
  });

  it('toggleMode flips the mode and persists to localStorage', () => {
    const { result } = renderHook(() => useThemeContext(), { wrapper });
    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe('dark');
    expect(localStorage.getItem('themeMode')).toBe('dark');

    act(() => {
      result.current.toggleMode();
    });
    expect(result.current.mode).toBe('light');
    expect(localStorage.getItem('themeMode')).toBe('light');
  });
});