import { Renderer } from 'lance-gg';
import * as PIXI from 'pixi.js';

export default class ExRenderer extends Renderer {
  constructor(gameEngine, clientEngine) {
    super(gameEngine, clientEngine);
    this.sprites = {} // dictionary of PIXI elements by lance objId
    this.container = new PIXI.Container();
    this.container.zIndex = 5;
    this.PIXI = PIXI;
  }

  init() {
    console.log("Renderer started");
    this.stage.addChild(this.container);

    return super.init();
  }

  draw(t, dt) {
    super.draw(t, dt);

    for (let objId of Object.keys(this.sprites)) {
      let obj = this.gameEngine.world.objects[objId];
      let sprite = this.sprites[objId];

      if (obj) obj.draw(t, dt);
    };
  }
}