import express from "express";
import expressSession from "express-session";
import socketIO from "socket.io"
import path from "path";
import passport from './passport';

// Game Server
import ExServerEngine from "./lance/ExServerEngine";
import ExGameEngine from "../src/common/ExGameEngine";
import { User } from "./models";

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(expressSession({secret: 'express-session-secret', resave: false, saveUninitialized: false}))
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, "../build")));

const requestHandler = app.listen({ port: PORT }, () =>
  console.log(`Listening on ${PORT}`)
);

const io = socketIO(requestHandler);

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

app.get("/thumbnails/:roomName", (req, res) => {
  res.sendFile(path.join(__dirname, `/tmp/rooms/${req.params.roomName}`), (err => void err));
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
  User.register(
    new User({ username: req.body.username }),
    req.body.password,
    (err, user) => {
      console.log("User.register callback...", err, user);
      if (err) {
        return res.status(403).json({error: err.message});
      }
      passport.authenticate('local')(req, res, () => {
        res.status(200).json({});
      });
    }
  )

});

app.get("/api/logout", function(req, res) {
  req.logout();
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