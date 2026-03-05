import { useState, useCallback, useRef } from 'react';
import {
  listMagicLinks as apiListMagicLinks,
  createMagicLink as apiCreateMagicLink,
  deleteMagicLink as apiDeleteMagicLink,
} from '../../api/magiclinks.api';
import type { MagicLink } from '../../api/magiclinks.api';

const LIMIT = 25;

interface MagicLinksState {
  magicLinks: MagicLink[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

interface ActionState {
  isLoading: boolean;
  error: string | null;
}

const initialActionState: ActionState = { isLoading: false, error: null };

export function useMagicLinks() {
  const [state, setState] = useState<MagicLinksState>({
    magicLinks: [],
    total: 0,
    hasMore: false,
    isLoading: false,
    isLoadingMore: false,
    error: null,
  });
  const [generateLinkState, setGenerateLinkState] = useState<ActionState>(initialActionState);
  const [removeLinkState, setRemoveLinkState] = useState<ActionState>(initialActionState);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);

  const fetchInitial = useCallback(async () => {
    offsetRef.current = 0;
    isLoadingMoreRef.current = false;
    setState((prev) => ({ ...prev, magicLinks: [], total: 0, hasMore: false, isLoading: true, error: null }));
    try {
      const res = await apiListMagicLinks(0, LIMIT);
      offsetRef.current = res.data.length;
      hasMoreRef.current = res.hasMore;
      setState({ magicLinks: res.data, total: res.total, hasMore: res.hasMore, isLoading: false, isLoadingMore: false, error: null });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to fetch magic links';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    isLoadingMoreRef.current = true;
    setState((prev) => ({ ...prev, isLoadingMore: true }));
    try {
      const res = await apiListMagicLinks(offsetRef.current, LIMIT);
      offsetRef.current += res.data.length;
      hasMoreRef.current = res.hasMore;
      setState((prev) => ({
        ...prev,
        magicLinks: [...prev.magicLinks, ...res.data],
        total: res.total,
        hasMore: res.hasMore,
        isLoadingMore: false,
      }));
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to load more';
      setState((prev) => ({ ...prev, isLoadingMore: false, error: message }));
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, []);

  const generateMagicLink = useCallback(async (alias?: string) => {
    setGenerateLinkState({ isLoading: true, error: null });
    try {
      const created = await apiCreateMagicLink(alias);
      setState((prev) => ({ ...prev, magicLinks: [...prev.magicLinks, created] }));
      setGenerateLinkState({ isLoading: false, error: null });
      return created;
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to create magic link';
      setGenerateLinkState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  const removeMagicLink = useCallback(async (id: string) => {
    setRemoveLinkState({ isLoading: true, error: null });
    try {
      await apiDeleteMagicLink(id);
      setState((prev) => ({
        ...prev,
        magicLinks: prev.magicLinks.filter((ml) => ml.id !== id),
      }));
      setRemoveLinkState({ isLoading: false, error: null });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to delete magic link';
      setRemoveLinkState({ isLoading: false, error: message });
      throw err;
    }
  }, []);

  return { ...state, fetchInitial, loadMore, generateMagicLink, generateLinkState, removeMagicLink, removeLinkState, fetchMagicLinks: fetchInitial };
}
