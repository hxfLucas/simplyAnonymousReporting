import { renderHook, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useNotifications, refreshInternal } from '../useNotifications';
import { getNotifications } from '../../../api/auth.api';

vi.mock('../../../api/auth.api', () => ({
  getNotifications: vi.fn(),
}));

const mockGetNotifications = vi.mocked(getNotifications);

describe('useNotifications', () => {
  beforeEach(() => {
    // shouldAdvanceTime: true lets real time drive fake timers so waitFor's
    // internal setTimeout / setInterval still fires normally during polling.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 0 } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('unread starts at 0 before any fetch resolves', () => {
    // Block the promise so it never resolves during this check
    mockGetNotifications.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useNotifications());
    expect(result.current.unread).toBe(0);
  });

  it('fetches on mount and updates unread from reportNotificationsData.totalNew', async () => {
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 5 } });
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => {
      expect(result.current.unread).toBe(5);
    });
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('handles API error silently — unread stays at its previous value', async () => {
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 3 } });
    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.unread).toBe(3));

    mockGetNotifications.mockRejectedValueOnce(new Error('Network error'));

    act(() => {
      result.current.refresh();
    });

    // After the failed refresh, value should remain 3
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.unread).toBe(3);
  });

  it('re-fetches when visibilitychange fires with visibilityState "visible"', async () => {
    mockGetNotifications
      .mockResolvedValueOnce({ reportNotificationsData: { totalNew: 0 } })
      .mockResolvedValueOnce({ reportNotificationsData: { totalNew: 7 } });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(mockGetNotifications).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => expect(result.current.unread).toBe(7));
  });

  it('does NOT re-fetch when visibilitychange fires but visibilityState is "hidden"', async () => {
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 0 } });
    renderHook(() => useNotifications());

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Flush any pending microtasks
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('polls again after pollInterval ms', async () => {
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 0 } });
    renderHook(() => useNotifications(1000));

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(2));
  });

  it('does not set up a polling interval when pollInterval is 0', async () => {
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 0 } });
    renderHook(() => useNotifications(0));

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    // Only the initial mount fetch; no interval calls
    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });

  it('removes the visibilitychange listener on unmount', async () => {
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 0 } });
    const { unmount } = renderHook(() => useNotifications(0));

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    unmount();

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Flush microtasks — no additional fetch should happen
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetNotifications).toHaveBeenCalledTimes(1);
  });
});

describe('refreshInternal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockGetNotifications.mockResolvedValue({ reportNotificationsData: { totalNew: 0 } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is a no-op when no hook is mounted — does not throw and does not call getNotifications', () => {
    // Render and immediately unmount to clear the internal ref
    const { unmount } = renderHook(() => useNotifications(0));
    unmount();
    vi.clearAllMocks();

    expect(() => refreshInternal()).not.toThrow();
    expect(mockGetNotifications).not.toHaveBeenCalled();
  });

  it('triggers a fetch when the hook is mounted', async () => {
    renderHook(() => useNotifications(0));
    // Wait for the initial mount fetch to complete
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    act(() => {
      refreshInternal();
    });

    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(2));
  });

  it('is a no-op again after the hook unmounts', async () => {
    const { unmount } = renderHook(() => useNotifications(0));
    await waitFor(() => expect(mockGetNotifications).toHaveBeenCalledTimes(1));

    unmount();
    vi.clearAllMocks();

    act(() => {
      refreshInternal();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetNotifications).not.toHaveBeenCalled();
  });
});
