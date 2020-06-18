import React from 'react';
import './style.css';

let Overlay = props => {
  return <div className="loadingOverlay" style={{
    opacity: props.visible ? 1 : 0,
    pointerEvents: props.visible ? 'auto' : 'none',
  }}>
    <div>{props.text}</div>
    {props.buttons ?
    <div>
      <button onClick={() => window.location.reload()}>Attempt to Reconnect</button>
      <button onClick={() => window.location.href = "/gallery"}>Return to Gallery</button>
    </div> : null}
  </div>
};

export default Overlay;