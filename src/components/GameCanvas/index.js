import React from 'react';
import * as PIXI from 'pixi.js';
import './style.css';
import {InputContext} from '../../utils/InputStore';
import ToolBox from '../ToolBox';
import clientEngine from '../../lance';

window.PIXI = PIXI; // for testing purposes;

// tools enum
const TOOLS = Object.freeze({"brush":0, "eraser": 1, "panning": 2});

class GameCanvas extends React.Component {

  static contextType = InputContext

  constructor(props) {
    super(props);
    this.state = {
      brushSize: 2,
      color: 0x000000,
      eraserSize: 7,
      gameMode: false,
      tool: TOOLS.brush,
      active: TOOLS.brush,
    };

    this.canvasRef = React.createRef();
    this.strokeCount = 0;
    this.canvasSize = {x: 500, y: 500};
    this.scale = 1.0;
    // to keep track of previous stroke location for calculations
    this.previousPosition = [undefined, undefined];
    this.previousPagePosition = [undefined, undefined];

  }

  render() {
    return (
      <div>
        <canvas ref={this.canvasRef} width={this.canvasSize.x} height={this.canvasSize.y} />
        <ToolBox
          state={this.state}
          tools={TOOLS}
          dispatch={(newTool) => this.changeActive(newTool, true)}
          onChange={newState => this.setState({...this.state, ...newState})}
          toggleGameMode={(val) => this.toggleGameMode(val)}
        />
      </div>
    );
  }

  canvasZoom(factor, scalePoint) {
    let canvas = this.canvasRef.current;
    if (this.state.gameMode) {
      canvas.scale = factor; return;
    }
    let point = scalePoint || {x: (canvas.targetScale*this.canvasSize.x)/2, y: (canvas.targetScale*this.canvasSize.y)/2}
    if (clientEngine.gameMode && clientEngine.gameEngine.player) {console.log(factor); canvas.scale = factor; return;};

    let previousScale = canvas.targetScale;
    let newScale = factor;

    newScale = Math.min(Math.max(newScale, 0.1),10);
    let scaleChange = newScale-previousScale;

    let canvasX = canvas.targetX;
    let canvasY = canvas.targetY;

    canvasX += (scaleChange*point.x * -1);
    canvasY += (scaleChange*point.y * -1);

    canvas.scale = newScale;
    canvas.x = canvasX;
    canvas.y = canvasY;
  }

  componentDidMount() {
    let canvas = this.canvasRef.current;
    // setup shorthand for manipulating canvas css position/scale (real value, target value, property that sets target value but returns real value)
    Object.defineProperties(canvas, {
      _x: {
        set: function(val) { this.style.left = val+"px"; },
        get: function() { return parseInt(this.style.left.replace("px","")); }
      },
      _y: {
        set: function(val) { this.style.top = val+"px"; },
        get: function() { return parseInt(this.style.top.replace("px","")); }
      },
      _scale: {
        set: function(val) {this.style.width = this.width * val + "px"; this.style.height = this.height * val + "px" },
        get: function() { return parseInt(this.style.width.replace("px","")) / this.width }
      },
      x: {
        set: function(val) { this.targetX = val; },
        get: function() { return this._x }
      },
      y: {
        set: function(val) { this.targetY = val },
        get: function() { return this._y }
      },
      scale: {
        set: function(val) { this.targetScale = val },
        get: function() { return this._scale }
      },
      targetX: {value: 0, writable:true}, targetY: {value: 0, writable:true}, targetScale: {value: 1, writable:true}
    });
    canvas._x = canvas.targetX; canvas._y = canvas.targetY; canvas._scale = canvas.targetScale;

    // center canvas
    this.resetView();

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

    clientEngine.canvas = this;
    clientEngine.start(this.app, canvas, this); // start the game engine (and pass a reference to the pixi application and canvas)

    // keybindings
    window.addEventListener('keydown', e => {
      if (e.code === "Space") {
        this.changeActive(TOOLS.panning);
      }
      else if (e.code == "KeyA") {
        this.resetView();
      }
      // swapping tools (clears graphics object and renders to texture every time color needs to change otherwise it doesn't work right)
      else if (e.code === "KeyE") {
        this.renderToTexture();
        let newTool = (this.state.tool === TOOLS.eraser ? TOOLS.brush : TOOLS.eraser);
        this.changeActive(newTool, true);
      }
      else if (e.code === "KeyB") {
        this.renderToTexture();
        this.changeActive(TOOLS.brush, true);
      }
      else if (e.code == "KeyG") {
        this.toggleGameMode();
      }
      // changing brush or eraser size using number keys
      else if (/(Numpad|Digit)\d/.test(e.code)) {
        let size = parseInt(e.code.match(/\d/)[0]);
        if (size === 0) size = 10;
        if (this.state.tool === TOOLS.brush) this.setState({...this.state, brushSize: size});
        else if (this.state.tool === TOOLS.eraser) this.setState({...this.state, eraserSize: size});
        console.log(this.state.brushSize, this.state.eraserSize);
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === "Space") {
        this.changeActive(this.state.tool);
      }
    });

    window.addEventListener('wheel', e => {
      let relX = (e.pageX - canvas.x) / canvas.scale;
      let relY = (e.pageY - canvas.y) / canvas.scale;

      let currentScale = canvas.targetScale;
      let newScale = currentScale + 0.1*currentScale*(Math.sign(e.deltaY) * -1);
      this.canvasZoom(newScale, {x: relX, y: relY});
    });

    window.addEventListener('mousemove', this.handleMouseMove.bind(this));
    window.addEventListener('click', this.handleMouseMove.bind(this));

    window.addEventListener('mousedown', e => {
      if (this.state.active === TOOLS.panning) {
        document.documentElement.style.cursor = "grabbing";
      }
    });

    window.addEventListener('mouseup', e => {
      if (this.state.active === TOOLS.panning) {
        document.documentElement.style.cursor = "grab";
      }
    });
  }

