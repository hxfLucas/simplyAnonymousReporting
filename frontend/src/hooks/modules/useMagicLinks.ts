import { useState, useCallback } from 'react';
import {
  listMagicLinks as apiListMagicLinks,
  createMagicLink as apiCreateMagicLink,
  deleteMagicLink as apiDeleteMagicLink,
} from '../../api/magiclinks.api';
import type { MagicLink } from '../../api/magiclinks.api';

interface MagicLinksState {
  magicLinks: MagicLink[];
  isLoading: boolean;
  error: string | null;
}

export function useMagicLinks() {
  const [state, setState] = useState<MagicLinksState>({
    magicLinks: [],
    isLoading: false,
    error: null,
  });

  const fetchMagicLinks = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const magicLinks = await apiListMagicLinks();
      setState({ magicLinks, isLoading: false, error: null });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to fetch magic links';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const generateMagicLink = useCallback(async (alias?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const created = await apiCreateMagicLink(alias);
      setState((prev) => ({ ...prev, magicLinks: [...prev.magicLinks, created], isLoading: false }));
      return created;
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to create magic link';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const removeMagicLink = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiDeleteMagicLink(id);
      setState((prev) => ({
        ...prev,
        magicLinks: prev.magicLinks.filter((ml) => ml.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to delete magic link';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  return { ...state, fetchMagicLinks, generateMagicLink, removeMagicLink };
}
