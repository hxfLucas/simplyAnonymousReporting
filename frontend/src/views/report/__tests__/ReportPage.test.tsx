import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ReportPage from '../index';

vi.mock('../../../api/reports.api', () => ({
  validateReport: vi.fn(),
  submitReport: vi.fn(),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useParams: vi.fn() };
});

import { validateReport, submitReport } from '../../../api/reports.api';
import { useParams } from 'react-router-dom';

describe('ReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useParams).mockReturnValue({ reportTokenId: 'abc-token' });
  });

  it('shows loading state initially while validation is pending', () => {
    vi.mocked(validateReport).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows "Invalid Link" when validation fails', async () => {
    vi.mocked(validateReport).mockRejectedValue(new Error('Not found'));

    render(
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
    });
  });

  it('renders the form with company name when validation succeeds', async () => {
    vi.mocked(validateReport).mockResolvedValue({
      companyId: 'company-1',
      companyName: 'Acme Corp',
    });

    render(
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/submit a report/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/acme corp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/report details/i)).toBeInTheDocument();
  });

  it('shows success state after report is submitted', async () => {
    vi.mocked(validateReport).mockResolvedValue({
      companyId: 'company-1',
      companyName: 'Acme Corp',
    });
    vi.mocked(submitReport).mockResolvedValue({
      id: 'report-1',
      companyId: 'company-1',
      title: 'Test',
      description: 'Details',
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <ReportPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test report' },
    });
    fireEvent.change(screen.getByLabelText(/report details/i), {
      target: { value: 'Detailed description' },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));

    await waitFor(() => {
      expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
    });
  });
});
