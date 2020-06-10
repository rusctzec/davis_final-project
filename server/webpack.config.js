const path = require('path');
const nodeExternals = require('webpack-node-externals');

// build configuration is a mess
// initially i was getting the server here built perfectly fine using a globally installed webpack alongside CRA, and using this separate config file
// but the client, despite everything working fine in react's webpack dev server, lance breaks in the production version of the client for unknown reasons. i found that someone early last month in the lance.gg slack seemed to be having a similar issue, last thing they said on the subject was that they fixed it by downgrading webpack. that's not really a choice for me given i have to use react, and if i ejected and tried to revert all the configuration to an earlier version of webpack i doubt that would end well. i briefly tried using an earlier version of CRA in the hope that it used an earlier version of webpack that wouldn't break lance in the bundling process, to no avail.
// i don't have the time to spend any longer on this, i just have to forget about it for now and continue working on the dev version.

module.exports = function(env) {
  return {
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
    },
    entry: './server/server.js',
    output: {
      path: path.resolve(path.join(__dirname, '..'), 'dist-server'),
      filename: 'index.js'
    },
    externals: [nodeExternals()],
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
          }
        }
      ]
    }
  }
}