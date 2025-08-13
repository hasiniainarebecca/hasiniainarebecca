// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// import { BrowserRouter } from 'react-router-dom'; // <-- Supprimez ou commentez cette ligne si elle existe

import { UnreadCountProvider } from './contexts/UnreadCountContext.jsx'; // Importez le fournisseur

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ENVELOPPEZ VOTRE COMPOSANT RACINE DE L'APPLICATION AVEC LE FOURNISSEUR */}
    {/* Nous retirons <BrowserRouter> d'ici car il est déjà dans App.jsx */}
    <UnreadCountProvider>
      <App />
    </UnreadCountProvider>
  </React.StrictMode>,
);