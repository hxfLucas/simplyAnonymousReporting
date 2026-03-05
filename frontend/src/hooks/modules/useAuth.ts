import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn as apiSignIn, signUp as apiSignUp, checkSession } from '../../api/auth.api';
import type { SignInPayload, SignUpPayload } from '../../api/auth.api';
import { setRefreshToken } from '../../api/axios';
import { useAuthContext } from '../../contexts/AuthContext';

interface AuthActionState {
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { updateSession, signOut: contextSignOut } = useAuthContext();
  const navigate = useNavigate();
  const [signInState, setSignInState] = useState<AuthActionState>({ isLoading: false, error: null });
  const [signUpState, setSignUpState] = useState<AuthActionState>({ isLoading: false, error: null });

  const signIn = useCallback(async (payload: SignInPayload) => {
    setSignInState({ isLoading: true, error: null });
    try {
      const { refresh_token } = await apiSignIn(payload);
      setRefreshToken(refresh_token);
      const session = await checkSession();
      updateSession(session);
      navigate('/acp');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Sign in failed';
      setSignInState({ isLoading: false, error: message });
    }
  }, [navigate, updateSession]);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    setSignUpState({ isLoading: true, error: null });
    try {
      const { refresh_token } = await apiSignUp(payload);
      setRefreshToken(refresh_token);
      const session = await checkSession();
      updateSession(session);
      navigate('/acp');
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Sign up failed';
      setSignUpState({ isLoading: false, error: message });
    }
  }, [navigate, updateSession]);

  const signOut = useCallback(() => {
    contextSignOut();
    navigate('/sign-in');
  }, [contextSignOut, navigate]);

  return { signIn, signInState, signUp, signUpState, signOut };
}
