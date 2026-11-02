import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import App from './App.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

function Root() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme({
    palette: { mode: prefersDark ? 'dark' : 'light', primary: { main: '#3f51b5' }, secondary: { main: '#e91e63' } },
    shape: { borderRadius: 12 },
    components: { MuiCard: { defaultProps: { variant: 'outlined' } } },
  }), [prefersDark]);
  return <ThemeProvider theme={theme}><CssBaseline /><ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary></ThemeProvider>;
}
ReactDOM.createRoot(document.getElementById('root')).render(<Root />);

// Only in the built app: in dev the worker would serve stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
