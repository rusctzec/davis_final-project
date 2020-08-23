import React from 'react';
import { useHistory } from 'react-router-dom';
import './style.css';

const GalleryItem = props => {
  const { push } = useHistory();
  let data = props.data;
  let {height, width} = data;

  // finish figuring out dynamic rescaling later
  let scale = Math.min(
    300 / width,
    300 / height,
  );

  scale = 0.5;

  return (
    <div onClick={() => push(`/game${data.name}`)} className="galleryItem">
      <div style={{width: width*scale, height: height*scale}}>
        <div className="galleryImage"
        style={{
          width: width,
          height: height,
          transform: `scale(${scale}) translate(-50%, -50%) `,
          backgroundImage: `url('/thumbnails${data.name}')`}}/>
      </div>
      <div className="galleryItemDesc">
        <div>{data.name}</div>
        <div>{width}x{height}px</div>
        <div>{data.players} players</div>
        {data.allowGuests ? null : <div>No Guests</div>}
      </div>
    </div>
  );
}

export default GalleryItem;