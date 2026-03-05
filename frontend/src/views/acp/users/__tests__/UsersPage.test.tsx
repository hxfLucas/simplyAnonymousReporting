import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import UsersPage from '../index';

vi.mock('../../../../hooks/modules/useUsers');
vi.mock('../../../../hooks/modules/useSearch', () => ({
  useSearch: vi.fn(() => ({ searchValue: '', setSearchValue: vi.fn(), isSearching: false })),
}));
vi.mock('../../../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));
vi.mock('../../../../utils/formatDate', () => ({
  formatDate: vi.fn((d: string) => d),
}));

import { useUsers } from '../../../../hooks/modules/useUsers';
import { useAuthContext } from '../../../../contexts/AuthContext';

// jsdom does not implement IntersectionObserver — provide a no-op stub
beforeAll(() => {
  globalThis.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver;
});

const mockUseUsers = vi.mocked(useUsers);
const mockUseAuthContext = vi.mocked(useAuthContext);

function makeDefaultHook(overrides: Partial<ReturnType<typeof useUsers>> = {}): ReturnType<typeof useUsers> {
  return {
    users: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    fetchInitial: vi.fn(),
    loadMore: vi.fn(),
    addUser: vi.fn().mockResolvedValue(undefined),
    addUserState: { isLoading: false, error: null },
    clearAddUserState: vi.fn(),
    removeUser: vi.fn(),
    updateUserPassword: vi.fn(),
    fetchUsers: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useUsers>;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <UsersPage />
    </MemoryRouter>,
  );
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthContext.mockReturnValue({
      user: { id: '1', email: 'admin@test.com', role: 'admin' },
      isLoading: false,
      updateSession: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('renders "Users" heading and "Add User" button', () => {
    mockUseUsers.mockReturnValue(makeDefaultHook());

    renderPage();

    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
  });

  it('shows empty state message when users array is empty', () => {
    mockUseUsers.mockReturnValue(makeDefaultHook({ users: [] }));

    renderPage();

    expect(screen.getByText(/no users yet/i)).toBeInTheDocument();
  });

  it('renders user rows when data is available', () => {
    mockUseUsers.mockReturnValue(
      makeDefaultHook({
        users: [
          { id: 'u1', email: 'alice@example.com', role: 'admin', createdAt: '2024-01-01' },
          { id: 'u2', email: 'bob@example.com', role: 'manager', createdAt: '2024-02-01' },
        ] as any,
      }),
    );

    renderPage();

    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('manager')).toBeInTheDocument();
  });

  it('opens the Add User dialog when "Add User" button is clicked', async () => {
    mockUseUsers.mockReturnValue(makeDefaultHook());

    renderPage();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /add user/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add New User')).toBeInTheDocument();
  });

  it('dialog stays open and shows error when addUser rejects', async () => {
    const addUser = vi.fn().mockRejectedValue(new Error('Email already taken'));
    mockUseUsers.mockReturnValue(
      makeDefaultHook({
        addUser,
        addUserState: { isLoading: false, error: 'Email already taken' },
      }),
    );

    renderPage();

    // Open dialog
    fireEvent.click(screen.getByRole('button', { name: /add user/i }));
    await screen.findByRole('dialog');

    // Fill in email and password
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'dupe@test.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'secret123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Dialog should remain open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Error should be visible inside dialog
    expect(screen.getByText('Email already taken')).toBeInTheDocument();
  });
});
