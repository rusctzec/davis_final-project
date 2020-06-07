import React from 'react';
import GameCanvas from './components/GameCanvas';
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