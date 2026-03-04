import {
  AppBar,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Assessment as AssessmentIcon, People as PeopleIcon } from '@mui/icons-material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/modules/useAuth';

const DRAWER_WIDTH = 240;

export default function ACPLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { signOut } = useAuth();

  const navItems = [
    { label: 'Reports', path: '/acp/reports', icon: <AssessmentIcon /> },
    { label: 'Users', path: '/acp/users', icon: <PeopleIcon /> },
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
            bridgeIn
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
      <Box display="flex" flexDirection="column" flexGrow={1}>
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
              bridgeIn ACP
            </Typography>
            {user?.email && (
              <Typography variant="body2" mr={2} color="text.secondary">
                {user.email}
              </Typography>
            )}
            <Button variant="outlined" size="small" onClick={signOut}>
              Sign Out
            </Button>
          </Toolbar>
        </AppBar>

        <Box flexGrow={1} p={3} bgcolor="background.default">
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
