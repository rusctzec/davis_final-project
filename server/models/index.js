import mongoose from 'mongoose';
import TileMap from './TileMap';
import Settings from './Settings';
import User from './User';

if (!process.env.MONGODB_URI) console.error("The environment variable MONGODB_URI must be set to a valid MongoDB URI");
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongoose connection error:'));

export {TileMap, Settings, User};