import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkSession, signOut as apiSignOut } from '../api/auth.api';
import type { SessionUser, SessionResponse } from '../api/auth.api';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '../api/axios';

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  updateSession: (session: SessionResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const signOut = useCallback(() => {
    apiSignOut().catch(() => {});
    clearRefreshToken();
    setUser(null);
    setExpiresAt(null);
  }, []);

  const updateSession = useCallback((session: SessionResponse) => {
    if (session.valid) {
      setUser(session.user);
      setRefreshToken(session.refresh_token);
      setExpiresAt(session.expiresAt);
    }
  }, []);

  // On mount: restore session if a refresh token is stored
  useEffect(() => {
    if (!getRefreshToken()) {
      setIsLoading(false);
      return;
    }
    checkSession()
      .then(updateSession)
      .catch(() => {
        // not authenticated — stay null
      })
      .finally(() => setIsLoading(false));
  }, [updateSession]);

  // Schedule proactive session refresh 10 minutes before access token expiry.
  // checkSession renews both tokens and returns the new expiresAt,
  // which triggers this effect again — creating a self-rescheduling timeout.
  useEffect(() => {
    if (!user || !expiresAt) return;

    const TEN_MINUTES_MS = parseInt(import.meta.env.VITE_PROACTIVE_REFRESH_TOKENS_BEFORE_EXPIRATION_MINUTES || 10) * 60 * 1000;
    const delay = expiresAt * 1000 - Date.now() - TEN_MINUTES_MS;

    if (delay <= 0) {
      // Already within the 10-minute window — refresh immediately
      checkSession().then(updateSession).catch(signOut);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkSession().then(updateSession).catch(signOut);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [expiresAt, user, signOut, updateSession]);

  useEffect(() => {
    const handler = () => {
      signOut();
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, [signOut]);

  return (
    <AuthContext.Provider value={{ user, isLoading, updateSession, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
