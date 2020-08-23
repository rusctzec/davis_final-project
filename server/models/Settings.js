import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  roomName: String,
  worldWidth: Number,
  worldHeight: Number,
  topWall: Boolean,
  bottomWall: Boolean,
  leftWall: Boolean,
  rightWall: Boolean,
  disableProjectiles: Boolean,
  restrictDrawing: Boolean,
  drawers: [String],
  private: Boolean,
  allow: [String],
  admins: [String],
  exclude: [String],
  allowGuests: Boolean,
  owner: String,
});

const Settings = new mongoose.model('Settings', settingsSchema);

export default Settings;