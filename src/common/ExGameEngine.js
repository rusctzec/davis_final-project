import { TwoVector, GameEngine, SimplePhysicsEngine, Lib} from 'lance-gg';
import TileMap from './TileMap';
import PlayerCharacter from './PlayerCharacter';
import CannonBall from './CannonBall';

export default class ExGameEngine extends GameEngine {
  constructor(options) {
    super(options);

    if (!this.world) this.world = {};
    this.world.playerCount = 0;

    this.physicsEngine = new SimplePhysicsEngine({
        gameEngine: this,
        collisions: {
            type: 'brute',
            autoResolve: false,
        }
    });
  }

  registerClasses(serializer) {
    serializer.registerClass(PlayerCharacter);
    serializer.registerClass(CannonBall);
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
        case 'fire':
          this.makeProjectile(player, inputData.messageIndex, inputData.options.eventPosition);
      }
    }
  }

  gameLogic() {
    let players = this.world.queryObjects({instanceType: PlayerCharacter});
    let projectiles = this.world.queryObjects({instanceType: CannonBall});
    for (let projectile of projectiles) {
      let roomName = this.playerLocations[projectile.playerId] || this.playerLocations[this.playerId];
      let settings = this.settings[roomName];
      let tileMap = this.tileMaps[roomName];
      if (!tileMap) continue;

      let projectileCollide = () => {
        console.log("projectileCollide")
        // terrain damage code (activates on server and is then distributed to avoid canvas desync)
        if (this.serverEngine) {
          this.serverEngine.handleCanvasUpdate({
            x: Math.round(projectile.x-Math.round(projectile.width/2)),
            y: Math.round(projectile.y-Math.round(projectile.height/2)),
            roomName: this.playerLocations[projectile.playerId],
            data:
            [
              [ 0, 0,-1,-1, 0, 0],
              [ 0,-1,-1,-1,-1, 0],
              [-1,-1,-1,-1,-1,-1],
              [-1,-1,-1,-1,-1,-1],
              [-1,-1,-1,-1,-1,-1],
              [ 0,-1,-1,-1,-1, 0],
              [ 0, 0,-1,-1, 0, 0],
            ]
          });
        }

        if (this.renderer) {
          this.renderer.sounds.projectileHit.play();
          projectile.explosionEmitter.playOnceAndDestroy();
          this.renderer.cameraShake += 5}
        if (projectile) {this.removeObjectFromWorld(projectile);}
      }

      // walls/floors collisions
      if (settings.bottomWall) {
        if (projectile.position.y >= settings.worldHeight) {
          projectileCollide();
          return
        }
      }
      if (settings.topWall) {
        if (projectile.position.y < 0) {
          projectileCollide();
          return
        }
      }
      if (settings.leftWall) {
        if (projectile.position.x < 0) {
          projectileCollide();
          return
        }
      }
      if (settings.rightWall) {
        if (projectile.position.x >= settings.worldWidth) {
          projectileCollide();
          return
        }
      }

      let x = Math.round(projectile.x), y = Math.round(projectile.y);
      for (let i = x; i < projectile.width+x; i++) {
        for (let j = y; j < projectile.height+y; j++) {
          if (tileMap.get(Math.round(i),Math.round(j))) {
            projectileCollide();
            return
          }
        }
      }

      projectile.velocity.x *= 0.99; // deceleration
      projectile.velocity.y += 0.1; // gravity

      if (projectile.position.y > settings.height+10) {
        this.removeObjectFromWorld(projectile);
      }
    }

    // iterate through player size over position in tilemap and see if there's any collisions
    for (let player of players) {
      let roomName = this.playerLocations[player.playerId] || this.playerLocations[this.playerId];
      let settings = this.settings[roomName];
      let tileMap = this.tileMaps[roomName];
      if (!tileMap) continue;

      let x = Math.round(player.position.x);
      let y = Math.round(player.position.y);
      let colliding = false;
      let onFloor = false;
      let incident = null;
      player.velocity.x *= 0.9; // deceleration
      player.velocity.y += 0.1; // gravity
      // tilemap collision handling
      let handled = {r: false, l: false, u: false, d: false} // loop state to avoid handling one side of the collision more than once
      for (let i = x; i < player.width+x; i++) {
        for (let j = y; j < player.height+y; j++) {
          let collision = false;

          if (tileMap.get(i,j)) {
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
            } else if (player.velocity.y < 0 && tileMap.get(i,j-1)) {
              player.velocity.y = Math.max(0, player.velocity.y);
            }
          }
          left: if (i == x) { // left side
            if (j > y+player.height-3) break left; // don't handle collisions for bottom pixels
            if (collision && !handled.l) {
              handled.l = true;
              player.position.x += 1;
              player.velocity.x = Math.max(0, player.velocity.x);
            } else if (player.velocity < 0 && tileMap.get(i-1, j)) {
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
            } else if (player.velocity.x > 0 && tileMap.get(i-1, j)) {
              player.velocity.x = Math.min(0, player.velocity.x);
            }
          }
          else
          down: if (j > player.height+y-4 && Math.sign(player.velocity.y) == 1) { // bottom part for floor detection
            if (collision && !handled.d) {
              handled.d = true;
              player.position.y -= 1;
              onFloor = true;
            } else if (player.velocity.y > 0 && tileMap.get(i,j+1)) {
              onFloor = true;
            }
          }
        }
      }

      if (settings.leftWall && player.position.x < 0) {
        player.position.x = 0;
      } else if (settings.rightWall && player.position.x + player.width >= settings.worldWidth) {
        player.position.x = settings.worldWidth - player.width;
      }
      if (settings.topWall && player.position.y < 0) {
        player.position.y = 0;
      } else if (settings.bottomWall && player.position.y + player.height > settings.worldHeight) {
        player.position.y = settings.worldHeight - player.height;
        onFloor = true;
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

      if (player.position.y > settings.worldHeight+10) {
        this.removeObjectFromWorld(player);
      }
    }


  }

  // method to find the tilemap an update is destined for and apply it
  updateTileMap(update) {
    // if there is no update.roomName it must be coming from the player itself so just use the player's room
    let roomName = update.roomName || this.playerLocations[this.playerId];
    if (roomName == "/lobby") return; // no drawing in lobby
    let settings = this.settings[roomName];
    let tileMap = this.tileMaps[roomName];
    // ignore update if you don't have a tilemap for it, it was probably meant for a room you haven't visited and have not generated a tilemap for
    if (!tileMap) {
      return;
    }
    // attempt to determine update type if not provided
    update.type = update.type ||
      (update.size ? "rect"
      :
      update.data && update.data[0] instanceof Array ? "array"
      : 
      null);

    tileMap.update(update);

    return
    // (too lazy to fool-proof method right now)
    try {

    // fill by rect
    let {x, y, data, size, fill} = update;
    if (x == null || y == null) return;
    if (size) {
      for (let i = x; i < x+size && i < settings.worldWidth; i++) {
        for (let j = y; j < y+size && j < settings.worldHeight; j++) {
          if (i < 0 || j < 0) continue;
          let col = tileMap[i];
          if (!col) console.log("COL IS NULL", tileMap.length);
          col[j] = fill===-1?0:1;
        }
      }
    // fill by 2d array
    } else if (data) {
      let lenX = data.length; if (lenX === 0) return;
      let lenY = data[0].length;
      for (let i=0; i < lenX && i < settings.worldWidth; i++) {
        for (let j=0; j < lenY && j < settings.worldHeight; j++) {
          let val = data[i][j]; if (val === 0 || i+x < 0 || j+y < 0 || i+x >= settings.worldWidth || j+y >= settings.worldHeight) continue;
          if (val === -1) tileMap[x+i][y+j] = 0;
          else tileMap[x+i][y+j] = 1;
        }
      }
    }
    } catch (e) {console.log("TILEMAP ERROR:", e)}
  }

  spawnPlayer(playerId) {
    let player = new PlayerCharacter(this, null, {
      position: new TwoVector(25,25)//(this.worldWidth*0.10 + this.worldWidth*0.80*Math.random(), this.worldHeight*0.35 + this.worldHeight*0.35*Math.random())
    })
    player.playerId = playerId;
    this.addObjectToWorld(player);
    return player;
  }

  makeProjectile(player, inputId, towardsPoint) {
    if (this.renderer) {
      this.renderer.sounds.fireBullet.play();
    }
    let cannonBall = new CannonBall(this, null, {
      position: new TwoVector(player.position.x + player.width, player.position.y)
    });
    cannonBall.position.set(player.position.x, player.position.y);
    let newVelocity = new TwoVector(towardsPoint.x - player.position.x, towardsPoint.y - player.position.y).normalize()
    cannonBall.velocity.x = player.velocity.x + newVelocity.x * 5;
    cannonBall.velocity.y = player.velocity.y + newVelocity.y * 3;
    cannonBall.playerId = player.playerId;
    cannonBall.inputId = inputId;
    this.addObjectToWorld(cannonBall);
    return cannonBall;
  }

  start() {
    this.on("client__roomUpdate", (update) => {
      this.playerLocations[update.playerId] = update.to;
      if (update.playerId == this.playerId) this.clientEngine.roomUpdate(update);
    });
    this.on("server__roomUpdate", (update) => {
      this.playerLocations[update.playerId] = update.to;
    })
    this.on("playerJoined", (update) => {
      this.playerLocations[update.playerId] = "/lobby";
    });

    // dictionary to track each playerId to the room they are current in
    this.playerLocations = {};
    // create dictionary to track a tilemap representing the canvas to each room if it doesn't already exist
    if (!this.tileMaps) this.tileMaps = {};


    super.start();
    console.log("GameEngine started");

    this.on('postStep', this.gameLogic.bind(this));
  }
}