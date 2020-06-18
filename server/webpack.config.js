const path = require('path');
const nodeExternals = require('webpack-node-externals');

process.env.NODE_ENV = 'production';
process.env.BABEL = 'production';

module.exports = function(env) {
  return {
    target: 'node',
    mode: 'production',
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