import React from 'react';
import * as PIXI from 'pixi.js';
import './style.css';
import {InputProvider, InputContext} from '../../utils/InputStore';
import Overlay from '../Overlay';
import ToolBox from '../ToolBox';
import GameMenu from '../GameMenu';
import CornerWatermark from '../CornerWatermark';
import clientEngine from '../../lance';

window.PIXI = PIXI; // for testing purposes;

// tools enum
const TOOLS = Object.freeze({"brush":0, "eraser": 1, "panning": 2, "cannon":3});

class GameCanvas extends React.Component {

  static contextType = InputContext

  constructor(props) {
    super(props);
    // this.state contains per-client and current room settings | clientEngine.settings contains settings for each room on the server
    this.state = {
      brushSize: 2,
      color: 0x000000,
      eraserSize: 7,
      gameMode: false,
      tool: TOOLS.brush,
      active: TOOLS.brush,
      room: "/lobby",
      ready: false,
      overlay: "connecting",
      overlayText: "Connecting...",
      // controlled by room:
      width: 50,
      height: 50,
      roomSettings: {},
      playerList: [],
      menuFocused: false,
    };

    this.canvasRef = React.createRef();
    this.strokeCount = 0;
    this.scale = 1.0;
    // to keep track of previous stroke location for calculations
    this.previousPosition = [undefined, undefined];
    this.previousPagePosition = [undefined, undefined];

  }

  get drawingDisabled() {
    let username = this.props.auth.user.username;
    let settings = this.state.roomSettings;

    return (settings.restrictDrawing &&
      !settings.drawers.includes(username) &&
      !settings.admins.includes(username) &&
      settings.owner != username);
  }

  render() {
    return (
      <InputProvider>
        <GameMenu auth={this.props.auth} settings={clientEngine.settings} roomSettings={this.state.roomSettings} state={this.state} onSubmit={update => clientEngine.sendSettingsUpdate(update)}
        onFocus={() => {clientEngine.controls.boundKeys = {}; this.setState({...this.state, menuFocused: true})}}
        onBlur={() => {if(this.state.gameMode) {clientEngine.controls.boundKeys = clientEngine.boundKeys;} this.setState({...this.state, menuFocused: false});}}
        />
        <canvas ref={this.canvasRef} width={this.state.width} height={this.state.height}/>
        <ToolBox
          state={this.state}
          tools={TOOLS}
          auth={this.props.auth}
          drawingDisabled={this.drawingDisabled}
          dispatch={(newTool) => this.changeActive(newTool, true)}
          onChange={newState => this.setState({...this.state, ...newState})}
          toggleGameMode={(val) => this.toggleGameMode(val)}
        />
        <Overlay visible={!this.state.ready} buttons={this.state.overlay != "connecting"} text={this.state.overlayText}/>
        {
            this.props.auth.user.username ? <CornerWatermark corner="bottomright">Logged in as {this.props.auth.user.username}</CornerWatermark> : <CornerWatermark corner="bottomright">Not logged in</CornerWatermark>
        }
      </InputProvider>
    );
  }

  canvasZoom(factor, scalePoint, direct) {
    let canvas = this.canvasRef.current;
    if (this.state.gameMode) {
      canvas.scale = factor; return;
    }
    let point = scalePoint || {x: (canvas.targetScale*this.state.width)/2, y: (canvas.targetScale*this.state.height)/2}
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
    if (direct) {
      canvas._x = canvas.targetX;
      canvas._y = canvas.targetY;
    }
  }

