import { TwoVector, DynamicObject, BaseTypes, Renderer } from 'lance-gg';
import SpawnEmitterConfig from './SpawnEmitter';
import ExplosionEmitterConfig from './ExplosionEmitter';
let PixiParticles;

export default class PlayerCharacter extends DynamicObject {
  constructor(gameEngine, options, props) {
    super(gameEngine, options, props);
    this.width = 10;
    this.height = 10;
    if (Renderer) PixiParticles = require('pixi-particles');
  }

  static get bending() {
    return {
      position: { percent: 1.0, min: 0.0 },
      velocity: { percent: 0.0, min: 0.0 },
    }
  }

  syncTo(other) {
    super.syncTo(other);
  }

  onAddToWorld(gameEngine) {
    console.log("Player added to world");
    if (Renderer) {
      let renderer = Renderer.getInstance();
      let PIXI = renderer.PIXI;
      renderer.sounds.spawn.play();
      this.sprite = new PIXI.Graphics()
      this.sprite.position.x = this.position.x;
      this.sprite.position.y = this.position.y;
      this.sprite.beginFill(0x0000ff);
      this.sprite.drawRect(0,0,10,10);
      this.sprite.endFill();
      if (gameEngine.playerId == this.playerId) {
        gameEngine.player = this;
      }
      renderer.sprites[this.id] = this.sprite;

      renderer.container.addChild(this.sprite);

      this.spawnEmitter = new PixiParticles.Emitter(
        renderer.container,
        [PIXI.Loader.shared.resources.orb.texture],
        SpawnEmitterConfig
      );
      this.spawnEmitter.spawnPos.x = this.sprite.position.x;
      this.spawnEmitter.spawnPos.y = this.sprite.position.y;
      this.spawnEmitter.autoUpdate = true;

      this.explosionEmitter = new PixiParticles.Emitter(
        this.sprite,
        [PIXI.Loader.shared.resources.triangle.texture],
        ExplosionEmitterConfig
      );
    }
  }

  onRemoveFromWorld(gameEngine) {
    console.log("Player removed from world")
    if (Renderer) {
      let renderer = Renderer.getInstance();
      renderer.sounds.playerDestroyed.play();
      if (gameEngine.playerId == this.playerId) {
        gameEngine.player = null;
        this.gameEngine.clientEngine.gameMode = false;
      }
      renderer.cameraShake += 10;
      this.sprite.clear();
      this.spawnEmitter.destroy();
      this.explosionEmitter.playOnceAndDestroy();
      this.gameEngine.timer.add(Math.round(this.explosionEmitter.maxLifetime*60), ()=>{
          this.sprite.destroy()
      }, this)
    }
  }

  draw() {
    if (this.colliding) {
      this.sprite.clear();
      this.sprite.beginFill(0x0000ff);
      this.sprite.drawRect(0,0,10,10);
    } else {
      this.sprite.clear();
      this.sprite.beginFill(0x0000ff);
      this.sprite.drawRect(0,0,10,10);
    }
    this.sprite.position.x = this.position.x;
    this.sprite.position.y = this.position.y;
  }
}