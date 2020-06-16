import React from 'react';
import './style.css';
import { useHistory } from 'react-router-dom';

const Home = props => {

  const { push } = useHistory();

  return (
    <main>
      <div className="titleBlock">
        <div className="filler"></div>
        <h1>Malleary</h1>
        <p>the multiplayer drawing game.</p>
      </div>
      <button onClick={() => push("/gallery")} className="big">Visit Gallery</button>
    </main>
  );
};

export default Home;