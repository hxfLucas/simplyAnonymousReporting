// src/hooks/useVisibilityChange.ts
import { useEffect } from 'react';

export function useVisibilityChange(onVisible: () => void) {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onVisible();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisible]);
}