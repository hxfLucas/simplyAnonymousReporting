import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotifications } from '../../api/auth.api';
import { useVisibilityChange } from '../useVisibilityChange';

// Internal refresh hook target. Other internal modules may import
// `refreshInternal` to trigger a refetch without calling the hook's
// instance method directly from UI components like headers.
let _internalRefresh: (() => void) | null = null;
let _internalDecrement: (() => void) | null = null;
let _internalIncrement:(() => void) | null = null;

export function refreshInternal() {
  if (_internalRefresh) _internalRefresh();
}

export function decrementInternal() {
  if (_internalDecrement) _internalDecrement();
}

export function incrementInternal(){
  if(_internalIncrement) _internalIncrement();
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

  const decrement = useCallback(() => {
    setUnread((prev) => Math.max(0, prev - 1));
  }, []);

  const increment = useCallback(() => {
    setUnread((prev) => prev + 1);
  }, []);

  useVisibilityChange(fetch);

  useEffect(() => {
    mountedRef.current = true;
    // register this hook instance as the module-level internal refresher
    _internalRefresh = refresh;
    _internalDecrement = decrement;
    _internalIncrement = increment;
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
      if (_internalDecrement === decrement) _internalDecrement = null;
      if (_internalIncrement === increment) _internalIncrement = null;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch, pollInterval]);

  return { unread, refresh, decrement, increment } as const;
}
