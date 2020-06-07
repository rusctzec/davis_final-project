import { ServerEngine } from 'lance-gg';


export default class ExServerEngine extends ServerEngine {
  constructor(io, gameEngine, inputOptions) {
    super(io, gameEngine, inputOptions);
  }

  onPlayerConnected(socket) {
    super.onPlayerConnected(socket);

    this.gameEngine.spawnPlayer(socket.playerId);
    // send canvas state over to new players
    socket.emit("canvasUpdate", {x: 0, y: 0, data: this.gameEngine.tileMap})

    socket.on("canvasUpdate", update => {
      this.gameEngine.updateTileMap(update);
      this.io.sockets.emit("canvasUpdate", update);
    });

  }

  onPlayerDisconnected(socketId, playerId) {
    super.onPlayerDisconnected(socketId, playerId)

    let playerObjects = this.gameEngine.world.queryObjects({playerId: playerId});
    playerObjects.forEach(obj => {
      this.gameEngine.removeObjectFromWorld(obj.id);
    });

  }


}