import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Para medir a performance do app, passe uma função para registrar os
// resultados (por exemplo: reportWebVitals(console.log)) ou envie a um
// endpoint de analytics. Saiba mais: https://bit.ly/CRA-vitals
reportWebVitals();
