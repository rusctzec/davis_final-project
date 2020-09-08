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

      let username = socket.request.user.username;

      // get roomname and existing settings
      let player = Object.keys(this.connectedPlayers).map(key => this.connectedPlayers[key]).find(p => p.socket.playerId == socket.playerId);
      if (!player.roomName) return;
      let roomName = player.roomName
      let settings = this.settings[roomName];

      if (!settings.unrestrictedSettings && (!username || !(username == settings.owner || settings.admins.includes(username)))) {return;}
      if (username != settings.owner) {
        delete newSettings.admins; // only owner can assign admins
        delete newSettings.unrestrictedSettings // only owner can toggle unrestricted-settings mode
        if (settings.owner) {
          delete newSettings.owner; // owner can only be assigned by non-owners if there is no owner
        }
      }

      delete newSettings.roomName; // don't want the user to change the roomname on the settings and mess stuff up
      // limit dimensions
      newSettings.worldWidth = isNaN(newSettings.worldWidth) ? 10 : Math.max(10, Math.min(1000, newSettings.worldWidth));
      newSettings.worldHeight = isNaN(newSettings.worldHeight) ? 10 : Math.max(10, Math.min(1000, newSettings.worldHeight));

      // regenerate tileMap if dimensions changed
      let dimensionsChanged = (newSettings.worldWidth != settings.worldWidth || newSettings.worldHeight != settings.worldHeight);
      console.log("DIMENSIONS CHANGED", dimensionsChanged, newSettings.worldWidth, newSettings.worldHeight, settings.worldWidth, settings.worldHeight);
      this.settings[roomName] = {...settings, ...newSettings};
      if (dimensionsChanged) {
        this.gameEngine.tileMaps[player.roomName] = new TileMap(this.settings[player.roomName].worldWidth, this.settings[player.roomName].worldHeight, {type: "array", data: this.gameEngine.tileMaps[player.roomName]})
      }
      // push updated settings to mongodb
      Models.Settings.findOneAndReplace({roomName: roomName}, this.settings[roomName], {upsert: true})
      .then(r => r);

      this.kickBannedUsers(roomName);

      // distribute update to connected clients
      this.io.sockets.emit("settingsUpdate", this.settings);
    });

    socket.on("requestRoom", request => {
      let roomName = request.roomName;
      console.log("requestRoom", request);

      let username = socket.request.user.username;

      // dont allow rooms longer than 6 characters (not including slash)
      if (!roomName || roomName.length > 7) return;
      if (!this.rooms[roomName]) {
        this.createRoom(roomName);
        if (username && request.private) {
          this.settings[roomName].private = true;
          this.settings[roomName].allow.push(username);
        }
      }

      let settings = this.settings[roomName];

      // (room owner and admins bypass restrictions)
      if (settings.owner === username || settings.admins.includes(username)) {}
      // private rooms with an allow-list
      else if (settings.private && !settings.allow.includes(username)) {
        socket.emit("clientError", "This room is private");
        return;
      } // rooms that restrict guests
      else if (!settings.allowGuests && !username) {
        socket.emit("clientError", "This room is for logged-in users only");
        return;
      } // rooms with banned users
      else if (settings.exclude.includes(username)) {
        socket.emit("clientError", "You are not permitted to access this room");
        return;
      }
      // user is permitted to join
      console.log("assigning player to room")
      this.assignPlayerToRoom(socket.playerId, roomName);
      // alert players in the room, and alert the joining player of those players as well
      let socketsDict = this.io.sockets.sockets;
      let sockets = Object.keys(socketsDict).map((i) => {
        return socketsDict[i];
      });

      for (let rsocket of sockets) {
        if (this.gameEngine.playerLocations[rsocket.playerId] == roomName) {
          rsocket.emit("playerEnteredRoom", {username: username, playerId: socket.playerId});
          socket.emit("playerEnteredRoom", {username: rsocket.request.user.username, playerId: rsocket.playerId});
        }
      }

      // convert canvas to png byte buffer
      let png = this.gameEngine.tileMaps[roomName].toPng();
      let buffer = PNG.sync.write(png);

      // save png to the database
      console.log("saving tilemap to mongo")
      Models.TileMap.findOneAndReplace({roomName: roomName}, {roomName: roomName, data: buffer}, {upsert: true})
      .then(r => {console.log("saved!"); return r;});

      console.log("emitting settingsupdate")
      socket.emit("settingsUpdate", {[roomName]: settings});

      // send canvas state over to players as a png when they join a room
      socket.emit("canvasUpdate", {x: 0, y: 0, roomName: roomName, data: this.gameEngine.tileMaps[roomName]});
      socket.emit("canvasUpdate", {type: "png", x: 0, y: 0, roomName: roomName, data: buffer})
    });
  }

  onPlayerDisconnected(socketId, playerId) {
    let roomName = this.gameEngine.playerLocations[playerId];
    delete this.gameEngine.playerLocations[playerId];

    if (!this.gameEngine.world.queryObjects) return;
    let playerObjects = this.gameEngine.world.queryObjects({playerId: playerId});
    playerObjects.forEach(obj => {
      this.gameEngine.removeObjectFromWorld(obj.id);
    });

    let socketsDict = this.io.sockets.sockets;
    let sockets = Object.keys(socketsDict).map((i) => {
      return socketsDict[i];
    });

    for (let rsocket of sockets) {
      if (this.gameEngine.playerLocations[rsocket.playerId] == roomName) {
        rsocket.emit("playerExitedRoom", {username: undefined, playerId: playerId});
      }
    }

    super.onPlayerDisconnected(socketId, playerId)
  }

  // kick any users that shouldn't be in the room according to the settings
  kickBannedUsers(roomName) {

      let settings = this.settings[roomName]
      let playerSockets = [];
      for (let playerId in this.gameEngine.playerLocations) {
        if (this.gameEngine.playerLocations[playerId] == roomName) {
          let socket = this.socketFromPlayerId(playerId);
          if (socket) {playerSockets.push(socket);}
        }
      }

      for (let socket of playerSockets) {
        let username = socket.request.user.username;
        // (room owner and admins bypass restrictions)
        if (settings.owner === username || settings.admins.includes(username)) {}
        // private rooms with an allow-list
        else if (settings.private && !settings.allow.includes(username)) {
          socket.emit("clientError", "This room is now private or you have been removed from its members list");
          continue;
        } // rooms that restrict guests
        else if (!settings.allowGuests && !username) {
          socket.emit("clientError", "This room's admins have disabled access for unregistered users");
          continue;
        } // rooms with banned users
        else if (settings.exclude.includes(username)) {
          socket.emit("clientError", "You have been kicked from the room");
          continue;
        }
      }
  }

  handleCanvasUpdate(update, playerId) {
    let socketsDict = this.io.sockets.sockets;
    let sockets = Object.keys(socketsDict).map((i) => {
      return socketsDict[i];
    });
    let playerSocket = this.socketFromPlayerId(playerId);
    let roomName = this.gameEngine.playerLocations[playerId] || update.roomName;
    let settings = this.settings[roomName]; if (!settings) {return;}
    let username = playerSocket && playerSocket.request.user.username;

    if (playerId) {
      if (settings.restrictDrawing && !settings.drawers.includes(username) && !settings.admins.includes(username) && settings.owner != username) return;
    }
    // remove unneccesary data and add id
    let update2 = {x: update.x, y: update.y, size: update.size, fill: update.fill, data: update.data,
      id: playerId,
      name: playerSocket && playerSocket.request.user.username || (playerId == undefined ? "" : `guest ${playerId}`),
      roomName: roomName,
    };

    this.gameEngine.updateTileMap(update2);

    // emit only to sockets in the room that the canvas update happened

    for (let socket of sockets) {
      if (this.gameEngine.playerLocations[socket.playerId] == roomName) {
        socket.emit("canvasUpdate", update2);
      }
    }
  }

  socketFromPlayerId(playerId) {
    let sockets = this.io.sockets.sockets;
    let socketId = Object.keys(sockets).find((i) => {
      return sockets[i].playerId == playerId;
    });
    return sockets[socketId];
  }

  // return info about the rooms and the amount of players in each (for the gallery display page to show)
  summarizeRooms() {
    let arr = [];
    let roomNames = Object.keys(this.rooms);
    if (this.settings) roomNames.push(...Object.keys(this.settings));
    for (let roomName of new Set(roomNames)) { // (Set removes duplicates)
      if (roomName == "/lobby") continue; // don't include the /lobby room it's just a byproduct of lance's functionality
      if (this.settings[roomName].private) continue; // don't display private rooms

      arr.push(this.summarizeRoom(roomName));
    }
    return arr;
  }
  summarizeRoom(roomName) {
    if (!this.settings[roomName]) {return {};}
    let players = 0;
    let playerList = [];
    for (let playerId of Object.keys(this.gameEngine.playerLocations)) {
      if (this.gameEngine.playerLocations[playerId] == roomName) {
        players++;
        let socket = this.socketFromPlayerId(playerId);
        let username = socket && socket.request.user.username;
        playerList.push({
          username: username,
          playerId: playerId,
        })
      }
    }
    return {
      name: roomName,
      width: this.settings[roomName].worldWidth,
      height: this.settings[roomName].worldHeight,
      allowGuests: this.settings[roomName].allowGuests,
      players: players,
      playerList: playerList,
    };
  }

  // generates a settings object with default settings
  getDefaultSettings() {
    return {
      worldWidth: 150,
      worldHeight: 150,
      topWall: false,
      bottomWall: false,
      leftWall: false,
      rightWall: false,
      unrestrictedSettings: false,
      disableProjectiles: false,
      restrictDrawing: false,
      drawers: [],
      private: false,
      allow: [],
      admins: [],
      exclude: [],
      allowGuests: true,
      owner: "",
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
        new PNG({filterType: 4}).parse(item.data, (error, data) => {
          if (error) return;
          retrievedTileMap.data = TileMap.decodePng(data);

          if (!retrievedTileMap.data[0]) return;
          let worldWidth = retrievedTileMap.data.length;
          let worldHeight = retrievedTileMap.data[0].length;
          let settings = this.settings[retrievedTileMap.roomName];
          if (settings) {settings.worldHeight = worldHeight; settings.worldWidth = worldWidth;}
          this.gameEngine.tileMaps[retrievedTileMap.roomName] = new TileMap(worldWidth, worldHeight, {type: "array", data: retrievedTileMap.data});
        });
      }

      super.start();
      console.log("Server engine started")
      for (const setting of existingSettings) {
        if (setting.roomName) this.createRoom(setting.roomName, setting);
      }

      this.gameEngine.settings = this.settings;
      this.gameEngine.serverEngine = this;
    })();
  }
}