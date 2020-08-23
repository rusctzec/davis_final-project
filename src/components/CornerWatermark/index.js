import React from 'react';

export default function CornerWatermark(props) {
  const margin = 5;
  const style = {position: "fixed", pointerEvents: "none", userSelect: "none"};
  switch(props.corner) {
    case "topleft":
      style.top = margin;
      style.left = margin;
      style.textAlign = "left";
      break;
    case "topright":
      style.top = margin;
      style.right = margin;
      style.textAlign = "right";
      break;
    case "bottomleft":
      style.bottom = margin;
      style.left = margin;
      style.textAlign = "left";
      break;
    case "bottomright":
      style.bottom = margin;
      style.right = margin;
      style.textAlign = "right";
      break;
  }

  return (
    <div style={style}>{props.children}</div>
  );
}