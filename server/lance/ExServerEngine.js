import { ServerEngine } from 'lance-gg';


export default class ExServerEngine extends ServerEngine {

  onPlayerConnected(socket) {
    super.onPlayerConnected(socket);
    // send canvas state over to new players
    socket.emit("canvasUpdate", {x: 0, y: 0, data: this.gameEngine.tileMap})

    socket.on("canvasUpdate", update => {
      // remove unneccesary data and add id
      let update2 = {x: update.x, y: update.y, size: update.size, fill: update.fill, data: update.data, id: socket.playerId, name: `player ${socket.playerId}`};
      this.gameEngine.updateTileMap(update2);
      this.io.sockets.emit("canvasUpdate", update2);
    });

    socket.on("requestCreation", () => {
      console.log("requestCreation");
      let playerObjects = this.gameEngine.world.queryObjects({playerId: socket.playerId});
      let noPlayerObjects = true;
      playerObjects.forEach(obj => {
        noPlayerObjects = false;
      });
      if (noPlayerObjects) this.gameEngine.spawnPlayer(socket.playerId);
    });

    socket.on("requestDeath", () => {
      console.log("requestDeath");
      let playerObjects = this.gameEngine.world.queryObjects({playerId: socket.playerId});
      playerObjects.forEach(obj => {
        this.gameEngine.removeObjectFromWorld(obj.id);
      });
    })
  }

  onPlayerDisconnected(socketId, playerId) {
    super.onPlayerDisconnected(socketId, playerId)

    let playerObjects = this.gameEngine.world.queryObjects({playerId: playerId});
    playerObjects.forEach(obj => {
      this.gameEngine.removeObjectFromWorld(obj.id);
    });
  }

  start() {
    super.start();
    this.gameEngine.serverEngine = this;
  }
}