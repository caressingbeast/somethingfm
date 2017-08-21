// app/routes.js

var path = require('path');

function randomString (length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

module.exports = function (app) {

  app.get('/refresh', function (req, res) {
    return res.send({
      emit: 'socket refresh response',
      text: randomString(9)
    });
  });

  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
  });
};
