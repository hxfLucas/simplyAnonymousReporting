import { useState, useCallback } from 'react';
import { addUser as apiAddUser, removeUser as apiRemoveUser, User, AddUserPayload } from '../../api/users.api';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

export function useUsers() {
  const [state, setState] = useState<UsersState>({ users: [], isLoading: false, error: null });

  const addUser = useCallback(async (payload: AddUserPayload) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const created = await apiAddUser(payload);
      setState((prev) => ({ ...prev, users: [...prev.users, created], isLoading: false }));
      return created;
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to add user';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  const removeUser = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await apiRemoveUser(id);
      setState((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      const message = err?.response?.data?.error ?? err?.message ?? 'Failed to remove user';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw err;
    }
  }, []);

  return { ...state, addUser, removeUser };
}
