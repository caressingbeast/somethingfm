// app/sockets.js

module.exports = function (io, ADMIN_PASSWORD) {
  var messages = [];
  var users = [];

  io.sockets.on('connection', function (socket) {
    var username;

    // populate initial data for new user
    socket.emit('socket connected', {});

    socket.on('refresh socket response', function () {
      // do nothing, keep socket alive
    });

    socket.on('disconnect', function () {
    });
  });

  // ping sockets to keep connections open
  setInterval(function () {
    io.sockets.emit('refresh socket request');
  }, 15000);
};
