var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'source-map',
  // entry: './src/content-scripts/controller.jsx',
  entry: {
    client: './src/content-scripts/controller.jsx',
    background: './src/background/background.js'
  },
  output: { path: 'build/', filename: 'bundle.[name].js' },
  module: {
    loaders: [
      {
        test: /.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react']
        }
      }
    ]
  },
};
