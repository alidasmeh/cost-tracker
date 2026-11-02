import { Component } from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <Box sx={{ p: 2 }}><Alert severity="error"><AlertTitle>Something went wrong</AlertTitle>{String(this.state.error.message || this.state.error)}</Alert></Box>;
  }
}
