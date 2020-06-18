import mongoose from 'mongoose';
import TileMap from './TileMap';
import Settings from './Settings';
import User from './User';

mongoose.connect('mongodb://localhost/malleary', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongoose connection error:'));

export {TileMap, Settings, User};