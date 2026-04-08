import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

interface RouterRenderOptions extends RenderOptions {
  initialEntries?: string[];
}

export function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/'], ...options }: RouterRenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>,
    options,
  );
}
