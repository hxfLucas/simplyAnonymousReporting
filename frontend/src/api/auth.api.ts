import api from './axios';

export type SignInPayload = { email: string; password: string };
export type SignUpPayload = { email: string; password: string; company: string };
export type AuthResponse = { refresh_token: string };
export type SessionUser = { id: string; email: string; role: string; companyId?: string };
export type SessionResponse = { valid: boolean; user: SessionUser };

export async function signIn(payload: SignInPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/sign-in', payload);
  return data;
}

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/sign-up', payload);
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh-tokens', { refresh_token: refreshToken });
  return data;
}

export async function checkSession(): Promise<SessionResponse> {
  const { data } = await api.get<SessionResponse>('/auth/check-session');
  return data;
}

export async function getNotifications(): Promise<{ reportNotificationsData: { totalNew: number } }> {
  const { data } = await api.get<{ reportNotificationsData: { totalNew: number } }>('/auth/notifications');
  return data;
}
