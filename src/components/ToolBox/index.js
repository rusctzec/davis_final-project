import React from 'react';
import './style.css';
import ToolBoxItem from '../ToolBoxItem';

const ToolBox = (props) => {

  return (
    <div className="toolBox">
      <ToolBoxItem
      className="numberInput"
      img="/assets/images/brush.svg"
      onChange={e => props.onChange({brushSize: isNaN(e.target.value) ? props.state.brushSize : Math.min(Math.max(parseInt(e.target.value),1),10) })}
      onClick={() => props.dispatch(props.tools.brush)}
      active={props.state.active === props.tools.brush}
      value={props.state.brushSize}
      visible={!props.drawingDisabled}
      name="Brush [B]"/>
      <ToolBoxItem
      className="numberInput"
      img="/assets/images/eraser.svg"
      onChange={e => props.onChange({eraserSize: isNaN(e.target.value) ? props.state.eraserSize : Math.min(Math.max(parseInt(e.target.value),1),10) })}
      onClick={() => props.dispatch(props.tools.eraser)}
      active={props.state.active === props.tools.eraser}
      value={props.state.eraserSize}
      visible={!props.drawingDisabled}
      name="Eraser [E]"/>
      <ToolBoxItem
      img="/assets/images/hand.svg"
      onClick={() => props.dispatch(props.tools.panning)}
      active={props.state.active === props.tools.panning}
      name="Pan Tool [Space]"/>
      <ToolBoxItem
      img="/assets/images/cannon.svg"
      onClick={() => props.dispatch(props.tools.cannon)}
      active={props.state.active === props.tools.cannon}
      visible={props.state.gameMode && !props.state.roomSettings.disableProjectiles}
      name="Cannon [C]"/>
      <ToolBoxItem
      onClick={props.toggleGameMode}
      img={props.state.gameMode ? "/assets/images/stop.svg" : "/assets/images/play.svg"}
      animBoth={true}
      active={props.state.gameMode}
      name={props.state.gameMode ? "Exit Game [G]" : "Enter Game [G]"}/>
    </div>
  );
}


export default ToolBox;