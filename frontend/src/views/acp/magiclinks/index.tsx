import { useState, useEffect } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, LinearProgress, Paper, Snackbar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { Delete as DeleteIcon, VpnKey as VpnKeyIcon } from '@mui/icons-material';
import { useMagicLinks } from '../../../hooks/modules/useMagicLinks';
import { useAuthContext } from '../../../contexts/AuthContext';

export default function MagicLinksPage() {
  const { magicLinks, isLoading, error, fetchMagicLinks, generateMagicLink, removeMagicLink } = useMagicLinks();
  const { user } = useAuthContext();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMagicLinks();
  }, []);

  const handleConfirmGenerate = async () => {
    await generateMagicLink(aliasInput || undefined);
    setDialogOpen(false);
    setAliasInput('');
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const truncateEmail = (email: string) => {
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    return email.slice(0, atIndex) + '@...';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={600}>Magic Links</Typography>
        <Button variant="contained" startIcon={<VpnKeyIcon />} onClick={() => setDialogOpen(true)}>
          Generate Magic Link
        </Button>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Alias</TableCell>
              <TableCell>Link</TableCell>
              <TableCell>Creator</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && magicLinks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">No magic links yet. Generate one above.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              magicLinks.map((link) => {
                const fullUrl = `${import.meta.env.VITE_BASE_LINK}/report/${link.reportingToken}`;
                const canDelete = user?.role === 'admin' || link.createdBy?.id === user?.id;

                return (
                  <TableRow key={link.id}>
                    <TableCell>
                      {link.alias ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={copiedId === link.id ? 'Copied!' : 'Click to copy'}>
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleCopyLink(link.id, fullUrl)}
                        >
                          {fullUrl}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {link.createdBy ? (
                        <Tooltip title={link.createdBy.email}>
                          <span>{truncateEmail(link.createdBy.email)}</span>
                        </Tooltip>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{new Date(link.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title={canDelete ? 'Delete' : 'You can only delete your own links'}>
                        <span>
                          <IconButton
                            color={canDelete ? 'error' : 'default'}
                            disabled={!canDelete}
                            onClick={() => removeMagicLink(link.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Generate Magic Link</DialogTitle>
        <DialogContent>
          <TextField
            label="Alias (optional)"
            fullWidth
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmGenerate}>Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={copiedId !== null}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
