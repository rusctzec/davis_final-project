import React from 'react';
import GameCanvas from './components/GameCanvas';
import ReactRouter from 'react-router-dom';
import { InputProvider } from './utils/InputStore';
import './style.css';
function App() {
  return (
    <InputProvider>
      <GameCanvas/>
    </InputProvider>
  );
}

export default App;