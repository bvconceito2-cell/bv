import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import GlobalErrorBoundary from './components/GlobalErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <HelmetProvider>
          <App />
        </HelmetProvider>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}


