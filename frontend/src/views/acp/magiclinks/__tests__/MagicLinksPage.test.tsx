import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MagicLinksPage from '../index';

vi.mock('../../../../hooks/modules/useMagicLinks');
vi.mock('../../../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));
vi.mock('../../../../utils/formatDate', () => ({
  formatDate: vi.fn((d: string) => d),
}));

import { within } from '@testing-library/react';
import { useMagicLinks } from '../../../../hooks/modules/useMagicLinks';
import { useAuthContext } from '../../../../contexts/AuthContext';

// jsdom does not implement IntersectionObserver — provide a no-op stub
beforeAll(() => {
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

const mockUseMagicLinks = vi.mocked(useMagicLinks);
const mockUseAuthContext = vi.mocked(useAuthContext);

function makeDefaultHook(overrides: Partial<ReturnType<typeof useMagicLinks>> = {}): ReturnType<typeof useMagicLinks> {
  return {
    magicLinks: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    fetchInitial: vi.fn(),
    loadMore: vi.fn(),
    generateMagicLink: vi.fn().mockResolvedValue(undefined),
    removeMagicLink: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useMagicLinks>;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MagicLinksPage />
    </MemoryRouter>,
  );
}

describe('MagicLinksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthContext.mockReturnValue({
      user: { id: 'u1', email: 'admin@test.com', role: 'admin' },
      isLoading: false,
      updateSession: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('renders "Magic Links" heading and generate button', () => {
    mockUseMagicLinks.mockReturnValue(makeDefaultHook());

    renderPage();

    expect(screen.getByText('Magic Links')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate magic link/i })).toBeInTheDocument();
  });

  it('shows empty state when no magic links', () => {
    mockUseMagicLinks.mockReturnValue(makeDefaultHook({ magicLinks: [] }));

    renderPage();

    expect(screen.getByText(/no magic links yet/i)).toBeInTheDocument();
  });

  it('renders link rows when data is available', () => {
    mockUseMagicLinks.mockReturnValue(
      makeDefaultHook({
        magicLinks: [
          {
            id: 'ml1',
            alias: 'Campaign A',
            reportingToken: 'abc123',
            createdAt: '2024-03-01',
            createdBy: { id: 'u1', email: 'admin@test.com' },
          },
          {
            id: 'ml2',
            alias: null,
            reportingToken: 'def456',
            createdAt: '2024-04-01',
            createdBy: null,
          },
        ] as any,
      }),
    );

    renderPage();

    expect(screen.getByText('Campaign A')).toBeInTheDocument();
    // Second row alias is null so it shows '—'
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('opens generate dialog when button is clicked', async () => {
    mockUseMagicLinks.mockReturnValue(makeDefaultHook());

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /generate magic link/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Scope within dialog to avoid matching the button outside it
    expect(within(dialog).getByText('Generate Magic Link')).toBeInTheDocument();
  });
});
