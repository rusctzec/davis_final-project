import { ClientEngine, KeyboardControls } from "lance-gg";
import { PNG } from 'pngjs'
import TileMap from '../common/TileMap';
import ExRenderer from "./ExRenderer";

export default class ExClientEngine extends ClientEngine {
  constructor(gameEngine, options) {
    super(gameEngine, options, ExRenderer);


    this.controls = new KeyboardControls(this);
    this.controls.bindKey("up", "up", { repeat: true });
    this.controls.bindKey("down", "down", { repeat: true });
    this.controls.bindKey("left", "left", { repeat: true });
    this.controls.bindKey("right", "right", { repeat: true });
    this.controls.bindKey("w", "up", { repeat: true });
    this.controls.bindKey("s", "down", { repeat: true });
    this.controls.bindKey("a", "left", { repeat: true });
    this.controls.bindKey("d", "right", { repeat: true });
    this.boundKeys = this.controls.boundKeys;
    this.controls.boundKeys = {};
  }

  start(pixiApp, canvas, gameCanvas) {
      this.renderer.app = pixiApp;
      this.renderer.stage = pixiApp.stage;
      this.renderer.canvas = canvas;
      this.renderer.gameCanvas = gameCanvas;
      this.gameCanvas = gameCanvas;

      this.settings = {} // world settings for each room dictionary

      this.gameEngine.clientEngine = this;
      this.gameEngine.settings = this.settings
      this.gameEngine.worldWidth = canvas.width;
      this.gameEngine.worldHeight = canvas.height;


      Object.defineProperty(this, "gameMode", {
        set: function(val) {this.gameCanvas.toggleGameMode(val);},
        get: function() {return this.gameCanvas.state.gameMode}
      });

    super.start();
    console.log("ClientEngine started");

  }

  connect(options) {
    return super.connect(options).then(() => {
      this.socket.on("canvasUpdate", update => {

        // preprocess png info
        if (update.type == "png") {
          new PNG({filterType: 4}).parse(update.data, (error, data) => {
            if (!error) {
              let arrayData = TileMap.decodePng(data);
              update.data = arrayData;
              update.type = "array";
              this.receiveCanvasUpdate(update);
            }
          });
        } else {
          this.receiveCanvasUpdate(update);
        }
      });
      this.socket.on("settingsUpdate", update => {
        console.log(update);
        this.receiveSettingsUpdate(update);
      });

      this.socket.on("clientError", msg => {
        this.gameCanvas.setOverlayMessage("error", msg, () => { this.socket.disconnect(); });
      });

      this.socket.on("disconnect", w => {
        this.gameCanvas.setOverlayMessage("disconnected", "Disconnected");
      });

      this.socket.on("playerEnteredRoom", p => {
        this.gameCanvas.playerListUpdate("joined", p);
      });

      this.socket.on("playerExitedRoom", p => {
        this.gameCanvas.playerListUpdate("left", p);
      });

      let wantsPrivateRoom = this.gameCanvas.props.location.search.includes("private=true");

      this.socket.emit("requestRoom", {roomName: `/${this.gameCanvas.props.match.params.roomName}`, 'private': wantsPrivateRoom});
    });
  }

  sendSettingsUpdate(form) {
    if (!this.socket) return;
    // update given to this function should pertain to 1 room only

    let update = Object.assign({}, form);
    // perform the conversion from csv-string to array of usernames, for applicable settings
    ["allow", "exclude", "admins", "drawers"]
    .forEach(field => {
      let value = update[field].replace(/\s/g, '').split(',');
      value.length > 0 ? update[field] = value : update[field] = [];
    });

    console.log("sendSettingsUpdate", update);
    this.socket.emit("settingsUpdate", update);
  }

