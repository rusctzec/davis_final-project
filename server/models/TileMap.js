import mongoose from 'mongoose';

const tileMapSchema = new mongoose.Schema({
  roomName: String,
  data: [[Number]],
});
const TileMap = new mongoose.model('TileMap', tileMapSchema);

export default TileMap;