import React from 'react';
import { Route, Switch } from 'react-router-dom'
import GameCanvas from './components/GameCanvas';
import Gallery from './components/Gallery';
import Home from './components/Home';
import NotFound from './components/NotFound';
import { InputProvider } from './utils/InputStore';
import './style.css';
function App() {

  return (
    <InputProvider>
      <Switch>
        <Route exact={true} path="/game/:roomName(\b[0-9a-zA-Z]{1,6}\b)" component={GameCanvas}/>
        <Route exact={true} path="/gallery" component={Gallery}/>
        <Route exact={true} path="/login" component={Gallery}/>
        <Route exact={true} path="/" component={Home}/>
        <Route component={NotFound}/>
      </Switch>
    </InputProvider>
  );
}

export default App;