import React from 'react';
import './style.css';

let Overlay = props => {
  return <div className="loadingOverlay" style={{
    opacity: props.visible ? 1 : 0,
    pointerEvents: props.visible ? 'auto' : 'none',
  }}>
      {
        props.display == "connecting" ?
          <div>Connecting...</div>
        :
        props.display == "disconnected" ?
          <div>
            <div>Disconnected</div>
            <button onClick={window.location.reload()}>Attempt to Reconnect</button>
            <button onClick={window.location.href = "/gallery"}>Return to Gallery</button>
          </div>
        :
        "[Error]"
      }
  </div>
};

export default Overlay;