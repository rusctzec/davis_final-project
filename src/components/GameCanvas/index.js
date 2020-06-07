import React from 'react';
import * as PIXI from 'pixi.js';
import './style.css';
import {InputContext} from '../../utils/InputStore';
import clientEngine from '../../lance';

window.PIXI = PIXI; // for testing purposes;

// tools enum
const TOOLS = Object.freeze({"brush":0, "eraser": 1});
const STATE = Object.freeze({"brush":0, "eraser": 1, "panning": 2});

function randomColor() {
  return (Math.floor(Math.random()*256)*(2**16) +
  Math.floor(Math.random()*256)*(2**8) +
  Math.floor(Math.random()*256));
}


class GameCanvas extends React.Component {

  static contextType = InputContext

  constructor(props) {
    console.log(clientEngine);
    super(props);
    this.canvasRef = React.createRef();
    this.strokeCount = 0;
    this.canvasSize = {x: 500, y: 500};
    this.scale = 1.0;
    this.settings = {
      brushSize: 3,
      color: 0x000000,
      eraserSize: 5,
      tool: TOOLS.brush,
      state: TOOLS.brush,
    };
    // to keep track of previous stroke location for calculations
    this.previousPosition = [undefined, undefined];
    this.previousPagePosition = [undefined, undefined];

  }

  render() {
    return (
      <div>
        <canvas ref={this.canvasRef}/>
      </div>
    );
  }

  canvasZoom(factor) {
    let canvas = this.canvasRef.current;

    let previousScale = this.scale;
    this.scale = factor;

    this.scale = Math.min(Math.max(this.scale, 0.1),10);
    let scaleChange = this.scale-previousScale;

    let canvasX = parseInt(canvas.style.left.replace("px",""));
    let canvasY = parseInt(canvas.style.top.replace("px",""));

    canvasX += (scaleChange*this.canvasSize.x/2 * -1);
    canvasY += (scaleChange*this.canvasSize.y/2 * -1);

    canvas.style.width = this.canvasSize.x * this.scale + "px";
    canvas.style.height = this.canvasSize.y * this.scale + "px";
    canvas.style.left = canvasX + "px";
    canvas.style.top = canvasY + "px";
  }

  componentDidMount() {
    // center canvas on screen
    this.canvasRef.current.style.top = `${window.innerHeight/2 - this.canvasSize.y/2}px`;
    this.canvasRef.current.style.left = `${window.innerWidth/2 - this.canvasSize.x/2}px`;

    // fit canvas scale to screen size
    let initialScale = Math.min(window.innerWidth/this.canvasSize.x, window.innerHeight/this.canvasSize.y);
    initialScale *= 0.9;
    this.canvasZoom(initialScale);


    this.keys = this.context.current.keys;
    this.app = new PIXI.Application({
      view: this.canvasRef.current,
      width: this.canvasSize.x,
      height: this.canvasSize.y,
      transparent: true,
      antialias: false,
      forceCanvas: false});
    this.graphics = new PIXI.Graphics() // main graphics object that gets drawn to by the user
    this.inboundGraphics = new PIXI.Graphics() // secondary graphics object for drawing strokes coming in over the network
    this.inboundGraphics.strokeCount = 0;
    clientEngine.canvas = this;
    clientEngine.start(this.app, this.canvasSize); // start the game engine (and pass a reference to the pixi application and world size info)

    // - if a graphics object gets drawn to too much it eventually stops working entirely
    // so set up a rendertexture which will store the visual state of things in the long term
    // every 1500 strokes or so the graphics object should be rendered on to the rendertexture and then cleared to keep things working
    this.bufferTexture = PIXI.RenderTexture.create({width: this.canvasSize.x, height: this.canvasSize.y});
    this.renderTexture = PIXI.RenderTexture.create({width: this.canvasSize.x, height: this.canvasSize.y});
    this.app.renderer.render(this.graphics, this.renderTexture);

    this.bufferSprite = new PIXI.Sprite(this.bufferTexture);
    this.renderSprite = new PIXI.Sprite(this.renderTexture);

    this.container = new PIXI.Container();

    this.app.stage.addChild(this.renderSprite);
    this.app.stage.addChild(this.container);
    this.container.addChild(this.bufferSprite)
    this.container.addChild(this.inboundGraphics);
    this.container.addChild(this.graphics);

    // keybindings
    window.addEventListener('keydown', e => {
      if (e.code === "Space") {
        this.changeState(STATE.panning);
      }
      // swapping tools (clears graphics object and renders to texture every time color needs to change otherwise it doesn't work right)
      else if (e.code === "KeyE") {
        this.renderToTexture();
        this.settings.tool = (this.settings.tool === TOOLS.brush ? TOOLS.eraser : TOOLS.brush);
        this.changeState(this.settings.tool);
      }
      else if (e.code === "KeyB") {
        this.renderToTexture();
        this.settings.tool = TOOLS.brush;
        this.changeState(this.settings.tool);
      }
      // changing brush or eraser size using number keys
      else if (/(Numpad|Digit)\d/.test(e.code)) {
        let size = parseInt(e.code.match(/\d/)[0]);
        if (size == 0) size = 10;
        if (this.settings.tool == TOOLS.brush) this.settings.brushSize = size;
        else if (this.settings.tool == TOOLS.eraser) this.settings.eraserSize = size;
        console.log(this.settings.brushSize, this.settings.eraserSize);
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === "Space") {
        this.changeState(this.settings.tool);
      }
    });

    window.addEventListener('wheel', e => {
      let newScale = this.scale + 0.1*this.scale*(e.deltaY * -0.01);
      this.canvasZoom(newScale);
    });

    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('click', this.handleMouseMove.bind(this));

    window.addEventListener('mousedown', e => {
      if (this.settings.state === STATE.panning) {
        document.documentElement.style.cursor = "grabbing";
      }
    });

    window.addEventListener('mouseup', e => {
      if (this.settings.state === STATE.panning) {
        document.documentElement.style.cursor = "grab";
      }
    });
  }

