import './index.css';

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';

import App from './ui/App';

const rootElement = document.getElementsByName('main')[0];

rootElement &&
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
