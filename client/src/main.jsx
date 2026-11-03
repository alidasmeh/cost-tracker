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
    components: {
      MuiCard: { defaultProps: { variant: 'outlined' } },
      // No double-tap zoom on phones; pinch is blocked by the viewport meta (Android) and the gesture listener below (iOS).
      MuiCssBaseline: { styleOverrides: { html: { touchAction: 'manipulation', WebkitTextSizeAdjust: '100%' } } },
    },
  }), [prefersDark]);
  return <ThemeProvider theme={theme}><CssBaseline /><ErrorBoundary><BrowserRouter><App /></BrowserRouter></ErrorBoundary></ThemeProvider>;
}
// iOS Safari ignores user-scalable=no, so cancel its pinch gestures directly.
for (const type of ['gesturestart', 'gesturechange']) document.addEventListener(type, (e) => e.preventDefault(), { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);

// Only in the built app: in dev the worker would serve stale files.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
