import { useState, useEffect } from 'react';
import { fetchDashboardStats, type DashboardStats } from '../../api/dashboard.api';
import { extractErrorMessage } from '../../utils/extractErrorMessage';

interface UseDashboardResult {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard(): UseDashboardResult {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardStats();
        if (!cancelled) {
          setStats(data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(extractErrorMessage(err, 'An error occurred'));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading, error };
}
