import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { checkSession } from '../api/auth.api';
import type { SessionUser } from '../api/auth.api';
import { clearRefreshToken, getRefreshToken } from '../api/axios';

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

  useEffect(() => {
    if (!getRefreshToken()) {
      setIsLoading(false);
      return;
    }
    checkSession()
      .then((session) => {
        if (session.valid) setUser(session.user);
      })
      .catch(() => {
        // not authenticated — stay null
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signOut = useCallback(() => {
    clearRefreshToken();
    setUser(null);
  }, []);

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
