import React, { useState, useEffect } from 'react';
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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/modules/useAuth';
import { checkSession } from '../../../api/auth.api';
import { getRefreshToken } from '../../../api/axios';
import { useAuthContext } from '../../../contexts/AuthContext';

export default function SignInPage() {
  const { signIn, signInState } = useAuth();
  const { updateSession } = useAuthContext();
  const navigate = useNavigate();


  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn({ email, password });
  };

  useEffect(() => {
    if (!getRefreshToken()) return;
      checkSession()
        .then((session) => {
          if (session.valid) {
            updateSession(session);
            navigate('/acp');
          }
        })
        .catch(() => {
          // ignore
        });
  }, [navigate, updateSession]);

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
            Sign in to EthicReport
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your credentials to continue
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

          {signInState.error && (
            <Alert severity="error">{signInState.error}</Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={signInState.isLoading}
          >
            {signInState.isLoading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>

      <Typography variant="body2" mt={3}>
        Don&apos;t have an account?{' '}
        <MuiLink component={RouterLink} to="/sign-up">
          Sign up
        </MuiLink>
      </Typography>
    </Box>
  );
}
