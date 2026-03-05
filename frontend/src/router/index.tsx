import { createBrowserRouter, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import SignInPage from '../views/auth/sign-in';
import SignUpPage from '../views/auth/sign-up';
import AcpLayout from '../views/acp';
import UsersPage from '../views/acp/users';
import ReportsPage from '../views/acp/reports';
import MagicLinksPage from '../views/acp/magiclinks';
import ReportPage from '../views/report';
import DashboardPage from '../views/acp/dashboard';
import SettingsPage from '../views/acp/settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/acp" replace />,
  },
  {
    path: '/sign-in',
    element: <SignInPage />,
  },
  {
    path: '/sign-up',
    element: <SignUpPage />,
  },
  {
    path: '/report/:reportTokenId',
    element: <ReportPage />,
  },
  {
    path: '/acp',
    element: <PrivateRoute />,
    children: [
      {
        element: <AcpLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/acp/dashboard" replace />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'magiclinks',
            element: <MagicLinksPage />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);

export default router;
