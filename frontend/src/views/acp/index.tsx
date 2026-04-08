import { useState } from 'react';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { Assessment as AssessmentIcon, People as PeopleIcon, VpnKey as VpnKeyIcon, Summarize as SummarizeIcon, Dashboard as DashboardIcon } from '@mui/icons-material';
import ThemeToggle from '../../components/ThemeToggle';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/modules/useAuth';
import { useNotifications } from '../../hooks/modules/useNotifications';
import useIsReportsRoute from '../../hooks/useIsReportsRoute';

const DRAWER_WIDTH = 240;

export default function ACPLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const { unread } = useNotifications();
  const isReportsRoute = useIsReportsRoute();
  console.log("Unread content: ", unread);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/acp/dashboard', icon: <DashboardIcon /> },
    { label: 'Reports', path: '/acp/reports', icon: <AssessmentIcon /> },
    { label: 'Users', path: '/acp/users', icon: <PeopleIcon /> },
    { label: 'Magic Links', path: '/acp/magiclinks', icon: <VpnKeyIcon /> },
  ];

  return (
    <Box display="flex" minHeight="100vh">
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box px={2} py={2.5}>
          <Typography variant="h6" color="primary" fontWeight={700}>
            EthicReport
          </Typography>
        </Box>

        <List disablePadding>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main area */}
      <Box display="flex" width={'100%'} flexDirection="column" flexGrow={1}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Toolbar>
            <Typography variant="subtitle1" fontWeight={600} flexGrow={1}>
              EthicReport ACP
            </Typography>
            <ThemeToggle />
            <Badge
              badgeContent={unread}
              invisible={unread === 0}
              color="error"
              max={99}
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              onClick={() => {
                if (!isReportsRoute) navigate('/acp/reports');
              }}
              sx={(theme) => ({
                mr: 1,
                cursor: isReportsRoute ? 'default' : 'pointer',
                '& .MuiBadge-badge': {
                  display: unread === 0 ? 'none' : 'inline-flex',
                  transform: 'translate(-35%, 35%)',
                  fontSize: theme.typography.pxToRem(9),
                  height: 16,
                  minWidth: 16,
                  padding: '0 3px',
                  borderRadius: 8,
                },
              })}
            >
              <IconButton
                size="small"
                aria-label="New Reports"
                disabled={isReportsRoute}
                onClick={() => navigate('/acp/reports')}
                sx={{ color: isReportsRoute ? 'text.disabled' : undefined }}
              >
                <SummarizeIcon fontSize="small" />
              </IconButton>
            </Badge>
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchorEl(e.currentTarget)}
              aria-label="User menu"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                {user?.email ? user.email.charAt(0).toUpperCase() : ''}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={() => setMenuAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  navigate('/acp/settings');
                }}
              >
                Settings
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchorEl(null);
                  setSignOutDialogOpen(true);
                }}
              >
                Sign Out
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box flexGrow={1} p={3} bgcolor="background.default">
          <Outlet />
        </Box>
      </Box>

      <Dialog
        open={signOutDialogOpen}
        onClose={() => setSignOutDialogOpen(false)}
      >
        <DialogTitle>Sign Out</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sign out?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSignOutDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={signOut} color="error" variant="contained">
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
