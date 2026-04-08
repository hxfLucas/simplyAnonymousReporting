import { StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import App from './App';
import './index.css';

function Root() {
  const { mode } = useThemeContext();
  const muiTheme = useMemo(() => getTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </MuiThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </StrictMode>,
);
