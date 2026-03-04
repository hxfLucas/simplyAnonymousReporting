import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotifications } from '../../api/auth.api';

export function useNotifications(pollInterval = 30000) {
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
    void fetch();
  }, [fetch]);

  useEffect(() => {
    mountedRef.current = true;
    // initial fetch
    void fetch();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetch();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    if (pollInterval > 0) {
      timerRef.current = window.setInterval(() => {
        void fetch();
      }, pollInterval);
    }

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch, pollInterval]);

  return { unread, refresh } as const;
}
