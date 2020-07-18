import { BaseTypes, DynamicObject, Renderer } from 'lance-gg';
import ExplosionEmitterConfig from './ProjectileExplosionEmitter';
let PixiParticles;

export default class CannonBall extends DynamicObject {
  constructor(gameEngine, options, props){
    super(gameEngine, options, props);
    this.damage = 1;
    this.width = 5;
    this.width = 5;
    if (Renderer) PixiParticles = require('pixi-particles');
  }

  static get bending() {
    return {
      position: {percent: 1.0}
    }
  }

  static get netScheme() {
    return Object.assign({
      damage: { type: BaseTypes.TYPES.INT32},
      inputId: { type: BaseTypes.TYPES.INT32}
    }, super.netScheme)
  }

  draw() {
    this.sprite.position.set(0, 0);
    this.container.position.set(this.position.x, this.position.y);
  }

  onAddToWorld(gameEngine) {
    if (Renderer) {
      let renderer = Renderer.getInstance();
      let PIXI = renderer.PIXI;
      this.sprite = new PIXI.Sprite(PIXI.Loader.shared.resources.orb.texture)
      this.container = new PIXI.Container();
      this.container.position.set(this.position.x, this.position.y);

      this.sprite.tint = 0x000000;
      renderer.sprites[this.id] = this.container;
      this.sprite.anchor.set(0.5, 0.5);
      this.sprite.scale.set(0.5,0.5);
      this.sprite.position.set(0, 0);
      this.container.addChild(this.sprite);

      renderer.container.addChild(this.container);

      this.explosionEmitter = new PixiParticles.Emitter(
        this.container,
        [PIXI.Loader.shared.resources.triangle.texture],
        ExplosionEmitterConfig
      );
    }
  }

  onRemoveFromWorld(gameEngine) {
    if (Renderer) {
      let renderer = Renderer.getInstance();
      this.sprite.destroy()
      this.gameEngine.timer.add(Math.round(this.explosionEmitter.maxLifetime*60), ()=>{
          this.container.destroy();
          if (renderer.sprites[this.id]) {
            delete renderer.sprites[this.id];
          }
      }, this)
    }
  }

  syncTo(other) {
    super.syncTo(other);
    this.damage = other.damage;
    this.inputId = other.inputId;
  }
}
