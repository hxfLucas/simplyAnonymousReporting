import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import TableContainerWrapper from '../../../components/TableContainerWrapper';
import { Add as AddIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useUsers } from '../../../hooks/modules/useUsers';
import { useSearch } from '../../../hooks/modules/useSearch';
import { formatDate } from '../../../utils/formatDate';
import { useAuthContext } from '../../../contexts/AuthContext';

export default function UsersPage() {
  const { users, isLoading, isLoadingMore, error, fetchInitial, loadMore, addUser, addUserState, clearAddUserState, removeUser, updateUserPassword, fetchUsers } = useUsers();
  const { user: currentUser } = useAuthContext();
  const isManager = currentUser?.role === 'manager';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string>('');
  const [editPassword, setEditPassword] = useState('');

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounced search callback — empty string resets to the unfiltered list.
  // Always calls fetchUsers directly (never fetchInitial) so that searchQueryRef
  // inside useUsers is properly reset to '' when clearing the input.
  const handleSearch = useCallback((query: string) => {
    fetchUsers(query);
  }, [fetchUsers]);

  const { searchValue, setSearchValue } = useSearch('', 250, handleSearch);

  useEffect(() => {
    fetchInitial();
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, []);

  const handleOpenDialog = () => {
    setName('');
    setEmail('');
    setPassword('');
    clearAddUserState();
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUser({ name, email, password });
      setDialogOpen(false);
    } catch {
      // error is captured in addUserState.error; keep dialog open
    }
  };

  const handleOpenEditDialog = (userId: string) => {
    setEditUserId(userId);
    setEditPassword('');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserPassword(editUserId, editPassword);
    setEditDialogOpen(false);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    fetchUsers('');
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Users
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add User
        </Button>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Box sx={{ mb: 2, maxWidth: 1056, width: '100%', mx: 'auto' }}>
        <TextField
          placeholder="Search by email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          fullWidth
          size="small"
          InputProps={{
            endAdornment: searchValue.length > 0 && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  edge="end"
                  aria-label="clear search"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainerWrapper component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No users yet. Add one above.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? formatDate(user.createdAt) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip
                      title={isManager ? 'Insufficient permissions, contact the administrator' : ''}
                      disableHoverListener={!isManager}
                    >
                      <span>
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => handleOpenEditDialog(user.id)}
                          aria-label="edit user password"
                          disabled={isManager}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={isManager || user.role === 'admin' ? 'Insufficient permissions, contact the administrator' : ''}
                      disableHoverListener={!isManager && user.role !== 'admin'}
                    >
                      <span>
                        <IconButton
                          size="small"
                          color={isManager || user.role === 'admin' ? 'default' : 'error'}
                          onClick={isManager || user.role === 'admin' ? undefined : () => removeUser(user.id)}
                          aria-label="delete user"
                          disabled={isManager || user.role === 'admin'}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainerWrapper>

      <div ref={sentinelRef} style={{ height: 1 }} />
      {isLoadingMore && <LinearProgress sx={{ mt: 1 }} />}

      {/* Add User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              inputProps={{ minLength: 6 }}
              helperText="Minimum 6 characters"
            />
            {addUserState.error && (
              <Alert severity="error">{addUserState.error}</Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={addUserState.isLoading}>
              Submit
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Edit User Password Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="New Password"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              required
              fullWidth
              inputProps={{ minLength: 6 }}
              helperText="Minimum 6 characters"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
