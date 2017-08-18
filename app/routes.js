// app/routes.js

var path = require('path');

module.exports = function (app) {

  app.get('/refresh', function (req, res) {
    return res.send();
  });

  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
};
