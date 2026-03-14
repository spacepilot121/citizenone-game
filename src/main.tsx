import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { GameStoreProvider } from './game/store/GameStore';
import './styles/reset.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GameStoreProvider>
      <App />
    </GameStoreProvider>
  </React.StrictMode>
);
