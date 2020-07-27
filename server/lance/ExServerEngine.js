import { ServerEngine } from 'lance-gg';
import TileMap from '../../src/common/TileMap';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';
import '../../src/utils/MathExtras';
import * as Models from "../models";




export default class ExServerEngine extends ServerEngine {

  constructor(io, gameEngine, options) {
    super(io, gameEngine, options);
    this.gameEngine.playerLocations = this.gameEngine.playerLocations || {};

  }

  onPlayerConnected(socket) {
    super.onPlayerConnected(socket);

    // send canvas game settings for all rooms to new players
    socket.emit("settingsUpdate", this.settings);


    socket.on("canvasUpdate", (update) => this.handleCanvasUpdate(update, socket.playerId));

    socket.on("requestCreation", () => {
      console.log("requestCreation");
      let playerObjects = this.gameEngine.world.queryObjects({playerId: socket.playerId});
      let noPlayerObjects = true;
      playerObjects.forEach(obj => {
        noPlayerObjects = false;
      });
      let player = Object.keys(this.connectedPlayers).map(key => this.connectedPlayers[key]).find(p => p.socket.playerId == socket.playerId);
      if (noPlayerObjects) this.assignObjectToRoom(this.gameEngine.spawnPlayer(socket.playerId), player.roomName);
    });

    socket.on("requestDeath", () => {
      console.log("requestDeath");
      let playerObjects = this.gameEngine.world.queryObjects({playerId: socket.playerId});
      playerObjects.forEach(obj => {
        this.gameEngine.removeObjectFromWorld(obj.id);
      });
    });

    // incoming settings from clients are always for a single room and not a collection of all
    socket.on("settingsUpdate", newSettings => {
      delete newSettings.roomName; // don't want the user to change the roomname on the settings and mess stuff up
      // limit dimensions
      newSettings.worldWidth = isNaN(newSettings.worldWidth) ? 10 : Math.max(10, Math.min(1000, newSettings.worldWidth));
      newSettings.worldHeight = isNaN(newSettings.worldHeight) ? 10 : Math.max(10, Math.min(1000, newSettings.worldHeight));

      // get roomname and existing settings
      let player = Object.keys(this.connectedPlayers).map(key => this.connectedPlayers[key]).find(p => p.socket.playerId == socket.playerId);
      if (!player.roomName) return;
      let roomName = player.roomName
      let settings = this.settings[roomName];

      // regenerate tileMap if dimensions changed
      let dimensionsChanged = (newSettings.worldWidth != settings.worldWidth || newSettings.worldHeight != settings.worldHeight);
      console.log("DIMENSIONS CHANGED", dimensionsChanged, newSettings.worldWidth, newSettings.worldHeight, settings.worldWidth, settings.worldHeight);
      this.settings[roomName] = {...settings, ...newSettings};
      if (dimensionsChanged) {
        this.gameEngine.tileMaps[player.roomName] = new TileMap(this.settings[player.roomName].worldWidth, this.settings[player.roomName].worldHeight, {type: "array", data: this.gameEngine.tileMaps[player.roomName]})

        /*
        Object.keys(this.connectedPlayers).map(key => this.connectedPlayers[key]).forEach(p => {
          if (p.roomName == roomName) p.socket.emit('canvasUpdate', {x: 0, y: 0, roomName: roomName, data: this.gameEngine.tileMaps[roomName]});
        });
        */

      }
      // push updated settings to mongodb
      Models.Settings.findOneAndReplace({roomName: roomName}, this.settings[roomName], {upsert: true})
      .then(r => r);

      // distribute update to connected clients
      this.io.sockets.emit("settingsUpdate", this.settings);
    });

    socket.on("requestRoom", roomName => {
      console.log("requestRoom", roomName);
      // dont allow rooms longer than 6 characters (not including slash)
      if (!roomName || roomName.length > 7) return;
      if (!this.rooms[roomName]) {
        this.createRoom(roomName);
      }
      // make a thumbnail for the gallery
      this.generateImage(roomName);
      // save to the database
      Models.TileMap.findOneAndReplace({roomName: roomName}, {roomName: roomName, data: this.gameEngine.tileMaps[roomName]}, {upsert: true})
      .then(r => r);

      this.assignPlayerToRoom(socket.playerId, roomName);
      socket.emit("settingsUpdate", this.gameEngine.settings);
      // send canvas state over to players when they join a room
      socket.emit("canvasUpdate", {x: 0, y: 0, roomName: roomName, data: this.gameEngine.tileMaps[roomName]})
    });
  }

  onPlayerDisconnected(socketId, playerId) {
    super.onPlayerDisconnected(socketId, playerId)
    delete this.gameEngine.playerLocations[playerId];

    if (!this.gameEngine.world.queryObjects) return;
    let playerObjects = this.gameEngine.world.queryObjects({playerId: playerId});
    playerObjects.forEach(obj => {
      this.gameEngine.removeObjectFromWorld(obj.id);
    });
  }

