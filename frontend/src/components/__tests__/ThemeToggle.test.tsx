import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('shows dark‑mode icon when the current theme is light', () => {
    renderWithProvider();
    // button label should exist
    const btn = screen.getByLabelText(/toggle light\/dark mode/i);
    expect(btn).toBeInTheDocument();
    // since mode default is light, we expect the icon to be the one that toggles to dark
    expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
  });

  it('toggles the icon and persists mode on click', () => {
    renderWithProvider();
    const btn = screen.getByLabelText(/toggle light\/dark mode/i);

    // click once, switch to dark
    fireEvent.click(btn);
    expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
    expect(localStorage.getItem('themeMode')).toBe('dark');

    // click again, back to light
    fireEvent.click(btn);
    expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
    expect(localStorage.getItem('themeMode')).toBe('light');
  });
});