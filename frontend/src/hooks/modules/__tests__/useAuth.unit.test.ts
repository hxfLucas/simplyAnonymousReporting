import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuth } from '../useAuth';

vi.mock('../../../api/auth.api', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  checkSession: vi.fn(),
}));
vi.mock('../../../api/axios', () => ({
  setRefreshToken: vi.fn(),
}));
vi.mock('../../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn(),
}));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: vi.fn() };
});

import { signIn as apiSignIn, signUp as apiSignUp, checkSession } from '../../../api/auth.api';
import { setRefreshToken } from '../../../api/axios';
import { useAuthContext } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

describe('useAuth', () => {
  const mockNavigate = vi.fn();
  const mockUpdateSession = vi.fn();
  const mockContextSignOut = vi.fn();

  beforeEach(() => {
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useAuthContext).mockReturnValue({
      updateSession: mockUpdateSession,
      signOut: mockContextSignOut,
      user: null,
      isLoading: false,
    });
  });

  it('initial signInState is { isLoading: false, error: null }', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.signInState).toEqual({ isLoading: false, error: null });
  });

  it('successful signIn calls setRefreshToken, checkSession, updateSession, and navigate("/acp")', async () => {
    vi.mocked(apiSignIn).mockResolvedValue({ refresh_token: 'rt' });
    vi.mocked(checkSession).mockResolvedValue({
      valid: true,
      user: { id: '1', email: 'a@a.com', role: 'admin' },
      refresh_token: 'rt2',
      expiresAt: 9999999999,
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn({ email: 'a@a.com', password: 'pass' });
    });

    expect(vi.mocked(setRefreshToken)).toHaveBeenCalledWith('rt');
    expect(vi.mocked(checkSession)).toHaveBeenCalledTimes(1);
    expect(mockUpdateSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/acp');
  });

  it('signIn API error with response.data.error sets signInState.error to that message', async () => {
    const err: any = new Error('original');
    err.response = { data: { error: 'Invalid credentials' } };
    vi.mocked(apiSignIn).mockRejectedValue(err);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn({ email: 'a@a.com', password: 'wrong' });
    });

    expect(result.current.signInState.error).toBe('Invalid credentials');
  });

  it('signIn: response.data.message takes priority over response.data.error', async () => {
    const err: any = new Error('original');
    err.response = { data: { message: 'Message wins', error: 'Error loses' } };
    vi.mocked(apiSignIn).mockRejectedValue(err);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn({ email: 'a@a.com', password: 'wrong' });
    });

    expect(result.current.signInState.error).toBe('Message wins');
  });

  it('signIn fallback: uses err.message when no response.data.error', async () => {
    const err: any = new Error('Network down');
    vi.mocked(apiSignIn).mockRejectedValue(err);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn({ email: 'a@a.com', password: 'pass' });
    });

    expect(result.current.signInState.error).toBe('Network down');
  });

  it('signIn double-fallback: uses "Sign in failed" when no message at all', async () => {
    vi.mocked(apiSignIn).mockRejectedValue({});

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signIn({ email: 'a@a.com', password: 'pass' });
    });

    expect(result.current.signInState.error).toBe('Sign in failed');
  });

  it('successful signUp calls setRefreshToken, checkSession, updateSession, and navigate("/acp")', async () => {
    vi.mocked(apiSignUp).mockResolvedValue({ refresh_token: 'rt' });
    vi.mocked(checkSession).mockResolvedValue({
      valid: true,
      user: { id: '2', email: 'b@b.com', role: 'admin' },
      refresh_token: 'rt2',
      expiresAt: 9999999999,
    });

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp({ email: 'b@b.com', password: 'pass', company: 'Acme' });
    });

    expect(vi.mocked(setRefreshToken)).toHaveBeenCalledWith('rt');
    expect(vi.mocked(checkSession)).toHaveBeenCalledTimes(1);
    expect(mockUpdateSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/acp');
  });

  it('signUp error sets signUpState.error', async () => {
    const err: any = new Error('Email taken');
    err.response = { data: { error: 'Email already in use' } };
    vi.mocked(apiSignUp).mockRejectedValue(err);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp({ email: 'b@b.com', password: 'pass', company: 'Acme' });
    });

    expect(result.current.signUpState.error).toBe('Email already in use');
  });

  it('signUp: response.data.message takes priority over response.data.error', async () => {
    const err: any = new Error('Email taken');
    err.response = { data: { message: 'Message wins', error: 'Error loses' } };
    vi.mocked(apiSignUp).mockRejectedValue(err);

    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signUp({ email: 'b@b.com', password: 'pass', company: 'Acme' });
    });

    expect(result.current.signUpState.error).toBe('Message wins');
  });

  it('signOut calls contextSignOut and navigate("/sign-in")', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.signOut();
    });

    expect(mockContextSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/sign-in');
  });
});
