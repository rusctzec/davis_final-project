import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  roomName: String,
  worldWidth: Number,
  worldHeight: Number,
  drawers: [String],
  admins: [String],
  topWall: Boolean,
  bottomWall: Boolean,
  leftWall: Boolean,
  rightWall: Boolean,
  allow: [String],
  exclude: [String],
});

const Settings = new mongoose.model('Settings', settingsSchema);

export default Settings;