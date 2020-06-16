import React from 'react';
import { useHistory } from 'react-router-dom';
import './style.css';

const GalleryItem = props => {
  let {height, width, name, players} = props.data;
  const { push } = useHistory();
  // finish figuring out dynamic rescaling later
  let scale = Math.min(
    300 / width,
    300 / height,
  );

  scale = 0.5;

  return (
    <div onClick={() => push(`/game${name}`)} className="galleryItem">
      <div style={{width: width*scale, height: height*scale}}>
        <div className="galleryImage"
        style={{
          width: width,
          height: height,
          transform: `scale(${scale}) translate(-50%, -50%) `,
          backgroundImage: `url('/assets/images/rooms${name}.png')`}}/>
      </div>
      <div className="galleryItemDesc">
        <div>{name}</div>
        <div>{width}x{height}px</div>
        <div>{players} players</div>
      </div>
    </div>
  );
}

export default GalleryItem;