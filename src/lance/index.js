import querystring from "query-string";
import ExClientEngine from "./ExClientEngine";
import ExGameEngine from "../common/ExGameEngine";
const qsOptions = querystring.parse(window.location.search);

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
  // traceLevel: 1,
  delayInputCount: 5,
  scheduler: "render-schedule",
  syncOptions: {
    sync: qsOptions.sync || "extrapolate",
    localObjBending: 0.8,
    remoteObjBending: 1.0,
    bendingIncrements: 6
  }
};
let options = Object.assign(defaults, qsOptions);

// create a client engine and a game engine
const gameEngine = new ExGameEngine(options);
const clientEngine = new ExClientEngine(gameEngine, options);

export default clientEngine;
