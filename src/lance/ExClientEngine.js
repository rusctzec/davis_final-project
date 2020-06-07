import { ClientEngine, KeyboardControls } from "lance-gg";
import ExRenderer from "./ExRenderer";

export default class ExClientEngine extends ClientEngine {
  constructor(gameEngine, options) {
    super(gameEngine, options, ExRenderer);

    this.controls = new KeyboardControls(this);
    this.controls.bindKey("up", "up", { repeat: true });
    this.controls.bindKey("down", "down", { repeat: true });
  }

  start(pixiApp, canvasSize) {
    if (pixiApp) {
      this.renderer.app = pixiApp;
      this.renderer.stage = pixiApp.stage;
    }
    if (canvasSize) {
      this.gameEngine.worldWidth = canvasSize.x;
      this.gameEngine.worldHeight = canvasSize.y;
    }


    super.start();
    console.log("ClientEngine started");

  }

  connect() {
    return super.connect().then(() => {
      this.socket.on("canvasUpdate", update => {this.receiveCanvasUpdate(update)});
    });
  }

  // These canvas updates are used to sync the canvas state between clients using
  // 1. The x and y position of the update
  // 2. A two-dimensional array describing the affected pixels relative to that position
  sendCanvasUpdate(update) {
    console.log("Sent", update);
    this.socket.emit("canvasUpdate", update);
  }

  receiveCanvasUpdate(update) {
    let PIXI = this.renderer.PIXI
    console.log("Received", update);

    // fill by 2d array
    if (update.data) {
      let {data, x, y} = update;
      let lenX = data.length; if (lenX === 0) return;
      let lenY = data[0].length;
      this.canvas.inboundGraphics.beginFill(this.canvas.settings.color);
      for (let i=0; i<lenX && i+x < this.gameEngine.worldWidth; i++) {
        for (let j=0; j<lenY && j+y < this.gameEngine.worldHeight; j++) {
          let val = data[i][j];
          if (val === 0 || i < 0 || j < 0) continue;
          let fillColor = val === -1 ? 0xffffff : this.canvas.settings.color;
          let fill = val === -1 ? 0 : 1;
          // set tilemap right from here to avoid making the same loop again
          this.gameEngine.tileMap[i+x][j+y] = fill;

          if (fillColor != this.canvas.inboundGraphics.fill.color || this.canvas.inboundGraphics.strokeCount > 1500) {
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
      let fillColor = update.fill === -1 ? 0xffffff : this.canvas.settings.color;
      this.gameEngine.updateTileMap(update);
      // if color changed or stroke limit exceeded
      if (fillColor != this.canvas.inboundGraphics.fill.color || this.canvas.inboundGraphics.strokeCount > 1500) {
        this.canvas.renderToTexture();
      }
      this.canvas.inboundGraphics.beginFill(fillColor);
      this.canvas.inboundGraphics.drawRect(update.x, update.y, update.size, update.size);
    }
  }
}
