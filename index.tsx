import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Check if the environment supports Service Workers (HTTP/HTTPS only)
    if (!window.location.protocol.startsWith('http')) {
      return; 
    }

    let swUrl = './sw.js';
    
    try {
      // 1. Try to construct an absolute URL based on window.location
      // This fixes "origin mismatch" issues in preview environments where <base> tags might be present.
      swUrl = new URL('./sw.js', window.location.href).href;
    } catch (e) {
      // 2. Fallback: If window.location.href is invalid (e.g. 'about:blank'), 
      // we default back to the relative string './sw.js'.
      swUrl = './sw.js';
    }

    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        // Gracefully handle common errors in cloud IDEs / preview environments
        const msg = registrationError?.message || '';
        if (
          msg.toLowerCase().includes('origin') || 
          msg.toLowerCase().includes('mismatch') || 
          msg.toLowerCase().includes('scripturl')
        ) {
          console.debug('Service Worker skipped: Environment origin restriction.');
        } else {
          console.error('SW registration failed: ', registrationError);
        }
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);