  componentDidMount() {
    console.log("PROPS", this.props);
    // disable user scaling on mobile for this page
    document.querySelector("meta[name=viewport]").setAttribute("content", "width=device-width, initial-scale=1, user-scalable=0");
    document.body.style.overflow = "hidden";
    window.gameCanvas = this // testing
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

    this.keys = this.context.current.keys;
    this.app = new PIXI.Application({
      view: this.canvasRef.current,
      width: 1000,//this.state.width,
      height: 1000,//this.state.height,
      transparent: true,
      antialias: false,
      forceCanvas: false});
    this.graphics = new PIXI.Graphics() // main graphics object that gets drawn to by the user
    this.inboundGraphics = new PIXI.Graphics() // secondary graphics object for drawing strokes coming in over the network
    this.inboundGraphics.strokeCount = 0;

    // - if a graphics object gets drawn to too much it eventually stops working entirely
    // so set up a rendertexture which will store the visual state of things in the long term
    // every 1500 strokes or so the graphics object should be rendered on to the rendertexture and then cleared to keep things working
    this.bufferTexture = PIXI.RenderTexture.create({width: this.state.width, height: this.state.height});
    this.renderTexture = PIXI.RenderTexture.create({width: this.state.width, height: this.state.height});
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
      if (e.repeat) return;
      if (this.state.menuFocused) return;

      if (e.code === "Space") {
        this.changeActive(TOOLS.panning);
      }
      // swapping tools (clears graphics object and renders to texture every time color needs to change otherwise it doesn't work right)
      else if (e.code === "KeyE") {
        if (this.drawingDisabled) return;
        let newTool = (this.state.tool === TOOLS.eraser ? TOOLS.brush : TOOLS.eraser);
        this.changeActive(newTool, true);
      }
      else if (e.code === "KeyB") {
        if (this.drawingDisabled) return;
        this.changeActive(TOOLS.brush, true);
      }
      else if (e.code == "KeyG") {
        this.toggleGameMode();
      }
      else if (e.code == "KeyC") {
        if (this.state.roomSettings.disableProjectiles) {return;}
        this.changeActive(TOOLS.cannon, true);
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
    window.addEventListener('touchstart', e => {this.handleMouseMove(e)});
    window.addEventListener('touchmove', e => {this.handleMouseMove(e)});
    window.addEventListener('touchend', e => {this.previousDistance = undefined; this.previousPosition = [undefined, undefined]});

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

  setOverlayMessage(type, msg, cb) {
    if (this.state.overlay == "error" && type == "disconnected") { return; }
    this.setState({...this.state, ready: false, overlay: type, overlayText: msg}, cb);
  }

  componentWillUnmount() {
    // lance doesn't provide the ability to destroy or restart the gameengine, so it's neccesary to perform a full page refresh to create a clean slate
    clientEngine.disconnect();
    window.location.reload();
  }

  resizeRenderer(settings, clear=false) {
    //this.app.renderer.resize(settings.worldWidth, settings.worldHeight);
    let newRenderTexture = PIXI.RenderTexture.create({width: settings.worldWidth, height: settings.worldHeight});
    let newBufferTexture = PIXI.RenderTexture.create({width: settings.worldWidth, height: settings.worldHeight});

    this.app.renderer.render(this.container, newRenderTexture);

    this.graphics.clear();
    this.inboundGraphics.clear();
    this.renderTexture.destroy(true);
    this.bufferTexture.destroy(true);

    this.renderTexture = newRenderTexture;
    this.bufferTexture = newBufferTexture;
    this.renderSprite.texture = this.renderTexture;
    this.bufferSprite.texture = this.bufferTexture;

    this.app.renderer.render(this.renderSprite, this.bufferTexture);
  }

  receiveSettingsUpdate(update) {
    let settings = update[this.state.room];
    if (!settings) return;
    console.log("GameCanvas receiveSettingsUpdate", this.state.room, settings, update);
    let dimensionsChanged = false;
    if (settings.worldWidth !== this.state.width || settings.worldHeight !== this.state.height) {
      this.resizeRenderer(settings);
      dimensionsChanged = true;
      console.log("DIMENSIONS CHANGED - ", this.state.room, "CANVAS RESET");
    }

    // where applicable, convert array to csv-string for menu
    let preRoomSettings = Object.assign({}, settings);
    ["allow", "exclude", "admins", "drawers"]
    .forEach(field => {
      preRoomSettings[field] = preRoomSettings[field].join(", ");
    });
    this.setState({
      ...this.state,
      width: settings.worldWidth,
      height: settings.worldHeight,
      roomSettings: {...this.state.roomSettings, ...preRoomSettings}
    }, () => {
      if (dimensionsChanged) this.resetView();
    });
  }

  roomUpdate(update) {
    this.setState({...this.state, room: update.to, ready: true}, () => {
      this.graphics.clear();
      this.inboundGraphics.clear();
      this.renderTexture.baseTexture.dispose();
      this.bufferTexture.baseTexture.dispose();
      this.receiveSettingsUpdate(clientEngine.settings);
      this.resetView();
      console.log("ROOM UPDATED - ", this.state.room, "CANVAS RESET");
    });
  }

  toggleGameMode(value) {
    if (!clientEngine.socket) return // dont allow game mode until socket is ready
    let newValue =  (value == null ? !this.state.gameMode : value);
    if (newValue === this.state.gameMode) return false;
    if (newValue) {this.canvasRef.current.scale = 7; clientEngine.socket.emit('requestCreation'); this.changeActive(TOOLS.cannon, true);
    clientEngine.controls.boundKeys = clientEngine.boundKeys
    }
    else {this.resetView(); clientEngine.socket.emit('requestDeath'); if (this.state.active === TOOLS.cannon) this.changeActive(TOOLS.panning, true); clientEngine.controls.boundKeys = {}}
    this.setState({...this.state, gameMode: newValue});
    return true;
  }

  resetView() {
    let canvas = this.canvasRef.current;


    // fit canvas scale to screen size
    let initialScale = Math.min(window.innerWidth/this.state.width, window.innerHeight/this.state.height);
    initialScale *= 0.9;
    canvas.scale = initialScale;

    // center canvas on screen, providing initial values
    canvas.x = window.innerWidth/2 - (this.state.width*canvas.targetScale)/2;
    canvas.y = window.innerHeight/2 - (this.state.height*canvas.targetScale)/2;

  }
  // handle user's brush strokes
  makeStroke(x, y) {
    if (this.state.room === "/lobby") return; // dont allow drawing until a room other than lobby has been assigned
    if (this.drawingDisabled) return; // can't draw if drawing is disabled

    this.strokeCount++;
    const size = (this.state.tool === TOOLS.eraser) ? this.state.eraserSize : this.state.brushSize;
    (this.state.tool === TOOLS.eraser) ? this.graphics.beginFill(0xffffff) : this.graphics.beginFill(this.state.color);
    x = Math.round(x - size/2);
    y = Math.round(y - size/2);
    this.graphics.drawRect(x, y, size, size);
    clientEngine.sendCanvasUpdate({x, y, roomName: this.state.room, size: size, fill: (this.state.tool === TOOLS.eraser ? -1 : 1)});
  }

  // changing the active tool (this.state.tool stores the set tool, however this.state.active is the one currently in use, these can differ when holding space to use the pan tool temporarily) (the `deep` paramater changes both state.tool & state.active)
  // handle any side effects of state changes like updating the mouse cursor
  // also handles any side effects of state changes like updating the mouse cursor
  changeActive(newTool, deep=false) {
    if (newTool === this.state.active) return;

    if (this.state.active) {
      document.documentElement.style.cursor = "auto";
    }

    if (newTool === TOOLS.panning) {
      document.documentElement.style.cursor = "grab";
    } else if (newTool === TOOLS.brush) {
      this.renderToTexture();
    } else if (newTool === TOOLS.eraser) {
      this.renderToTexture();
    }


    this.setState({...this.state, active: newTool, tool: deep?newTool:this.state.tool})
  }

  playerListUpdate(action, player) {
    if (action == "joined") {
      let newPlayerList = [...this.state.playerList];
      if (!newPlayerList.every(v => v.playerId != player.playerId && (!v.username || v.username != player.username))) {return;}
      newPlayerList.push(player);
      this.setState({...this.state, playerList: newPlayerList})
    } else if (action == "left") {
      let newPlayerList = this.state.playerList.filter(v => v.playerId != player.playerId);
      this.setState({...this.state, playerList: newPlayerList});
    }
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

  // main handler for cursor/touch based interaction with canvas
  handleMouseMove(e) {
    let canvas = this.canvasRef.current;
    if (!canvas) return;
    let canvasX = canvas.x;
    let canvasY = canvas.y;
    let touch = false;
    if (e.type.includes("touch")) touch = true;

    let pageX = touch ? e.touches[0].pageX : e.pageX;
    let pageY = touch ? e.touches[0].pageY : e.pageY;
    let pageX2 = touch && e.touches.length >= 2 ? e.touches[1].pageX : undefined;
    let pageY2 = touch && e.touches.length >= 2 ? e.touches[1].pageY : undefined;

    // calculate stroke point relative to canvas
    let relX = (pageX - canvasX) / canvas.scale;
    let relY = (pageY - canvasY) / canvas.scale;

    let relX2, relY2;
    if (touch && e.touches.length >= 2)  {
      relX2 = (e.touches[1].pageX - canvasX) / canvas.scale;
      relY2 = (e.touches[1].pageY - canvasY) / canvas.scale;
    }

    const [x,y] = this.previousPosition;
    if (e.buttons & 1 || touch) this.previousPosition = [relX, relY];
    else this.previousPosition = [undefined, undefined];

    const [prevPageX, prevPageY] = this.previousPagePosition;
    if (e.buttons & 1 || touch) this.previousPagePosition = [pageX, pageY];
    else this.previousPagePosition = [undefined, undefined];
    if (touch && e.touches.length === 2) panning.bind(this)();
    else switch(this.state.active) {
      case TOOLS.brush:
        brush.bind(this)(false);
        break;
      case TOOLS.eraser:
        brush.bind(this)(true);
        break;
      case TOOLS.panning:
        panning.bind(this)();
        break;
      case TOOLS.cannon:
        cannon.bind(this)();
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
      if (e.buttons & 1 || e.type === "click" || touch) {
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

      if (e.buttons & 1 || touch) {
        if (x!=null && y!=null) {
          canvasX += pageX - prevPageX;
          canvasY += pageY - prevPageY;
          canvas.x = canvas._x = canvasX;
          canvas.y = canvas._y = canvasY;
        }
        if (touch) {
          let midpoint = {x: (relX + relX2)/2, y: (relY + relY2)/2 };
          let distance = Math.vectorDistance({x: pageX, y: pageY }, {x: pageX2, y: pageY2});
          if (this.previousDistance != null) {
            let diff = distance - this.previousDistance;
            let scale = canvas.targetScale + diff*0.01;
            this.canvasZoom(scale, midpoint, true)
          }
          this.previousDistance = distance;
          return;
        }
        document.documentElement.style.cursor = "grabbing";
      } else {
        document.documentElement.style.cursor = "grab";
      }

      // stop temporary panning if space isnt being held
      if (!this.keys.Space) {
        this.changeActive(this.state.tool);
      }

    }

    function cannon() {
      if (e.type === "click" && this.state.gameMode && clientEngine.gameEngine.player) {
        console.log("CANNON");
        clientEngine.sendInput("fire", {eventPosition: {x: relX, y: relY}});
      }
    }

  }
}

export default GameCanvas;