  toggleGameMode(value) {
    let newValue =  (value == null ? !this.state.gameMode : value);
    if (newValue == this.state.gameMode) return false;
    if (newValue) {this.canvasRef.current.scale = 7; clientEngine.socket.emit('requestCreation'); }
    else {this.resetView(); clientEngine.socket.emit('requestDeath'); }
    this.setState({...this.state, gameMode: newValue});
    return true;
  }

  resetView() {
    let canvas = this.canvasRef.current;


    // fit canvas scale to screen size
    let initialScale = Math.min(window.innerWidth/this.canvasSize.x, window.innerHeight/this.canvasSize.y);
    initialScale *= 0.9;
    canvas.scale = initialScale;

    // center canvas on screen, providing initial values
    canvas.x = window.innerWidth/2 - (this.canvasSize.x*canvas.targetScale)/2;
    canvas.y = window.innerHeight/2 - (this.canvasSize.y*canvas.targetScale)/2;

  }
  // handle user's brush strokes
  makeStroke(x, y) {
    this.strokeCount++;
    const size = (this.state.tool === TOOLS.eraser) ? this.state.eraserSize : this.state.brushSize;
    (this.state.tool === TOOLS.eraser) ? this.graphics.beginFill(0xffffff) : this.graphics.beginFill(this.state.color);
    x = Math.round(x - size/2);
    y = Math.round(y - size/2);
    this.graphics.drawRect(x, y, size, size);
    clientEngine.sendCanvasUpdate({x, y, size: size, fill: (this.state.tool === TOOLS.eraser ? -1 : 1)});
  }

  // handle any side effects of state changes like updating the mouse cursor
  changeActive(newTool, deep=false) {
    if (newTool === this.state.active) return;

    console.trace("STATE CHANGED FROM", this.state.active, "TO", newTool)
    if (this.state.active) {
      document.documentElement.style.cursor = "auto";
    }

    if (newTool === TOOLS.panning) {
      document.documentElement.style.cursor = "grab";
    }


    this.setState({...this.state, active: newTool, tool: deep?newTool:this.state.tool})
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
    let canvasX = canvas.x;
    let canvasY = canvas.y;

    // calculate stroke point relative to canvas
    let relX = (e.pageX - canvasX) / canvas.scale;
    let relY = (e.pageY - canvasY) / canvas.scale;

    const [x,y] = this.previousPosition;
    if (e.buttons & 1) this.previousPosition = [relX, relY];
    else this.previousPosition = [undefined, undefined];

    const [prevPageX, prevPageY] = this.previousPagePosition;
    if (e.buttons & 1) this.previousPagePosition = [e.pageX, e.pageY];
    else this.previousPagePosition = [undefined, undefined];

    switch(this.state.active) {
      case TOOLS.brush:
        brush.bind(this)(false);
        break;
      case TOOLS.eraser:
        brush.bind(this)(true);
        break;
      case TOOLS.panning:
        panning.bind(this)();
        break;
      default:
        this.changeActive(this.state.tool);
    }

    function brush(eraseMode) {
      // stroke optimization using renderTexture

      if (this.strokeCount > 1500) {
        this.renderToTexture();
      }

        //this.state.color = randomColor();

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
          canvas.x = canvas._x = canvasX;
          canvas.y = canvas._y = canvasY;
        }
        document.documentElement.style.cursor = "grabbing";
      } else {
        document.documentElement.style.cursor = "grab";
      }


      // stop panning if space isnt being held

      if (!this.keys.Space) {
        console.log("STOP PANNING");
        this.changeActive(this.state.tool);
      }

    }

  }
}

export default GameCanvas;