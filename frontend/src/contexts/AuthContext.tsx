import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkSession, refreshTokens } from '../api/auth.api';
import type { SessionUser } from '../api/auth.api';
import { clearRefreshToken, getRefreshToken, setRefreshToken } from '../api/axios';

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(() => {
    clearRefreshToken();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!getRefreshToken()) {
      setIsLoading(false);
      return;
    }
    checkSession()
      .then((session) => {
        if (session.valid) {
          setUser(session.user);
          setRefreshToken(session.refresh_token);
        }
      })
      .catch(() => {
        // not authenticated — stay null
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;

    const THIRTY_MINUTES = 30 * 60 * 1000;
    const intervalId = setInterval(async () => {
      const rt = getRefreshToken();
      if (!rt) {
        signOut();
        return;
      }
      try {
        const { refresh_token } = await refreshTokens(rt);
        setRefreshToken(refresh_token);
      } catch {
        signOut();
      }
    }, THIRTY_MINUTES);

    return () => clearInterval(intervalId);
  }, [user, signOut]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
