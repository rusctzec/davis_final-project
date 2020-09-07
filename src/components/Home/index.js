import React from 'react';
import './style.css';
import Flex from '../Flex';
import Card from '../Card';
import { useHistory } from 'react-router-dom';

const Home = props => {

  const { push } = useHistory();

  return (
    <main className="home">
      <div className="titleBlock">
        <div className="filler"></div>
        <h1>Malleary</h1>
        <p>the multiplayer drawing game.</p>
      </div>
      <Flex row wrap alignContent="center" justifyContent="center">
        <Card video loop muted autoPlay width="500" src="/assets/media/gameplay1.webm">
          Draw together, create illustrations with others in real time! Sign up with a username to create a private room to share with your friends.
        </Card>
        <Card video loop muted autoPlay width="500" src="/assets/media/gameplay2.webm">
          Enter and explore a world formed by the drawings of you and your friends, in classic platformer-game style!
        </Card>
      </Flex>
      <button onClick={() => push("/gallery")} className="big shadow" style={{marginTop: 50, marginBottom: 50}}>Visit Gallery</button>
    </main>
  );
};

export default Home;