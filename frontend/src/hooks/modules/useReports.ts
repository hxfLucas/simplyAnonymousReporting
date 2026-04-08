import { useState, useCallback, useRef } from 'react';
import { getReports, deleteReport, updateReportStatus } from '../../api/reports.api';
import { decrementInternal as decrementNotifications, incrementInternal as incrementNotifications } from './useNotifications';
import { extractErrorMessage } from '../../utils/extractErrorMessage';
import type { Report, ReportStatus } from '../../api/reports.api';

const LIMIT = 25;

interface ReportsState {
  reports: Report[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  new: 'New',
  in_review: 'In Review',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<ReportStatus, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  new: 'info',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'error',
};

interface ActionState {
  isLoading: boolean;
  error: string | null;
}

const initialActionState: ActionState = { isLoading: false, error: null };

export function useReports() {
  const [state, setState] = useState<ReportsState>({ reports: [], total: 0, hasMore: false, isLoading: false, isLoadingMore: false, error: null });
  const [removeReportState, setRemoveReportState] = useState<ActionState>(initialActionState);
  const [changeStatusState, setChangeStatusState] = useState<ActionState>(initialActionState);
  const reportsRef = useRef(state.reports);
  reportsRef.current = state.reports;

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const fetchInitial = useCallback(async () => {
    offsetRef.current = 0;
    isLoadingMoreRef.current = false;
    setState((prev) => ({ ...prev, reports: [], total: 0, hasMore: false, isLoading: true, error: null }));
    try {
      const res = await getReports(0, LIMIT);
      offsetRef.current = res.data.length;
      hasMoreRef.current = res.hasMore;
      setState({ reports: res.data, total: res.total, hasMore: res.hasMore, isLoading: false, isLoadingMore: false, error: null });
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Failed to load reports');
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setState((prev) => ({ ...prev, isLoadingMore: true }));
    try {
      const res = await getReports(offsetRef.current, LIMIT);
      offsetRef.current += res.data.length;
      hasMoreRef.current = res.hasMore;
      setState((prev) => ({
        ...prev,
        reports: [...prev.reports, ...res.data],
        total: res.total,
        hasMore: res.hasMore,
        isLoadingMore: false,
      }));
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Failed to load more');
      setState((prev) => ({ ...prev, isLoadingMore: false, error: message }));
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, []);

  const removeReport = useCallback(async (id: string) => {
    const wasNew = reportsRef.current.find((r) => r.id === id)?.status === 'new';
    setRemoveReportState({ isLoading: true, error: null });
    try {
      await deleteReport(id);
      setState((prev) => ({
        ...prev,
        reports: prev.reports.filter((r) => r.id !== id),
      }));
      setRemoveReportState({ isLoading: false, error: null });
      if (wasNew) {
        decrementNotifications();
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Failed to delete report');
      setRemoveReportState({ isLoading: false, error: message });
    }
  }, []);

  const changeReportStatus = useCallback(async (id: string, status: ReportStatus) => {
    const oldStatus = reportsRef.current.find((r) => r.id === id)?.status;
    setChangeStatusState({ isLoading: true, error: null });
    try {
      const updated = await updateReportStatus({ id, status });
      setState((prev) => ({
        ...prev,
        reports: prev.reports.map((r) => (r.id === id ? updated : r)),
      }));
      setChangeStatusState({ isLoading: false, error: null });
      if (oldStatus === 'new' && status !== 'new') {
        decrementNotifications();
      }
      if(oldStatus !== 'new' && status === 'new'){
        incrementNotifications();
      }
    } catch (err: any) {
      const message = extractErrorMessage(err, 'Failed to update status');
      setChangeStatusState({ isLoading: false, error: message });
    }
  }, []);

  return { ...state, fetchInitial, loadMore, removeReport, removeReportState, changeReportStatus, changeStatusState, fetchReports: fetchInitial };
}
