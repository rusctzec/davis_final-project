import express from "express";
import socketIO from "socket.io"
import path from "path";

// Game Server
import ExServerEngine from "./lance/ExServerEngine";
import ExGameEngine from "../src/common/ExGameEngine";

const PORT = process.env.PORT || 3001;
const app = express();

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
