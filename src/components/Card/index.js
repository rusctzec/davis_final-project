import React from 'react';
import Flex from '../Flex';

export default function Card(props) {

  let mediaStyle = {
    margin: '0 auto 15px',
    width: props.width,
    height: props.height,
    maxWidth: '80vw',
  };

  return (
    <Flex col nowrap justifyContent="center" style={{width: +props.width, maxWidth: '80vw', textAlign: 'center'}}>
      {
        props.image ? <img className="borderShadow" src={props.src} width={props.width} height={props.height} style={mediaStyle}/>
        :
        props.video ? <video className="borderShadow" loop={props.loop} muted={props.muted} autoPlay={props.autoPlay} width={props.width} height={props.height} style={mediaStyle}>
          <source src={props.src}/>
        </video>
        : null
      }
      {props.children}
    </Flex>
  );
}