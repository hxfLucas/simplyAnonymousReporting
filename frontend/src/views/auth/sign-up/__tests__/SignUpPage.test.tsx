import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from '../index';

vi.mock('../../../../hooks/modules/useAuth');
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

import { useAuth } from '../../../../hooks/modules/useAuth';

const mockSignUp = vi.fn();

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signIn: vi.fn(),
      signInState: { isLoading: false, error: null },
      signUp: mockSignUp,
      signUpState: { isLoading: false, error: null },
      signOut: vi.fn(),
    });
  });

  it('renders all form fields and submit button', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/company/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows "Passwords do not match" error when passwords differ', () => {
    const { container } = render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'differentpassword' },
    });
    // Use fireEvent.submit on the form to bypass HTML5 required-field validation
    fireEvent.submit(container.querySelector('form')!);

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls signUp with email, password, and company when passwords match', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'Acme Corp' },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'admin@acme.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: 'securepass' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'securepass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'admin@acme.com',
      password: 'securepass',
      company: 'Acme Corp',
    });
  });
});
