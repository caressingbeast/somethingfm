var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname + '/app',
  entry: {
    app: path.resolve(__dirname, 'public/js/app.js')
  },
  output: {
    path: path.resolve(__dirname, 'public/js'),
    filename: 'app.bundle.js'
  }
};
