import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {PwaInstallGate} from './components/PwaInstallGate.tsx';
import './index.css';

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/video-cache-worker.js').catch((error) => {
      console.warn('Video cache worker registration failed.', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaInstallGate>
      <App />
    </PwaInstallGate>
  </StrictMode>,
);
