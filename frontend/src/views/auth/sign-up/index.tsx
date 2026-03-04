import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../hooks/modules/useAuth';

export default function SignUpPage() {
  const { signUp, signUpState } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    setLocalError(null);
    signUp({ email, password });
  };

  const displayError = localError ?? signUpState.error;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      px={2}
    >
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join bridgeIn today
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
          />

          {displayError && (
            <Alert severity="error">{displayError}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={signUpState.isLoading}
          >
            {signUpState.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Create Account'}
          </Button>
        </Box>
      </Paper>

      <Typography variant="body2" mt={3}>
        Already have an account?{' '}
        <MuiLink component={RouterLink} to="/sign-in">
          Sign in
        </MuiLink>
      </Typography>
    </Box>
  );
}
