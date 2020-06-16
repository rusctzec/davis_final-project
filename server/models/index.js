import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost/malleary', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongoose connection error:'));

const tileMapSchema = new mongoose.Schema({
  roomName: String,
  data: [[Number]],
});

const settingsSchema = new mongoose.Schema({
  roomName: String,
  worldWidth: Number,
  worldHeight: Number,
  drawers: [String],
  admins: [String],
  walls: Boolean,
  floor: Boolean,
  allow: [String],
  exclude: [String],
});

const TileMap = new mongoose.model('TileMap', tileMapSchema);
const Settings = new mongoose.model('Settings', settingsSchema);

export {TileMap, Settings};