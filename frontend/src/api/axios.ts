import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
});

export function setRefreshToken(token: string): void {
  localStorage.setItem('refresh_token', token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function clearRefreshToken(): void {
  localStorage.removeItem('refresh_token');
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config;

    if (
      error.response?.status === 401 &&
      (error.response?.data?.message === 'invalid_token' || error.response?.data?.message === 'token_invalidated') &&
      !(error as any).config._retry
    ) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        return Promise.reject(error);
      }

      (error as any).config._retry = true;

      try {
        const { data } = await api.post(
          '/auth/refresh-tokens',
          { refresh_token: refreshToken },
          { _retry: true } as any
        );
        setRefreshToken(data.refresh_token);
        return api(originalConfig);
      } catch (refreshError) {
        clearRefreshToken();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
