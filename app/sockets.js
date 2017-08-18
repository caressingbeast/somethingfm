// app/sockets.js

module.exports = function (io, ADMIN_PASSWORD) {
  var messages = [];
  var playedVideos = [];
  var playlist = [];
  var users = [];
  var usersLower = [];
  var userVideos = {};
  var activeVideo;

  function clearData () {
    activeVideo = null;
    messages = [];
    playedVideos = [];
    playlist = [];
    users = [];
    usersLower = [];
    userVideos = {};
  }

  function getUsernameIndex (username) {
    return usersLower.indexOf(username.toLowerCase());
  }

  function getVideoIndex (video) {
    return playlist.map(function (v) { return v.id.videoId; }).indexOf(video.id.videoId);
  }

  io.sockets.on('connection', function (socket) {
    var username;

    // fresh data for first connection
    if (!users.length) {
      clearData();
    }

    // only allow 15 users
    if (users.length >= 15) {
      return;
    }

    // send initial data to new user
    socket.emit('socket connected', {
      messages: messages,
      playedVideos: playedVideos,
      playlist: playlist,
      users: users
    });

    socket.on('login request', function (requestedUsername) {

      // not a valid username
      if (!requestedUsername) {
        socket.emit('login error');
        return;
      }

      // not a unique username
      if (getUsernameIndex(requestedUsername) > -1) {
        socket.emit('login error');
        return;
      }

      username = requestedUsername;
      users.push(requestedUsername);
      usersLower.push(requestedUsername.toLowerCase());

      io.sockets.emit('user connected', username);
      socket.emit('login success');
    });

    socket.on('current video request', function () {
      if (!activeVideo) {
        return;
      }

      socket.emit('current video response', {
        startSeconds: activeVideo.startSeconds,
        video: activeVideo
      });
    });

    socket.on('update video response', function (data) {
      activeVideo = data;
      userVideos[username] = data;
    });

    socket.on('video added', function (video) {
      if (getVideoIndex(video) > -1) {
        return;
      }

      playlist.push(video);

      io.sockets.emit('add video to playlist', video);
    });

    socket.on('video deleted', function (video) {
      var index = getVideoIndex(video);

      if (index > -1) {
        playlist.splice(index, 1);
      }

      io.sockets.emit('delete video from playlist', video);
    });

    socket.on('message posted', function (message) {
      if (!message) {
        return;
      }

      messages.push(message);

      io.sockets.emit('add message', message);
    });

    socket.on('socket refresh response', function () {
      // do nothing, keep socket alive
    });

    socket.on('disconnect', function () {

      if (!username) {
        return;
      }

      var index = getUsernameIndex(username);
      users.splice(index, 1);
      usersLower.splice(index, 1);

      if (!users.length) {
        clearData();
      }

      io.sockets.emit('user disconnected', username);
    });
  });

  // ping sockets to keep connections open
  setInterval(function () {
    io.sockets.emit('socket refresh request');
  }, 15000);
};
