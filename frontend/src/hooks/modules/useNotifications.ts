import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotifications } from '../../api/auth.api';
import { useVisibilityChange } from '../useVisibilityChange';

// Internal refresh hook target. Other internal modules may import
// `refreshInternal` to trigger a refetch without calling the hook's
// instance method directly from UI components like headers.
let _internalRefresh: (() => void) | null = null;

export function refreshInternal() {
  if (_internalRefresh) _internalRefresh();
}

export function useNotifications(pollInterval = 15000) {
  const [unread, setUnread] = useState<number>(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  const fetch = useCallback(async () => {
    try {
      const data = await getNotifications();
      if (!mountedRef.current) return;
      setUnread(Number(data?.reportNotificationsData?.totalNew ?? 0));
    } catch (err) {
      // swallow — keep previous value
    }
  }, []);

  const refresh = useCallback(() => {
    fetch();
  }, [fetch]);

  useVisibilityChange(fetch);

  useEffect(() => {
    mountedRef.current = true;
    // register this hook instance as the module-level internal refresher
    _internalRefresh = refresh;
    // initial fetch
    fetch();

    if (pollInterval > 0) {
      timerRef.current = window.setInterval(() => {
        fetch();
      }, pollInterval);
    }

    return () => {
      mountedRef.current = false;
      // only clear if it still points to this instance's refresh
      if (_internalRefresh === refresh) _internalRefresh = null;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch, pollInterval]);

  return { unread, refresh } as const;
}
