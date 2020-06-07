import { TwoVector, GameEngine, SimplePhysicsEngine } from 'lance-gg';
import Player from './Player';

export default class ExGameEngine extends GameEngine {
  constructor(options) {
    super(options);
    console.log("ENGINE OPTIONS", options);
    this.physicsEngine = new SimplePhysicsEngine({gameEngine: this});
  }

  registerClasses(serializer) {
    serializer.registerClass(Player);
  }

  processInput(inputData, playerId) {
    super.processInput(inputData, playerId);

    let player = this.world.queryObject({
      playerId, instanceType: Player
    });

    if (player) {
      if (inputData.input == 'up') {
        player.position.x += 10;
        console.log(player.position.x)
      } else if (inputData.input == 'down') {
        player.position.x -= 10;
        console.log(player.position.x)
      }
    }
  }

  updateTileMap(update) {
    // fill by rect
    let {x, y, data, size, fill} = update;
    if (x == null || y == null) return;
    if (size) {
      for (let i = x; i < x+size && i < this.worldWidth; i++) {
        for (let j = y; j < y+size && j < this.worldHeight; j++) {
          if (i < 0 || j < 0) continue;
          this.tileMap[i][j] = fill===-1?0:1;
        }
      }
    // fill by 2d array
    } else if (data) {
      let lenX = data.length; if (lenX == 0) return;
      let lenY = data[0].length;
      for (let i=0; i < lenX && i < this.worldWidth; i++) {
        for (let j=0; j < lenY && j < this.worldHeight; j++) {
          let val = data[i][j]; if (val == 0 || i < 0 || j < 0) continue;
          if (val == -1) this.tileMap[x+i][y+j] = 0;
          else this.tileMap[x+i][y+j] = 1;
        }
      }
    }
  }

  spawnPlayer(playerId) {
    let player = new Player(this, null, {
      position: new TwoVector(30, 30)
    })
    player.playerId = playerId;
    this.addObjectToWorld(player);
    return player;
  }

  initWorld() {
    super.initWorld({
      worldWrap: false,
      width: this.worldWrap,
      height: this.worldHeight
    });
  }

  start() {
    this.worldWidth = this.worldWidth ?? 500;
    this.worldHeight = this.worldHeight ?? 500;
    this.tileMap = Array(this.worldWidth)
    for (let i = 0; i < this.tileMap.length; i++) {
      this.tileMap[i] = Array(this.worldHeight).fill(0);
    }
    super.start();
    console.log("GameEngine started");
  }
}