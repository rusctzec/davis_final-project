import { TwoVector, GameEngine, SimplePhysicsEngine } from 'lance-gg';
import PlayerCharacter from './PlayerCharacter';

export default class ExGameEngine extends GameEngine {
  constructor(options) {
    super(options);
    this.physicsEngine = new SimplePhysicsEngine({gameEngine: this, collisions: { type: 'brute', autoResolve: 'false' }});
  }

  registerClasses(serializer) {
    serializer.registerClass(PlayerCharacter);
  }

  processInput(inputData, playerId) {
    super.processInput(inputData, playerId);
    let player = this.world.queryObject({
      playerId, instanceType: PlayerCharacter
    });

    if (player) {
      switch (inputData.input) {
        case 'left':
          player.velocity.x -= 0.1;
          break;
        case 'right':
          player.velocity.x += 0.1;
          break;
        case 'up':
          if (player.onFloor == true) {
            if (this.renderer) this.renderer.sounds.jump.play();
            player.velocity.y = -1.5;
          }
          break;
        case 'down':
          player.velocity.y += 0.01;
          break;
      }
    }
  }

  gameLogic() {
    let players = this.world.queryObjects({instanceType: PlayerCharacter});
    // iterate through player size over position in tilemap and see if there's any collisions
    for (let player of players) {
      let x = Math.round(player.position.x);
      let y = Math.round(player.position.y);
      let colliding = false;
      let onFloor = false;
      let incident = null;
      let bufferedIncrease = 0;
      player.velocity.x *= 0.9; // deceleration
      player.velocity.y += 0.1; // gravity
      // tilemap collision handling
      let handled = {r: false, l: false, u: false, d: false} // loop state to avoid handling one side of the collision more than once
      for (let i = x; i < player.width+x; i++) {
        for (let j = y; j < player.height+y; j++) {
          let collision = false;
          if (this.tileMap.get(i,j)) {
            collision = true;
            if (!incident) { // checking for incident (stop after first)
              colliding = true;
              let center = new TwoVector(x + player.width/2, y + player.height/2)
              incident = new TwoVector(i,j);
              incident.subtract(center); if (incident.x == 0 || incident.y == 0) continue;
              incident.normalize();
              //player.velocity.set(incident.x*-1, incident.y*-1);
            }
          }
          up: if (j == y) { // botton row for floor detection
            if (i < x+1 || i > x+player.width-2) break up; // don't handle collisions for side pixels
            if (collision && !handled.u) {
              handled.u = true;
              player.position.y += 1;
              player.velocity.y = Math.max(0, player.velocity.y);
            } else if (player.velocity.y < 0 && this.tileMap.get(i,j-1)) {
              player.velocity.y = Math.max(0, player.velocity.y);
            }
          }
          left: if (i == x) { // left side
            if (j > y+player.height-3) break left; // don't handle collisions for bottom pixels
            if (collision && !handled.l) {
              handled.l = true;
              player.position.x += 1;
              player.velocity.x = Math.max(0, player.velocity.x);
            } else if (player.velocity < 0 && this.tileMap.get(i-1, j)) {
              player.velocity.x = Math.max(0, player.velocity.x);
            }
          }
          else
          right: if (i == x+player.width-1) { // right side
            if (j > player.height+y-4) break right; // don't handle collisions for bottom pixels
            if (collision && !handled.r) {
              handled.r = true;
              player.position.x -= 1;
              player.velocity.x = Math.min(0, player.velocity.x);
            } else if (player.velocity.x > 0 && this.tileMap.get(i-1, j)) {
              player.velocity.x = Math.min(0, player.velocity.x);
            }
          }
          else
          down: if (j > player.height+y-4 && Math.sign(player.velocity.y) == 1) { // botton part for floor detection
            if (collision && !handled.d) {
              handled.d = true;
              player.position.y -= 1;
              onFloor = true;
            } else if (player.velocity.y > 0 && this.tileMap.get(i,j+1)) {
              onFloor = true;
            }
          }
        }
      }

      if (player == this.player) {
      }

      player.onFloor = onFloor;
      player.colliding = colliding;
      if (onFloor) {
        player.velocity.y = Math.min(0, player.velocity.y);
      }
      player.velocity.y = Math.max(Math.min(player.velocity.y, 3), -10); // cap y velocity

      // add velocity to position
      player.position.x += player.velocity.x;
      player.position.y += player.velocity.y;

      if (player.position.y > this.worldHeight+10) {
        this.removeObjectFromWorld(player);
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
      let lenX = data.length; if (lenX === 0) return;
      let lenY = data[0].length;
      for (let i=0; i < lenX && i < this.worldWidth; i++) {
        for (let j=0; j < lenY && j < this.worldHeight; j++) {
          let val = data[i][j]; if (val === 0 || i < 0 || j < 0) continue;
          if (val === -1) this.tileMap[x+i][y+j] = 0;
          else this.tileMap[x+i][y+j] = 1;
        }
      }
    }
  }

  spawnPlayer(playerId) {
    let player = new PlayerCharacter(this, null, {
      position: new TwoVector(25,25)//(this.worldWidth*0.10 + this.worldWidth*0.80*Math.random(), this.worldHeight*0.35 + this.worldHeight*0.35*Math.random())
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
    this.worldWidth || (this.worldWidth = 500);
    this.worldHeight || (this.worldHeight = 500);
    this.tileMap = Array(this.worldWidth)
    for (let i = 0; i < this.tileMap.length; i++) {
      this.tileMap[i] = Array(this.worldHeight).fill(0);
    }
    this.tileMap.get = (x,y) => {
      let col = this.tileMap[x];
      return (col ? col[y] : undefined);
    }
    this.tileMap.set = (x,y,int) => {
      if (int == 0) return;
      let col = this.tileMap[x];
      if (col && col[y] != undefined) col[y] = (int == -1 ? 0 : int);
    }

    super.start();
    console.log("GameEngine started");

    this.on('postStep', this.gameLogic.bind(this));
  }
}