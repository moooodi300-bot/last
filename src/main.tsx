import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './registerSW';

registerServiceWorker();

const savedTheme = localStorage.getItem('raqm_theme') || 'default';
document.documentElement.setAttribute('data-theme', savedTheme);


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
