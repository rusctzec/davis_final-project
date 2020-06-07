import { DynamicObject, Renderer } from 'lance-gg';

export default class Player extends DynamicObject {
  constructor(gameEngine, options, props) {
    super(gameEngine, options, props);
  }

/*
  static get bending() {
    return {
      position: { percent: 0.0 },
    }
  }
*/

/*
  static get netScheme() {
    return Object.assign({}, super.netScheme);
  }
*/


  syncTo(other) {
    super.syncTo(other);
  }

  onAddToWorld(gameEngine) {
    console.log("Player added to world");
    if (Renderer) {
      let renderer = Renderer.getInstance();
      let PIXI = renderer.PIXI;
      this.sprite = new PIXI.Graphics()
      this.sprite.zIndex = 5;
      this.sprite.blendMode = PIXI.BLEND_MODES.ADD;
      this.sprite.position.x = this.position.x;
      this.sprite.position.y = this.position.y;
      this.sprite.beginFill(0x0000ff);
      this.sprite.drawRect(0,0,10,10);
      this.sprite.endFill();

      renderer.sprites[this.id] = this.sprite;

      renderer.container.addChild(this.sprite);
    }
  }

  draw() {
    this.sprite.position.x = this.position.x;
    this.sprite.position.y = this.position.y;
  }
}