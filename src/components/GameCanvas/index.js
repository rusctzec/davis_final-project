import React, {useContext, useEffect, useRef} from 'react';
import * as PIXI from 'pixi.js';
import './style.css';
import {InputContext} from '../../utils/InputStore';

// tools enum
const TOOLS = Object.freeze({"brush":0, "eraser": 1});
const STATE = Object.freeze({"brush":0, "eraser": 1, "panning": 2});

new PIXI.Application(150, 150);

function randomColor() {
  return (Math.floor(Math.random()*256)*(2**16) +
  Math.floor(Math.random()*256)*(2**8) +
  Math.floor(Math.random()*256));
}


class GameCanvas extends React.Component {

  static contextType = InputContext

  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.strokeCount = 0;
    this.canvasSize = {x: 150, y: 150};
    this.settings = {
      brushSize: 5,
      color: 0x000000,
      eraserSize: 5,
      tool: TOOLS.brush,
      state: TOOLS.brush,
    };
    // to keep track of previous stroke location for calculations
    this.previousPosition = [undefined, undefined];

  }

  render() {
    return (
      <div onClick={this.handleMouseMove.bind(this)} onMouseMove={this.handleMouseMove.bind(this)}>
        <canvas ref={this.canvasRef}/>
      </div>
    );
  }

  componentDidMount() {
    this.canvasRef.current.style.top = "0px";
    this.canvasRef.current.style.left = "0px";
    this.keys = this.context.current.keys;
    this.app = new PIXI.Application({
      view: this.canvasRef.current,
      width: this.canvasSize.x,
      height: this.canvasSize.y,
      transparent: true,
      antialias: false,
      forceCanvas: false});
    this.graphics = new PIXI.Graphics()
    this.graphics.beginFill(0x000000);
    this.graphics.drawRect(20,20,3,1);
    this.graphics.endFill();

    let testSprite = PIXI.Sprite.from("test.png");

    this.bufferTexture = PIXI.RenderTexture.create({width: this.canvasSize.x, height: this.canvasSize.y});
    this.renderTexture = PIXI.RenderTexture.create({width: this.canvasSize.x, height: this.canvasSize.y});
    this.app.renderer.render(this.graphics, this.renderTexture);

    this.bufferSprite = new PIXI.Sprite(this.bufferTexture);
    this.renderSprite = new PIXI.Sprite(this.renderTexture);

    this.container = new PIXI.Container();

    this.app.stage.addChild(this.renderSprite);
    this.app.stage.addChild(this.container);
    this.container.addChild(this.bufferSprite)
    this.container.addChild(testSprite);
    this.container.addChild(this.graphics);

    // keybindings
    window.addEventListener('keydown', e => {
      if (e.code == "Space") {
        this.changeState(STATE.panning);
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code == "Space") {
        this.changeState(this.settings.tool);
      }
    });

    window.addEventListener('wheel', e => {

    });
  }

  makeStroke(x, y) {
    this.strokeCount++;
    const radius = this.settings.brushSize/2;
    if (radius >= 1) {
      this.graphics.drawCircle(x, y, radius);
    // for radius under 1 just round up to a single pixel rectangle
    } else if (radius > 0) {
      this.graphics.drawRect(x, y, 1, 1);
    }
  }

  changeState(newState) {
    if (newState == this.settings.state) return;


    console.trace("STATE CHANGED FROM", this.settings.state, "TO", newState)
    if (this.settings.state) {
      document.body.style.cursor = "auto";
    }

    if (newState == STATE.panning) {
      document.body.style.cursor = "grab";
    }


    this.settings.state = newState;
  }

  handleMouseMove(e) {
    let canvas = this.canvasRef.current;
    let canvasX = parseInt(canvas.style.left.replace("px",""));
    let canvasY = parseInt(canvas.style.top.replace("px",""));

    // calculate stroke point relative to canvas
    let relX = e.pageX - canvasX;
    let relY = e.pageY - canvasY;

    // keep track of previous position (when LMB is held, clear when lifted)
    const [x,y] = this.previousPosition;
    if (e.buttons & 1) this.previousPosition = [relX, relY];
    else this.previousPosition = [undefined, undefined];

    switch(this.settings.state) {
      case STATE.brush:
        brush.bind(this)(false);
        break;
      case STATE.eraser:
        brush.bind(this)(true);
        break;
      case STATE.panning:
        panning.bind(this)();
        break;
      default:
        this.changeState(this.settings.tool);
    }

    function brush(eraseMode) {
      // stroke optimization using renderTexturer
      if (this.strokeCount > 1500) {
        this.strokeCount = 0;
        // render container (bufferSprite + strokes) to renderSprite
        this.app.renderer.render(this.container, this.renderTexture);
        // render renderSprite back on to bufferSprite so that it will be included for next time
        this.app.renderer.render(this.renderSprite, this.bufferTexture);
        // clear original strokes to save memory
        this.graphics.clear();

        this.settings.color = randomColor();
      }

      // check if LMB is down (bitwise flag in MouseEvent.buttons)
      if (e.buttons & 1) {
        if (!eraseMode) this.graphics.beginFill(this.settings.color)
        else this.graphics.beginFill(0xffffff);

        this.makeStroke(relX, relY);

        // use previous position to linearly interpolate stroke so that there aren't breaks in the line if the cursor moves too quickly
        s: if (x!=null && y!=null) {
          let distance = Math.sqrt((relX - x)**2 + (relY - y)**2); // calculate distance from previous and current mouse point
          distance = Math.round(distance);
          if (distance <= 0) break s; // dont do anything if mouse hasnt moved at least 1 pixel

          let nX = (relX-x)/distance, nY = (relY-y)/distance; // normalize direction from old to new point

          // make a stroke for every pixel along the distance between the current and previous points
          for (let i = 0; i <= distance; i++) {
            this.makeStroke(x + nX*i, y + nY*i);
          }
        }
        // update previousposition ( )
        this.previousPosition = [relX, relY];
        this.graphics.endFill();
      } else {
        this.previousPosition = [undefined, undefined];
      }
    }

    function panning() {
      if (e.buttons & 1) {
        if (x!=null && y!=null) {
          console.log("before", canvasX);
          canvasX += e.movementX//relX - x;
          console.log("after", canvasX)
          canvasY += e.movementY//relY - y;
        }
        document.body.style.cursor = "grabbing";
      } else {
        document.body.style.cursor = "grab";
      }


      // stop panning if space isnt being held
      if (!this.keys.Space) {
        console.log("STOP PANNING");
        this.changeState(this.settings.tool);
      }

      console.log("panning!");
    }

    canvas.style.left = canvasX + "px";
    canvas.style.top = canvasY + "px";
  }
}

export default GameCanvas;