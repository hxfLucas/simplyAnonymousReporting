import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useReports, STATUS_LABELS, STATUS_COLORS } from '../../../hooks/modules/useReports';
import type { ReportStatus } from '../../../api/reports.api';
import type { Report } from '../../../api/reports.api';
import { useAuthContext } from '../../../contexts/AuthContext';

// Date formatter helper: e.g. "4th, March, 2026"
function formatDateWithOrdinal(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = d.getDate();
  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  };
  const month = d.toLocaleDateString(undefined, { month: 'long' });
  const year = d.getFullYear();
  return `${day}${getOrdinal(day)}, ${month} ${year}`;
}

export default function ReportsPage() {
  const { reports, isLoading, error, fetchReports, removeReport, changeReportStatus } = useReports();
  const { user: currentUser } = useAuthContext();
  const isManager = currentUser?.role === 'manager';
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string>('');
  
  // For viewing report details
  const [viewReport, setViewReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenDeleteDialog = (id: string) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) removeReport(pendingDeleteId);
    setDeleteDialogOpen(false);
    setPendingDeleteId('');
  };

  const allStatuses: ReportStatus[] = ['new', 'in_review', 'resolved', 'rejected'];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Reports
        </Typography>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading && reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">No reports found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>
                    <Chip
                      label={STATUS_LABELS[report.status]}
                      color={STATUS_COLORS[report.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDateWithOrdinal(report.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                      <Select
                        size="small"
                        value={report.status}
                        onChange={(e) =>
                          changeReportStatus(report.id, e.target.value as ReportStatus)
                        }
                        sx={{ minWidth: 120 }}
                      >
                        {allStatuses.map((s) => (
                          <MenuItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </MenuItem>
                        ))}
                      </Select>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => setViewReport(report)}
                        aria-label="view report"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <Tooltip
                        title={isManager ? 'Insufficient permissions, contact the administrator' : ''}
                        disableHoverListener={!isManager}
                      >
                        <span>
                          <IconButton
                            size="small"
                            color={isManager ? 'default' : 'error'}
                            onClick={isManager ? undefined : () => handleOpenDeleteDialog(report.id)}
                            aria-label="delete report"
                            disabled={isManager}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Report?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onClose={() => setViewReport(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{viewReport?.title}</DialogTitle>
        <Divider />
        <DialogContent>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Status
            </Typography>
            {viewReport?.status && (
              <Chip
                label={STATUS_LABELS[viewReport.status]}
                color={STATUS_COLORS[viewReport.status]}
                size="small"
              />
            )}
          </Box>
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Date Created
            </Typography>
            <Typography variant="body2">
              {viewReport ? formatDateWithOrdinal(viewReport.createdAt) : ''}
            </Typography>
          </Box>
          <Box mt={3}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Description
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {viewReport?.description}
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewReport(null)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
