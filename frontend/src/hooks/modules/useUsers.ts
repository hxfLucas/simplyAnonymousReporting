import { useState, useCallback, useRef, useEffect } from 'react';
import {
  addUser as apiAddUser,
  listUsers as apiListUsers,
  removeUser as apiRemoveUser,
  updateUserPassword as apiUpdateUserPassword,
} from '../../api/users.api';
import type { User, AddUserPayload } from '../../api/users.api';

const LIMIT = 25;

interface UsersState {
  users: User[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  searchQuery: string;
}

interface ActionState {
  isLoading: boolean;
  error: string | null;
}

const initialActionState: ActionState = { isLoading: false, error: null };

export function useUsers() {
  const [state, setState] = useState<UsersState>({ users: [], total: 0, hasMore: false, isLoading: false, isLoadingMore: false, error: null, searchQuery: '' });
  const [addUserState, setAddUserState] = useState<ActionState>(initialActionState);
  const [removeUserState, setRemoveUserState] = useState<ActionState>(initialActionState);
  const [updatePasswordState, setUpdatePasswordState] = useState<ActionState>(initialActionState);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const searchQueryRef = useRef('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchUsers = useCallback(async (searchQuery?: string) => {
    offsetRef.current = 0;
    isLoadingMoreRef.current = false;
    if (searchQuery !== undefined) {
      searchQueryRef.current = searchQuery;
    }
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, users: [], total: 0, hasMore: false, isLoading: true, error: null, searchQuery: searchQueryRef.current }));
    }
    try {
      const res = await apiListUsers(0, LIMIT, searchQueryRef.current || undefined);
      offsetRef.current = res.data.length;
      hasMoreRef.current = res.hasMore;
      if (isMountedRef.current) {
        setState({ users: res.data, total: res.total, hasMore: res.hasMore, isLoading: false, isLoadingMore: false, error: null, searchQuery: searchQueryRef.current });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to fetch users';
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    }
  }, []);

  const fetchInitial = useCallback(async () => {
    fetchUsers();
  }, [fetchUsers]);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;
    isLoadingMoreRef.current = true;
    if (isMountedRef.current) {
      setState((prev) => ({ ...prev, isLoadingMore: true }));
    }
    try {
      const res = await apiListUsers(offsetRef.current, LIMIT, searchQueryRef.current || undefined);
      offsetRef.current += res.data.length;
      hasMoreRef.current = res.hasMore;
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          users: [...prev.users, ...res.data],
          total: res.total,
          hasMore: res.hasMore,
          isLoadingMore: false,
        }));
      }
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to load more';
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, isLoadingMore: false, error: message }));
      }
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, []);

  const addUser = useCallback(async (payload: AddUserPayload) => {
    setAddUserState({ isLoading: true, error: null });
    try {
      const created = await apiAddUser(payload);
      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, users: [created, ...prev.users] }));
        setAddUserState({ isLoading: false, error: null });
      }
      return created;
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to add user';
      if (isMountedRef.current) {
        setAddUserState({ isLoading: false, error: message });
      }
      throw err;
    }
  }, []);

  const removeUser = useCallback(async (id: string) => {
    setRemoveUserState({ isLoading: true, error: null });
    try {
      await apiRemoveUser(id);
      if (isMountedRef.current) {
        setState((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== id),
        }));
        setRemoveUserState({ isLoading: false, error: null });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to remove user';
      if (isMountedRef.current) {
        setRemoveUserState({ isLoading: false, error: message });
      }
      throw err;
    }
  }, []);

  const updateUserPassword = useCallback(async (id: string, password: string) => {
    setUpdatePasswordState({ isLoading: true, error: null });
    try {
      await apiUpdateUserPassword(id, password);
      if (isMountedRef.current) {
        setUpdatePasswordState({ isLoading: false, error: null });
      }
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to update password';
      if (isMountedRef.current) {
        setUpdatePasswordState({ isLoading: false, error: message });
      }
      throw err;
    }
  }, []);

  const search = useCallback(async (query: string) => {
    await fetchUsers(query);
  }, [fetchUsers]);

  return { ...state, fetchInitial, fetchUsers, loadMore, addUser, addUserState, removeUser, removeUserState, updateUserPassword, updatePasswordState, search };
}
