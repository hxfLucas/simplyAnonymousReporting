import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider, useAuthContext } from '../AuthContext';

vi.mock('../../api/auth.api', () => ({
  checkSession: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock('../../api/axios', () => ({
  getRefreshToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearRefreshToken: vi.fn(),
}));

import { checkSession, signOut as apiSignOut } from '../../api/auth.api';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from '../../api/axios';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext / AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('isLoading becomes false when no refresh token exists', async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('user is null when no refresh token exists', async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it('calls checkSession on mount when refresh token exists', async () => {
    vi.mocked(getRefreshToken).mockReturnValue('some-token');
    vi.mocked(checkSession).mockResolvedValue({
      valid: true,
      user: { id: '1', email: 'a@a.com', role: 'admin' },
      refresh_token: 'new-token',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => {
      expect(vi.mocked(checkSession)).toHaveBeenCalledTimes(1);
    });
  });

  it('populates user and sets isLoading=false on successful checkSession', async () => {
    const sessionUser = { id: '1', email: 'user@test.com', role: 'manager' };
    vi.mocked(getRefreshToken).mockReturnValue('token');
    vi.mocked(checkSession).mockResolvedValue({
      valid: true,
      user: sessionUser,
      refresh_token: 'rt',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toEqual(sessionUser);
  });

  it('user stays null and isLoading=false when checkSession rejects', async () => {
    vi.mocked(getRefreshToken).mockReturnValue('token');
    vi.mocked(checkSession).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it('updateSession with valid:true updates user and calls setRefreshToken', async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const sessionUser = { id: '2', email: 'upd@test.com', role: 'admin' };
    act(() => {
      result.current.updateSession({
        valid: true,
        user: sessionUser,
        refresh_token: 'rt-new',
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
      });
    });

    expect(result.current.user).toEqual(sessionUser);
    expect(vi.mocked(setRefreshToken)).toHaveBeenCalledWith('rt-new');
  });

  it('updateSession with valid:false does not update user or call setRefreshToken', async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateSession({ valid: false } as any);
    });

    expect(result.current.user).toBeNull();
    expect(vi.mocked(setRefreshToken)).not.toHaveBeenCalled();
  });

  it('signOut calls clearRefreshToken and sets user to null', async () => {
    const sessionUser = { id: '1', email: 'sign@out.com', role: 'admin' };
    vi.mocked(getRefreshToken).mockReturnValue('token');
    vi.mocked(checkSession).mockResolvedValue({
      valid: true,
      user: sessionUser,
      refresh_token: 'rt',
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.mocked(apiSignOut).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(sessionUser));

    act(() => {
      result.current.signOut();
    });

    expect(vi.mocked(clearRefreshToken)).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('signOut calls apiSignOut (fire and forget)', async () => {
    vi.mocked(getRefreshToken).mockReturnValue(null);
    vi.mocked(apiSignOut).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuthContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.signOut();
    });

    expect(vi.mocked(apiSignOut)).toHaveBeenCalledTimes(1);
  });

  it('useAuthContext throws when used outside AuthProvider', () => {
    expect(() => renderHook(() => useAuthContext())).toThrow(
      'useAuthContext must be used within AuthProvider',
    );
  });
});
