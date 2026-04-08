import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useSettings } from '../../../hooks/modules/useSettings';

export default function SettingsPage() {
  const { changePassword, changePasswordState, signOutAllDevices, signOutAllDevicesState } = useSettings();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmNewPassword) {
      setLocalError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setLocalError('New password must be at least 6 characters');
      return;
    }

    await changePassword({ currentPassword, newPassword });

    if (!changePasswordState.error) {
      setSuccessMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    }
  }

  return (
    <Box p={4} maxWidth={560}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Settings
      </Typography>

      {/* Change Password */}
      <Typography variant="h6" mb={2}>
        Change Password
      </Typography>
      <Box component="form" onSubmit={handleChangePassword} display="flex" flexDirection="column" gap={2}>
        <TextField
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          size="small"
        />
        <TextField
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          size="small"
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
          size="small"
        />

        {(localError || changePasswordState.error) && (
          <Alert severity="error">{localError ?? changePasswordState.error}</Alert>
        )}
        {successMsg && !changePasswordState.error && (
          <Alert severity="success">{successMsg}</Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          disabled={changePasswordState.isLoading}
          sx={{ alignSelf: 'flex-start' }}
        >
          {changePasswordState.isLoading ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Sign Out All Devices */}
      <Typography variant="h6" mb={1}>
        Sign Out All Devices
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        This will immediately invalidate all active sessions across every device. You will be signed out here as well.
      </Typography>

      {signOutAllDevicesState.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {signOutAllDevicesState.error}
        </Alert>
      )}

      <Button
        variant="contained"
        color="warning"
        disabled={signOutAllDevicesState.isLoading}
        onClick={signOutAllDevices}
      >
        {signOutAllDevicesState.isLoading ? 'Signing out...' : 'Sign Out All Devices'}
      </Button>
    </Box>
  );
}
