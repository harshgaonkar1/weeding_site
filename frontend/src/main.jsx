import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logErrorToTerminal } from './components/ErrorBoundary.jsx'

// Global handlers to capture uncaught errors and log them directly in the terminal
window.addEventListener('error', (event) => {
  logErrorToTerminal(event.error || { message: event.message }, {
    url: event.filename,
    line: event.lineno,
    column: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logErrorToTerminal(event.reason || { message: 'Unhandled Promise Rejection' });
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