  // handle user's brush strokes
  makeStroke(x, y) {
    this.strokeCount++;
    const size = (this.settings.tool == TOOLS.eraser) ? this.settings.eraserSize : this.settings.brushSize;
    (this.settings.tool == TOOLS.eraser) ? this.graphics.beginFill(0xffffff) : this.graphics.beginFill(this.settings.color);
    x = Math.round(x - size/2);
    y = Math.round(y - size/2);
    this.graphics.drawRect(x, y, size, size);
    clientEngine.sendCanvasUpdate({x, y, size: size, fill: (this.settings.tool == TOOLS.eraser ? -1 : 1)});
  }

  // handle any side effects of state changes like updating the mouse cursor
  changeState(newState) {
    if (newState === this.settings.state) return;

    console.trace("STATE CHANGED FROM", this.settings.state, "TO", newState)
    if (this.settings.state) {
      document.documentElement.style.cursor = "auto";
    }

    if (newState === STATE.panning) {
      document.documentElement.style.cursor = "grab";
    }


    this.settings.state = newState;
  }

  // the function for rendering the graphics object to a rendertexture and then clearing it
  renderToTexture(override) { // (override allows an object to be temporarily inserted so that it gets captured in the render process)
    this.strokeCount = 0;
    this.inboundGraphics.strokeCount = 0;
    // render container (bufferSprite + strokes) to renderSprite
    if (override) this.container.addChild(override);
    this.app.renderer.render(this.container, this.renderTexture);
    if (override) this.container.removeChild(override);
    // render renderSprite back on to bufferSprite so that it will be included for next time
    this.app.renderer.render(this.renderSprite, this.bufferTexture);
    // clear original strokes
    this.graphics.clear();
    this.inboundGraphics.clear();
  }

  handleMouseMove(e) {
    let canvas = this.canvasRef.current;
    let canvasX = parseInt(canvas.style.left.replace("px",""));
    let canvasY = parseInt(canvas.style.top.replace("px",""));

    // calculate stroke point relative to canvas
    let relX = (e.pageX - canvasX) / this.scale;
    let relY = (e.pageY - canvasY) / this.scale;

    const [x,y] = this.previousPosition;
    if (e.buttons & 1) this.previousPosition = [relX, relY];
    else this.previousPosition = [undefined, undefined];

    const [prevPageX, prevPageY] = this.previousPagePosition;
    if (e.buttons & 1) this.previousPagePosition = [e.pageX, e.pageY];
    else this.previousPagePosition = [undefined, undefined];

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
      // stroke optimization using renderTexture

      if (this.strokeCount > 1500) {
        this.renderToTexture();
      }

        //this.settings.color = randomColor();

      // check if LMB is down (bitwise flag in MouseEvent.buttons)
      if (e.buttons & 1 || e.type === "click") {
        this.makeStroke(relX, relY);

        // use previous position to linearly interpolate stroke so that there aren't breaks in the line if the cursor moves too quickly
        if (x!=null && y!=null) {
          let distance = Math.sqrt((relX - x)**2 + (relY - y)**2); // calculate distance from previous and current mouse point
          distance = Math.ceil(distance);

          if (distance > 0) {
            let nX = (relX-x)/distance, nY = (relY-y)/distance; // normalize direction from old to new point

            // make a stroke for every pixel along the distance between the current and previous points
            for (let i = 0; i <= distance; i++) {
              this.makeStroke(x + nX*i, y + nY*i);
            }
          }
        }
        // update previousposition
        this.previousPosition = [relX, relY];
      } else {
        this.previousPosition = [undefined, undefined];
      }
    }

    function panning() {

      if (e.buttons & 1) {
        if (x!=null && y!=null) {
          console.log("before", canvasX, e.pageX, prevPageX);
          canvasX += e.pageX - prevPageX;
          console.log("after", canvasX)
          canvasY += e.pageY - prevPageY;
        }
        document.documentElement.style.cursor = "grabbing";
      } else {
        document.documentElement.style.cursor = "grab";
      }


      // stop panning if space isnt being held

      if (!this.keys.Space) {
        console.log("STOP PANNING");
        this.changeState(this.settings.tool);
      }

    }

    canvas.style.left = canvasX + "px";
    canvas.style.top = canvasY + "px";
  }
}

export default GameCanvas;