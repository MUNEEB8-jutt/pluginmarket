import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Set API base URL
window.API_BASE = 'http://localhost:8000/api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
