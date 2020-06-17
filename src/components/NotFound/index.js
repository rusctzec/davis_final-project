import React from 'react';
import { useHistory } from 'react-router-dom';
import './style.css';

const NotFound = props => {

  const { push } = useHistory();

  return (
    <div className="notFound">
      <h1>Not Found</h1>
      <div>The page you were looking for is not here.</div>
      <button onClick={() => push("/gallery")}>Return to Gallery</button>
    </div>
  );
}

export default NotFound;