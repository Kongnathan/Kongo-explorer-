import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Suppress benign HMR WebSocket or Vite connection errors in the sandbox environment
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonStr = reason ? (typeof reason === 'string' ? reason : (reason.message || String(reason) || '')) : '';
  
  const isWebsocketOrHmrEvent = reason && (
    reason instanceof Event ||
    (typeof CloseEvent !== 'undefined' && reason instanceof CloseEvent) ||
    reason.constructor?.name?.includes('Event') ||
    reason.constructor?.name?.includes('WebSocket') ||
    (reason.target && (reason.target instanceof WebSocket || reason.target.constructor?.name === 'WebSocket'))
  );

  const lower = reasonStr.toLowerCase();
  if (
    isWebsocketOrHmrEvent ||
    lower.includes('websocket') ||
    lower.includes('vite') ||
    lower.includes('closed without opened') ||
    lower.includes('hmr') ||
    lower.includes('connection') ||
    lower.includes('failed to connect')
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    console.warn('[Benign HMR Suppressed unhandledrejection]', reasonStr || reason);
  }
}, { capture: true });

window.addEventListener('error', (event) => {
  const error = event.error;
  const message = event.message || (error && error.message) || '';
  
  const isWebsocketOrHmrEvent = (
    event.target && (event.target instanceof WebSocket || event.target.constructor?.name === 'WebSocket')
  ) || (
    error && (
      error instanceof Event ||
      error.constructor?.name?.includes('Event') ||
      (error.target && (error.target instanceof WebSocket || error.target.constructor?.name === 'WebSocket'))
    )
  );

  if (
    (message && (
      message.toLowerCase().includes('websocket') ||
      message.toLowerCase().includes('vite') ||
      message.toLowerCase().includes('closed without opened') ||
      message.toLowerCase().includes('hmr') ||
      message.toLowerCase().includes('connection') ||
      message.toLowerCase().includes('failed to connect'))
    ) ||
    isWebsocketOrHmrEvent
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    console.warn('[Benign HMR Suppressed error]', message || event);
  }
}, { capture: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Register Service Worker for PWA (Progressive Web App)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);
      })
      .catch(error => {
        console.log('[PWA] Service Worker registration failed:', error);
      });
  });
}

