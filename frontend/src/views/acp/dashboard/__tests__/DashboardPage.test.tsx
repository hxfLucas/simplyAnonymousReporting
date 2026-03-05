import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import DashboardPage from '../index';

vi.mock('../../../../hooks/modules/useDashboard');

import { useDashboard } from '../../../../hooks/modules/useDashboard';

const mockUseDashboard = vi.mocked(useDashboard);

describe('DashboardPage', () => {
  it('shows a loading spinner while data is loading', () => {
    mockUseDashboard.mockReturnValue({ stats: null, isLoading: true, error: null });

    render(<DashboardPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows an error alert when there is an error', () => {
    mockUseDashboard.mockReturnValue({
      stats: null,
      isLoading: false,
      error: 'Failed to load dashboard',
    });

    render(<DashboardPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
  });

  it('renders stat cards with labels and values when data is loaded', () => {
    mockUseDashboard.mockReturnValue({
      stats: {
        totalCountUsers: 10,
        totalCountReportsNew: 3,
        totalCountReportsInReview: 2,
        totalCountReportsResolved: 5,
        totalCountReportsRejected: 1,
        totalMagicLinksGenerated: 7,
      },
      isLoading: false,
      error: null,
    });

    render(<DashboardPage />);

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('New Reports')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    expect(screen.getByText('In-Review Reports')).toBeInTheDocument();
    expect(screen.getByText('Magic Links Generated')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders nothing when stats is null and not loading and no error', () => {
    mockUseDashboard.mockReturnValue({ stats: null, isLoading: false, error: null });

    const { container } = render(<DashboardPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
