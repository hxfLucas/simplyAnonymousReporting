import { useState } from 'react';
import { changeOwnPassword as changeOwnPasswordApi, signOutAllDevices as signOutAllDevicesApi } from '../../api/users.api';
import { useAuth } from './useAuth';
import { extractErrorMessage } from '../../utils/extractErrorMessage';

interface ActionState {
  isLoading: boolean;
  error: string | null;
}

const defaultState: ActionState = { isLoading: false, error: null };

export function useSettings() {
  const { signOut } = useAuth();

  const [changePasswordState, setChangePasswordState] = useState<ActionState>(defaultState);
  const [signOutAllDevicesState, setSignOutAllDevicesState] = useState<ActionState>(defaultState);

  async function changePassword(payload: { currentPassword: string; newPassword: string }) {
    setChangePasswordState({ isLoading: true, error: null });
    try {
      await changeOwnPasswordApi(payload);
      setChangePasswordState({ isLoading: false, error: null });
    } catch (err: any) {
      setChangePasswordState({
        isLoading: false,
        error: extractErrorMessage(err, 'An error occurred'),
      });
    }
  }

  async function signOutAllDevices() {
    setSignOutAllDevicesState({ isLoading: true, error: null });
    try {
      await signOutAllDevicesApi();
      setSignOutAllDevicesState({ isLoading: false, error: null });
      signOut();
    } catch (err: any) {
      setSignOutAllDevicesState({
        isLoading: false,
        error: extractErrorMessage(err, 'An error occurred'),
      });
    }
  }

  return {
    changePassword,
    changePasswordState,
    signOutAllDevices,
    signOutAllDevicesState,
  };
}