  receiveSettingsUpdate(update) {
    let roomName = this.gameCanvas.state.room;
    console.log("receiveSettingsUpdate", update, roomName, update[roomName]);
    // if update has settings for your room, and the dimensions are different than your current dimensions OR you don't have any settings yet at all, regenerate your room's tilemap to the new dimensions
    if (update[roomName]) {
      if (!this.settings[roomName] || (this.settings[roomName] && (this.settings[roomName].worldWidth !== update[roomName].worldWidth || this.settings[roomName].worldHeight !== update[roomName].worldHeight))) {
        console.log("SETTINGS UPDATE - DIMENSIONS CHANGED");
        this.gameEngine.tileMaps[roomName] = new TileMap(update[roomName].worldWidth, update[roomName].worldHeight, {type: "array", data: this.gameEngine.tileMaps[roomName]})

        this.receiveCanvasUpdate({x: 0, y:0, roomName: roomName, data: this.gameEngine.tileMaps[roomName]});
      }
    }

    this.settings = {...this.settings, ...update};

    this.gameEngine.settings = this.settings;
    // register neccesary updates to the canvas etc. if your room settings update
    this.gameCanvas.receiveSettingsUpdate(this.settings);
  }

  roomUpdate(update) {
    console.log("received roomUpdate", update);
    // generate tilemap for the room
    let roomName = update.to;
    if (this.settings[roomName]) {
      this.gameEngine.tileMaps[roomName] = new TileMap(this.settings[roomName].worldWidth, this.settings[roomName].worldHeight);
    }

    this.gameCanvas.roomUpdate(update);
  }

  // These canvas updates are used to sync the canvas state between clients using
  // 1. The x and y position of the update
  // 2. A two-dimensional array describing the affected pixels relative to that position
  sendCanvasUpdate(update) {
    if (!this.socket) return; // ignore strokes until socket is ready
    this.gameEngine.updateTileMap(update);
    this.socket.emit("canvasUpdate", update);
  }

  receiveCanvasUpdate(update) {

    // fill by 2d array
    this.renderer.handleStroke(update);
    if (update.data) {
      console.log("Received canvasUpdate", update);
      let {data, x, y} = update;
      let lenX = data.length; if (lenX === 0) return;
      let lenY = data[0].length;
      let tileMap = this.gameEngine.tileMaps[update.roomName];
      if (!tileMap || !tileMap[0]) return;
      console.log("tileMap", tileMap.length, tileMap[0].length);
      this.canvas.inboundGraphics.beginFill(this.canvas.state.color);
      for (let i=0; i<lenX && i+x < this.gameEngine.worldWidth; i++) {
        for (let j=0; j<lenY && j+y < this.gameEngine.worldHeight; j++) {
          let val = data[i][j];
          if (val === 0 || i < 0 || j < 0) continue;
          let fillColor = val === -1 ? 0xffffff : this.canvas.state.color;
          let fill = val === -1 ? 0 : 1;
          // set tilemap right from here to avoid making the same loop again
          tileMap.set(i+x, j+y, fill);

          if (fillColor !== this.canvas.inboundGraphics.fill.color || this.canvas.inboundGraphics.strokeCount > 1500) {
            this.canvas.renderToTexture();
            this.canvas.inboundGraphics.beginFill(fillColor);
          }
          this.canvas.inboundGraphics.drawRect(i+x, j+y, 1, 1);
          this.canvas.inboundGraphics.strokeCount++;
        }
      }
    }
    // fill by stroke rect
    else {
      this.canvas.inboundGraphics.strokeCount++;
      let fillColor = update.fill === -1 ? 0xffffff : this.canvas.state.color;
      this.gameEngine.updateTileMap(update);
      // if color changed or stroke limit exceeded
      if (fillColor !== this.canvas.inboundGraphics.fill.color || this.canvas.inboundGraphics.strokeCount > 1500) {
        this.canvas.renderToTexture();
      }
      this.canvas.inboundGraphics.beginFill(fillColor);
      this.canvas.inboundGraphics.drawRect(update.x, update.y, update.size, update.size);
    }
  }
}
