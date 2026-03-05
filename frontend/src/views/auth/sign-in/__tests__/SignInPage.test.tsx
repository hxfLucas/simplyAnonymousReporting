import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SignInPage from '../index';

vi.mock('../../../../hooks/modules/useAuth');
vi.mock('../../../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));
vi.mock('../../../../api/auth.api', () => ({
  checkSession: vi.fn().mockResolvedValue({ valid: false }),
}));
vi.mock('../../../../api/axios', () => ({
  getRefreshToken: vi.fn(() => null),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

import { useAuth } from '../../../../hooks/modules/useAuth';
import { useAuthContext } from '../../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const mockSignIn = vi.fn();

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(vi.fn());
    vi.mocked(useAuthContext).mockReturnValue({
      user: null,
      isLoading: false,
      updateSession: vi.fn(),
      signOut: vi.fn(),
    });
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      signInState: { isLoading: false, error: null },
      signUp: vi.fn(),
      signUpState: { isLoading: false, error: null },
      signOut: vi.fn(),
    });
  });

  it('renders email and password fields and submit button', () => {
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    );
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows error alert when signInState.error is set', () => {
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      signInState: { isLoading: false, error: 'Invalid credentials' },
      signUp: vi.fn(),
      signUpState: { isLoading: false, error: null },
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('calls signIn with email and password when form is submitted', () => {
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret123',
    });
  });
});
