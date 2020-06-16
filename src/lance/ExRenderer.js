import { PlayerCharacter, Renderer } from 'lance-gg';
import * as PIXI from 'pixi.js';
import {Howl} from 'howler';

export default class ExRenderer extends Renderer {
  constructor(gameEngine, clientEngine) {
    super(gameEngine, clientEngine);
    this.sprites = {}; // dictionary of PIXI elements by lance objId
    this.nameplates = {}; // nameplates shown near where users make strokes

    let sounds = [
      "jump",
      "fireBullet",
      "playerHurt",
      "playerDestroyed",
      "projectileHit",
      "spawn",
    ];
    this.sounds = {};
    for (let sound of sounds) this.sounds[sound] = new Howl({src: `/assets/audio/${sound}.wav`});

    PIXI.Loader.shared.baseUrl = "/assets/images/";

    this.cameraShake = 0;
    this.container = new PIXI.Container();
    this.PIXI = PIXI;
  }

  init() {
    console.log("Renderer started");
    this.stage.addChild(this.container);

    return new Promise((resolve, reject) => {

      PIXI.Loader.shared.add([
        {name: "orb", url: "orb.png"},
        {name: "triangle", url: "triangle.png"}
      ]).load((loader, resources) => {
        resolve();
        this.gameEngine.emit("renderer.ready");
      });
    });
  }

  draw(t, dt) {
    super.draw(t, dt);

    this.canvas._x = Math.lerp(this.canvas._x, this.canvas.targetX, 0.10) + this.cameraShake*(Math.random()-0.5);
    this.canvas._y = Math.lerp(this.canvas._y, this.canvas.targetY, 0.10) + this.cameraShake*(Math.random()-0.5);
    this.canvas._scale = Math.lerp(this.canvas._scale, this.canvas.targetScale, 0.10);

    this.cameraShake = Math.lerp(this.cameraShake, 0, 0.10);

    for (let objId of Object.keys(this.sprites)) {
      let obj = this.gameEngine.world.objects[objId];
      let sprite = this.sprites[objId];

      if (obj) obj.draw(t, dt);
    };

    for (let i of Object.keys(this.nameplates)) {
      if (this.nameplates[i].alpha > 0) this.nameplates[i].alpha -= dt*0.001;
    }

    if (this.clientEngine.gameMode) {
      if (this.gameEngine.player) {
        let scale = this.canvas.targetScale;
        this.canvas.x = -this.gameEngine.player.x * scale + window.innerWidth/2;
        this.canvas.y = -this.gameEngine.player.y * scale + window.innerHeight/2;
        /*
        this.canvas.x = -this.gameEngine.player.x / scale + (this.canvas.width*scale)/2;
        this.canvas.y = -this.gameEngine.player.y / scale + (this.canvas.height*scale)/2;
        */
      }
    }
  }

  handleStroke(update) {
    if (update.id == this.gameEngine.playerId) return;
    if (!this.nameplates[update.id]) { // does not already exist
      this.nameplates[update.id] = new PIXI.Text(update.name, {fontFamily: 'serif', fontSize: 12, align: 'center'});
      this.container.addChild(this.nameplates[update.id]);
    }
    this.nameplates[update.id].alpha = 1;
    this.nameplates[update.id].position.x = update.x-10;
    this.nameplates[update.id].position.y = update.y-20;
  }
}