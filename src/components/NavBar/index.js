import React from 'react';
import {NavLink, useHistory} from 'react-router-dom'
import { useAuth } from '../../utils/AuthContext';
import './style.css';

const NavBar = props => {

  const { push } = useHistory();

  const auth = useAuth();

  const logOut = () => {
    auth.onReloadNeeded();
    fetch('/api/logout')
    .then(() => {
      push('gallery');
    })
  }

  const visitedStyle = {textDecoration: 'underline'};

  return (
    <nav>
      <div className="navInner">
        <NavLink to="/" exact activeStyle={visitedStyle}>Home</NavLink>
        <NavLink to="/gallery" exact activeStyle={visitedStyle}>Gallery</NavLink>
        <div style={{width: 15, height: 1, backgroundColor: 'white', alignSelf: 'center'}}></div>
        {auth.user.username ? <NavLink to="/gallery" onClick={logOut} exact>Logout</NavLink> : null}
        {!auth.user.username ? <NavLink to="/login" exact activeStyle={visitedStyle}>Login</NavLink> : null}
        {!auth.user.username ? <NavLink to="/signup" exact activeStyle={visitedStyle}>Signup</NavLink> : null}
      </div>
    </nav>
  );
}

export default NavBar;