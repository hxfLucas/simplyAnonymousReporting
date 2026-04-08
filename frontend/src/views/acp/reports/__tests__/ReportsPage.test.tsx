import { screen } from '@testing-library/react';
import { vi } from 'vitest';
import ReportsPage from '../index';

vi.mock('../../../../hooks/modules/useReports');
vi.mock('../../../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));
vi.mock('../../../../utils/formatDate', () => ({
  formatDate: vi.fn((d: string) => d),
}));

import { useReports } from '../../../../hooks/modules/useReports';
import { useAuthContext } from '../../../../contexts/AuthContext';
import { renderWithRouter } from '../../../../test-utils/renderWithRouter';
import { makeAdminAuthContext } from '../../../../test-utils/mocks';

const mockUseReports = vi.mocked(useReports);
const mockUseAuthContext = vi.mocked(useAuthContext);

function makeDefaultHook(overrides: Partial<ReturnType<typeof useReports>> = {}): ReturnType<typeof useReports> {
  return {
    reports: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    fetchInitial: vi.fn(),
    loadMore: vi.fn(),
    removeReport: vi.fn(),
    changeReportStatus: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useReports>;
}

describe('ReportsPage', () => {
  beforeEach(() => {
    mockUseAuthContext.mockReturnValue(makeAdminAuthContext());
  });

  it('renders "Reports" heading', () => {
    mockUseReports.mockReturnValue(makeDefaultHook());

    renderWithRouter(<ReportsPage />);

    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('shows empty state when no reports', () => {
    mockUseReports.mockReturnValue(makeDefaultHook({ reports: [] }));

    renderWithRouter(<ReportsPage />);

    expect(screen.getByText(/no reports found/i)).toBeInTheDocument();
  });

  it('renders report rows with title and status chips when data is available', () => {
    mockUseReports.mockReturnValue(
      makeDefaultHook({
        reports: [
          { id: 'r1', title: 'Broken pipe', status: 'new', createdAt: '2024-01-10' },
          { id: 'r2', title: 'Faulty wiring', status: 'resolved', createdAt: '2024-02-15' },
        ] as any,
      }),
    );

    renderWithRouter(<ReportsPage />);

    expect(screen.getByText('Broken pipe')).toBeInTheDocument();
    expect(screen.getByText('Faulty wiring')).toBeInTheDocument();

    // Status chips use STATUS_LABELS: 'new' -> 'New', 'resolved' -> 'Resolved'.
    // Each row also renders a Select showing the same label, so multiple elements match.
    expect(screen.getAllByText('New').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Resolved').length).toBeGreaterThan(0);
  });

  it('shows an error alert when there is an error', () => {
    mockUseReports.mockReturnValue(makeDefaultHook({ error: 'Failed to load reports' }));

    renderWithRouter(<ReportsPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load reports')).toBeInTheDocument();
  });
});
