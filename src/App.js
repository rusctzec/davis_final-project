import React from 'react';
import { Link, Route, Switch } from 'react-router-dom'
import GameCanvas from './components/GameCanvas';
import Gallery from './components/Gallery';
import Home from './components/Home';
import { InputProvider } from './utils/InputStore';
import './style.css';
function App() {
  return (
    <InputProvider>
      <Route exact={true} path="/game/:roomName" component={GameCanvas}/>
      <Route exact={true} path="/" component={Home}/>
      <Route exact={true} path="/gallery" component={Gallery}/>
      <Route exact={true} path="/login" component={Gallery}/>
    </InputProvider>
  );
}

export default App;