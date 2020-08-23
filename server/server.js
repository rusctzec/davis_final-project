import express from "express";
import expressSession from "express-session";
import cookieParser from "cookie-parser";
import socketIO from "socket.io"
import path from "path";
import passport from './passport';
import passportSocketIo from 'passport.socketio';
import connectMongo from 'connect-mongo';
import mongoose from 'mongoose';


const MongoStore = connectMongo(expressSession);
const mongoStore = new MongoStore({ mongooseConnection: mongoose.connection});

// Game Server
import ExServerEngine from "./lance/ExServerEngine";
import ExGameEngine from "../src/common/ExGameEngine";
import * as db from "./models";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(expressSession({
  key: 'express.sid',
  secret: 'express-session-secret',
  store: mongoStore,
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "../build")));

const requestHandler = app.listen({ port: PORT }, () =>
  console.log(`Listening on ${PORT}`)
);

const io = socketIO(requestHandler);

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'express.sid',
  secret: 'express-session-secret',
  store: mongoStore,
  success: (data, accept) => accept(), // accept connections whether authorized or not
  fail: (data, message, error, accept) => accept(),
}));


// Game Instances
const gameEngine = new ExGameEngine();
const serverEngine = new ExServerEngine(io, gameEngine, {
  debug: {},
  updateRate: 6,
  timeoutInterval: 0
});

// start the game
serverEngine.start();

// routes
app.get("/api/games", (req, res) => {
  res.json(serverEngine.summarizeRooms());
});

app.get("/api/games/:roomName", (req, res) => {
  res.json(serverEngine.summarizeRoom('/'+req.params.roomName));
});

app.get("/thumbnails/:roomName", (req, res) => {
  let roomName = '/'+req.params.roomName.replace(/\.png$/, '');
  db.TileMap.findOne({roomName: roomName})
  .then(r => {
    if (r == null) {res.status(404).send(); return;}
    let data = r.toObject().data.buffer;
    if (data[0] == 0x00) {res.status(500).send(); return;} // buffer shouldnt be sent (png magic number should begin with 0x89)
    res.set('Content-Type', 'image/png');
    res.write(data, 'binary');
    res.end(null, 'binary');
  })
  .catch(err => {
    res.status(500).send();
    console.log(err);
  });
});

app.post("/api/login",
  passport.authenticate('local'),
  (req, res) => {
    console.log("User authenticated:", req.user.name);
    res.status(200).json({});
  }
);

app.post("/api/signup", (req, res) => {

  // using passport-local-mongoose
  db.User.register(
    new db.User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      console.log("User.register callback...", err, user);
      // 1 or more error messages may be contained in `err.errors` so it is neccesarry to collect them and send them to the user if they exist
      if (err) {
        let msg = Object.keys(err.errors || {}).reduce((acc, cur) => {
          return acc + "\n" + (err.errors[cur].reason || err.errors[cur].message)
        }, "").trim();
        return res.status(403).json({error: msg || err.message});
      }
      passport.authenticate('local')(req, res, () => {
        res.status(200).json({});
      });
    }
  )

});

app.get("/api/logout", function(req, res) {
  if (req.user) {
    console.log(req.user.username, "logged out");
    req.logout();
  }
  res.status(200).json({});
});

app.get("/api/userdata", (req, res) => {
  if (!req.user) {
    res.status(401).json({error: 'not authenticated'});
  } else {
    res.json(req.user);
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});