import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAutoCacheBuster } from './utils/cacheBuster.ts';

// Auto-purge stale service workers, clear old caches and verify latest build
initAutoCacheBuster();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
