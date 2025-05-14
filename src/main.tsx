import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'react-data-grid/lib/styles.css';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <Toaster position="top-right" richColors />
      <App />
    </Router>
  </React.StrictMode>,
)
