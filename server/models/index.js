import mongoose from 'mongoose';
import TileMap from './TileMap';
import Settings from './Settings';
import User from './User';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/malleary";
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongoose connection error:'));

export {TileMap, Settings, User};