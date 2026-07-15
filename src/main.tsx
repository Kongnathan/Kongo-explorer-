import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign HMR WebSocket or Vite connection errors in the sandbox environment
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason && (reason.message || String(reason));
  if (
    message &&
    (message.toLowerCase().includes('websocket') ||
     message.toLowerCase().includes('vite') ||
     message.toLowerCase().includes('closed without opened') ||
     message.toLowerCase().includes('hmr') ||
     message.toLowerCase().includes('connection') ||
     message.toLowerCase().includes('failed to connect'))
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    console.warn('[Benign HMR Suppressed unhandledrejection]', message);
  }
}, { capture: true });

window.addEventListener('error', (event) => {
  const message = event.message || (event.error && event.error.message);
  if (
    message &&
    (message.toLowerCase().includes('websocket') ||
     message.toLowerCase().includes('vite') ||
     message.toLowerCase().includes('closed without opened') ||
     message.toLowerCase().includes('hmr') ||
     message.toLowerCase().includes('connection') ||
     message.toLowerCase().includes('failed to connect'))
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    console.warn('[Benign HMR Suppressed error]', message);
  }
}, { capture: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
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