  handleCanvasUpdate(update, playerId) {
    let roomName = this.gameEngine.playerLocations[playerId] || update.roomName;
    // remove unneccesary data and add id
    let update2 = {x: update.x, y: update.y, size: update.size, fill: update.fill, data: update.data,
      id: playerId,
      name: playerId == undefined ? "" : `player ${playerId}`,
      roomName: roomName,
    };
    this.gameEngine.updateTileMap(update2);

    // emit only to sockets in the room that the canvas update happened
    let sockets = this.io.sockets.sockets;
    for (let i of Object.keys(sockets)) {
      if (this.gameEngine.playerLocations[sockets[i].playerId] == roomName) {
        sockets[i].emit("canvasUpdate", update2);
      }
    }
  }

  // return info about the rooms and the amount of players in each (for the gallery display page to show)
  summarizeRooms() {
    let arr = [];
    let roomNames = Object.keys(this.rooms);
    if (this.settings) roomNames.push(...Object.keys(this.settings));
    for (let roomName of new Set(roomNames)) { // (Set removes duplicates)
      if (roomName == "/lobby") continue; // don't include the /lobby room it's just a byproduct of lance's functionality
      let players = 0;
      for (let playerId of Object.keys(this.gameEngine.playerLocations)) {
        if (this.gameEngine.playerLocations[playerId] == roomName) players++;
      }
      arr.push({
        name: roomName,
        width: this.settings[roomName].worldWidth,
        height: this.settings[roomName].worldHeight,
        players: players,
      });
    }
    return arr;
  }

  // converts tilemap data to a PNG
  generateImage(roomName) {
    let tileMap = this.gameEngine.tileMaps[roomName];
    if (!tileMap) return;

    var newFile = new PNG({ width: this.settings[roomName].worldWidth, height: this.settings[roomName].worldHeight });
    for (let y = 0; y < newFile.height; y++) {
      for (let x = 0; x < newFile.width; x++) {
        let i = (newFile.width * y + x ) << 2;
        let color = tileMap.get(x, y) ? 0x00 : 0xff;
        newFile.data[i] = color;
        newFile.data[i + 1] = color;
        newFile.data[i + 2] = color;
        newFile.data[i + 3] = 0xff;
      }
    }

    // trim up to server directory because __dirname is at different paths within it depending on if this is a dev or production build
    // (e.g. malleary/server/lance -> malleary/server)
    const thumbnailPath = __dirname.replace(/(?!.*?server)[^server].*$/, "")
    // these will be served through an express route
    fs.mkdir(path.join(thumbnailPath, 'tmp/rooms'), {recursive: true}, err => {
      if (err) { console.error(err); return;}
      newFile.pack().pipe(fs.createWriteStream(path.join(thumbnailPath, `tmp/rooms${roomName}.png`)));
    });
  }

  // generates a settings object with default settings
  getDefaultSettings() {
    return {
      worldWidth: 150,
      worldHeight: 150,
      walls: false,
      floor: false,
      drawers: [],
      admins: [],
      allow: [],
      exclude: [],
    }
  }

  createRoom(roomName, settings) {
    console.log("createRoom", roomName);
    if (!this.settings) this.gameEngine.settings = this.settings = {}; // create settings dictionary if doesn't already exist
    if (!this.gameEngine.tileMaps) this.gameEngine.tileMaps = {}; // create tilemaps dictionary if doesn't already exist
    super.createRoom(roomName);

    this.settings[roomName] = Object.assign(this.getDefaultSettings(), this.settings[roomName], settings);
    this.settings[roomName].roomName = roomName;

    Models.Settings.findOneAndReplace({roomName: roomName}, this.settings[roomName], {upsert: true});

    // generate tilemap for the room if there is none in place
    this.gameEngine.tileMaps[roomName] = this.gameEngine.tileMaps[roomName] || new TileMap(this.settings[roomName].worldWidth, this.settings[roomName].worldHeight);
    this.settings[roomName].worldWidth = this.gameEngine.tileMaps[roomName].length;
    this.settings[roomName].worldHeight = this.gameEngine.tileMaps[roomName][0].length;
  }

  start() {
    // load existing settings and tilemaps into memory
    (async () => {
      let settingsDocuments = await Models.Settings.find();
      let tileMapDocuments = await Models.TileMap.find();

      if (!this.settings) retrievedTileMap.settings;

      let existingSettings = [];
      for (let item of settingsDocuments) {
        let retrievedSettings = item.toObject();
        let settings = Object.assign(this.getDefaultSettings(), retrievedSettings);
        delete settings._id;
        delete settings.__v;
        existingSettings.push(settings)
      }
      for (let item of tileMapDocuments) {
        let retrievedTileMap = item.toObject();
        if (!retrievedTileMap.data[0]) continue;
        let worldWidth = retrievedTileMap.data.length;
        let worldHeight = retrievedTileMap.data[0].length;
        this.settings[retrievedTileMap.roomName] = {worldHeight, worldWidth};
        this.gameEngine.tileMaps[retrievedTileMap.roomName] = new TileMap(worldWidth, worldHeight, {type: "array", data: retrievedTileMap.data});
      }

      super.start();
      for (const setting of existingSettings) {
        if (setting.roomName) this.createRoom(setting.roomName, setting);
      }

      this.gameEngine.settings = this.settings;
      this.gameEngine.serverEngine = this;
    })();
  }
}