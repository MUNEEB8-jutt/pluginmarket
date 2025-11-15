import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set API base URL
window.API_BASE = process.env.REACT_APP_API_URL || 'https://pluginmarket-backend.vercel.app/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
