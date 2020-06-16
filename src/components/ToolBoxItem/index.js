import React, {useRef, useState} from 'react';
import './style.css';


function activationHandler(e) {
  e.target.classList.remove("runAnimation");
  void e.target.offsetWidth;
  e.target.classList.add("runAnimation");
  e.target.setAttribute("active", e.active);
}

const ToolBoxItem = (props) => {
  let elementRef = useRef(null);
  let activeRef = useRef(false); // stores whether the element is currently "active" so that it can replay the animation when it changes between true or false
  if (elementRef.current && props.active && activeRef.current != props.active) {
    activationHandler({target: elementRef.current, active: props.active});
  } else if (elementRef.current && !props.active && activeRef.current != props.active && props.animBoth) {
    activationHandler({target: elementRef.current, active: props.active});
  }
  if (props.active != null) { activeRef.current = props.active; }

  return (
    <div
      ref={elementRef}
      className={`${props.className} toolBoxItem`}
      title={props.name}
      onClick={e => {props.onClick(); e.stopPropagation()}}
      onMouseMove={e => e.stopPropagation()}
      draggable="false"
      active={String(props.active)}
    >
      <img src={props.img} alt={props.name}/>
      {props.value ? <input type="number" min="1" max="10" value={props.value} onChange={props.onChange}></input> : null}
    </div>
  );
}

export default ToolBoxItem;