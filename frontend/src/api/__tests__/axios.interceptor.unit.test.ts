import MockAdapter from 'axios-mock-adapter';
import { beforeEach, describe, expect, it } from 'vitest';
import api, { clearRefreshToken, getRefreshToken, setRefreshToken } from '../axios';

// Attach MockAdapter to the real api instance — the interceptor stays in place.
// We reset the mock before each test so handler registrations don't bleed.
const mock = new MockAdapter(api);

const PROTECTED_URL = '/dashboard';
const REFRESH_URL = '/auth/refresh-tokens';

beforeEach(() => {
  mock.reset();
  localStorage.clear();
});

describe('axios response interceptor — 401 + invalid_token retry', () => {
  it('non-401 error is rejected immediately (no refresh attempt)', async () => {
    mock.onGet(PROTECTED_URL).reply(500, { message: 'Server error' });

    await expect(api.get(PROTECTED_URL)).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(mock.history.post).toHaveLength(0);
  });

  it('401 WITHOUT invalid_token message is rejected immediately (no refresh attempt)', async () => {
    mock.onGet(PROTECTED_URL).reply(401, { message: 'unauthorized' });

    await expect(api.get(PROTECTED_URL)).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(mock.history.post).toHaveLength(0);
  });

  it('401 + invalid_token but NO refresh token in storage — rejects with the original error', async () => {
    // Ensure no refresh token is stored
    clearRefreshToken();
    mock.onGet(PROTECTED_URL).reply(401, { message: 'invalid_token' });

    await expect(api.get(PROTECTED_URL)).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(mock.history.post).toHaveLength(0);
  });

  it('401 + invalid_token + valid refresh → retries original request and stores new token', async () => {
    setRefreshToken('old-rt');
    // First call: 401 with invalid_token
    mock.onGet(PROTECTED_URL).replyOnce(401, { message: 'invalid_token' });
    // Refresh succeeds
    mock.onPost(REFRESH_URL).replyOnce(200, { refresh_token: 'new-rt' });
    // Retry of the original request succeeds
    mock.onGet(PROTECTED_URL).replyOnce(200, { data: 'ok' });

    const response = await api.get(PROTECTED_URL);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ data: 'ok' });
    expect(getRefreshToken()).toBe('new-rt');
    // The POST to refresh-tokens should have been made once
    expect(mock.history.post).toHaveLength(1);
  });

  it('401 + invalid_token + valid refresh → refresh endpoint called with the stored token', async () => {
    setRefreshToken('my-stored-rt');
    mock.onGet(PROTECTED_URL).replyOnce(401, { message: 'invalid_token' });
    mock.onPost(REFRESH_URL).replyOnce(200, { refresh_token: 'new-rt' });
    mock.onGet(PROTECTED_URL).replyOnce(200, {});

    await api.get(PROTECTED_URL);

    const refreshCall = mock.history.post[0];
    expect(JSON.parse(refreshCall.data)).toMatchObject({ refresh_token: 'my-stored-rt' });
  });

  it('401 + invalid_token + refresh FAILS → clears token and rejects with refresh error', async () => {
    setRefreshToken('stale-rt');
    mock.onGet(PROTECTED_URL).replyOnce(401, { message: 'invalid_token' });
    mock.onPost(REFRESH_URL).replyOnce(401, { message: 'refresh_expired' });

    await expect(api.get(PROTECTED_URL)).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(getRefreshToken()).toBeNull();
  });

  it('request with _retry=true already set does NOT trigger another refresh (loop guard)', async () => {
    setRefreshToken('some-rt');
    // This simulates a retried request itself returning 401 — it must not loop
    mock.onGet(PROTECTED_URL).reply(401, { message: 'invalid_token' });

    // Manually mark config as _retry=true (simulating the second attempt)
    await expect(api.get(PROTECTED_URL, { _retry: true } as any)).rejects.toMatchObject({
      response: { status: 401 },
    });

    // Should not have called the refresh endpoint
    expect(mock.history.post).toHaveLength(0);
  });
});
