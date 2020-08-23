import React from 'react';
import { Route, Switch } from 'react-router-dom'
import GameCanvas from './components/GameCanvas';
import Gallery from './components/Gallery';
import Home from './components/Home';
import NavBar from './components/NavBar';
import Login from './components/Login';
import Profile from './components/Profile';
import NotFound from './components/NotFound';
import { InputProvider } from './utils/InputStore';
import { AuthProvider, AuthContext } from './utils/AuthContext';
import './style.css';

function App() {

  return (
    <AuthProvider>
      <InputProvider>
        <Switch>
          <Route exact={true} path="/game/:roomName(\b[0-9a-zA-Z]{1,6}\b)" />
          <Route component={NavBar}/>
        </Switch>
        <Switch>
          <Route exact={true} path="/game/:roomName(\b[0-9a-zA-Z]{1,6}\b)" render={props => {
            document.title = "Malleary | " + props.match.params.roomName;
            return (
              <AuthContext.Consumer>
                {context => {
                  return <GameCanvas {...props} auth={context}/>;
                }}
              </AuthContext.Consumer>
            );
          }}/>
          <Route exact={true} path="/gallery" render={props => {
            document.title = "Malleary | Gallery";
            return <Gallery {...props} />
          }}/>
          <Route exact={true} path="/login" render={props => {
            document.title = "Malleary | Login";
            return <Login {...props} />
          }}/>
          <Route exact={true} path="/signup" render={props => {
            document.title = "Malleary | Signup";
            return <Login {...props} signup={true}/>;
          }}/>
          <Route exact={true} path="/" render={props => {
            document.title = "Malleary";
            return <Home {...props} />;
          }}/>
          <Route exact={true} path="/profile" render={props => {
            document.title = "Malleary | Profile";
            return <Profile {...props} />;
          }}/>
          <Route render={props => {
            document.title = "Malleary | 404";
            return <NotFound {...props} />;
          }}/>
        </Switch>
      </InputProvider>
    </AuthProvider>
  );
}

export default App;