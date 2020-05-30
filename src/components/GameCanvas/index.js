import * as PIXI from 'pixi.js';
import React, {useReducer, useRef, useEffect} from 'react';
import {Stage, Sprite, Container, useTick, Graphics, PixiComponent} from '@inlet/react-pixi';
import {useInputContext} from '../../utils/InputStore';
import './style.css';

const app = new PIXI.Application();
const renderer = new PIXI.autoDetectRenderer();
const canvasSize = {x: 150, y: 150};
const reducer = (_, { data }) => data;

const Bunny = (props) => {
  const [motion, update] = useReducer(reducer);
  const iter = useRef(props.offset || 0);
  useTick(delta => {
    const i = (iter.current += 0.05 * delta);
    update({
      type: 'update',
      data: {
        x: Math.sin(i) * 100,
        y: Math.sin(i) * 100,
        rotation: Math.sin(i) * Math.PI,
        anchor: Math.sin(i / 2),
      },
    });
  });
  return (
    <Sprite
      image="https://s3-us-west-2.amazonaws.com/s.cdpn.io/693612/IaUrttj.png"
      {...motion}
    />
  );
}
// function wrapper for making strokes for any additional logic that needs to be bundled in here
const makeStroke = (x, y, diameter, graphics) => {
  console.log("wario");
  const radius = diameter/2;
  if (radius >= 1) {
    graphics.drawCircle(x, y, radius);
  // for radius under 1 just round up to a single pixel rectangle
  } else if (radius > 0) {
    graphics.drawRect(x, y, 1, 1);
  }
}

// rectangle test component
const Rectangle = PixiComponent('Rectangle', {
  create: props => new PIXI.Graphics(),
  applyProps: (instance, _, props) => {
    const {x, y, width, height, fill} = props;

    instance.clear();
    instance.beginFill(fill);
    instance.drawRect(x, y, width, height);
    instance.endFill();
  }
});

const RenderSprite = PixiComponent('RenderTexture', {
  create: props => {
    let texture = PIXI.RenderTexture.create({width: props.width, height: props.height});
    return new PIXI.Sprite(texture);
  }
});


// handling mouse movement for creating strokes on the screen
const handleMouseMove = (e, graphicsRef, previousPositionRef, settings) => {
  let graphics = graphicsRef.current;

  // check if LMB is down (bitwise flag in MouseEvent.buttons)
  if (e.buttons & 1) {
    graphics.beginFill(0x000000);
    makeStroke(e.pageX, e.pageY, settings.brushSize, graphics);

    // use previous position to linearly interpolate stroke so that there aren't breaks in the line if the cursor moves too quickly
    const [x,y] = previousPositionRef.current;
    s: if (x!=null && y!=null) {
      let distance = Math.sqrt((e.pageX - x)**2 + (e.pageY - y)**2); // calculate distance from previous and current mouse point
      distance = Math.round(distance);
      if (distance <= 0) break s; // dont do anything if mouse hasnt moved at least 1 pixel

      let nX = (e.pageX-x)/distance, nY = (e.pageY-y)/distance; // normalize direction from old to new point

      // make a stroke for every pixel along the distance between the current and previous points
      for (let i = 0; i <= distance; i++) {
        makeStroke(x + nX*i, y + nY*i, settings.brushSize, graphics);
      }
    }
    // update previousposition ( )
    previousPositionRef.current = [e.pageX, e.pageY];
    graphics.endFill();
  } else {
    previousPositionRef.current = [undefined, undefined];
  }
}

// tools enum
const TOOLS = Object.freeze({"brush":0, "eraser": 1})

// component responsible for rendering PIXI related components to the screen
const GameCanvasComponent = () => {
  let graphicsRef = useRef(null);

  let keys = useInputContext();
  console.log(keys);

  // settings
  let settings = useRef({
    brushSize: 5,
    color: 1,
    eraserSize: 5,
    tool: TOOLS.brush,
  });

  // ref to keep track of previous stroke location for calculations
  let previousPositionRef = useRef([undefined, undefined]);

  useEffect(() => {
    let graphics = graphicsRef.current;

    // handle keystrokes
    window.addEventListener('keydown', e => {
      if (e.code == "Space") {
       graphics.clear();
      }
    });


    // test draw
    graphics.beginFill(0x000000);
    graphics.drawRect(50, 50, 1, 1);
    graphics.drawRect(51, 50, 1, 1);
    graphics.drawRect(52, 50, 1, 1);
    graphics.endFill();
  }, []);


  return (
    <Stage onMouseMove={(e) => handleMouseMove(e, graphicsRef, previousPositionRef, settings.current)} onMouseDown={(e) => handleMouseMove(e, graphicsRef, previousPositionRef, settings.current)} width={150} height={150} options={{ transparent: true }}>
      <Graphics x={0} y={0} anchor={0} ref={graphicsRef}></Graphics>
      <RenderSprite width={canvasSize.x} height={canvasSize.y}/>
      <Container x={canvasSize.x} y={canvasSize.y}>
      </Container>
    </Stage>
  )
};

export default GameCanvasComponent;