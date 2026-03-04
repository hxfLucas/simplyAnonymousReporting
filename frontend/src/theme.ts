import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4A6FA5',
      light: '#6B8FC7',
      dark: '#2D4F85',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E8871A',
      light: '#FFB04A',
      dark: '#B55A00',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F4F6F9',
      paper: '#ffffff',
    },
    text: {
      primary: '#1A2332',
      secondary: '#5A6778',
    },
    error: { main: '#D32F2F' },
    warning: { main: '#F59E0B' },
    info: { main: '#0288D1' },
    success: { main: '#2E7D32' },
  },
  typography: {
    fontFamily: '"Inter", "system-ui", "-apple-system", "sans-serif"',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
  },
});

export default theme;
