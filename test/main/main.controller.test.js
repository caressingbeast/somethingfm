describe('MainCtrl', function () {

  beforeEach(module('somethingfm'));

  // placeholders
  var $controller;
  var $httpBackend;
  var $scope;

  // mocks
  var SocketService;
  var VideoService;

  var searchResults = {
    data: {
      items: [
        {
          title: 'Title'
        }
      ]
    }
  };

  var sandbox;
  var socketEvents = {};

  beforeEach(inject(function(_$controller_, _$httpBackend_, $rootScope) {
    $httpBackend = _$httpBackend_;
    $scope = $rootScope.$new();

    sandbox = sinon.sandbox.create();

    SocketService = {
      on: function (evt, callback) { socketEvents[evt] = callback },
      emit: sandbox.stub()
    };

    VideoService = {
      getYoutube: sandbox.stub(),
      launchPlayer: sandbox.stub(),
      search: sandbox.stub()
    };

    $controller = _$controller_('MainCtrl', {
      $scope: $scope,
      SocketService: SocketService,
      VideoService: VideoService
    });

    $scope.$apply();
  }));

  afterEach(function () {
    sandbox.restore();
  });

  it('should exist', function () {
    expect($controller).toBeDefined();
  });

  describe('.saveUser', function () {

    it('ignores empty or non-unique usernames', function () {
      var username = 'username';

      spyOn(SocketService, 'emit').and.callThrough();

      $controller.users = [username];
      $controller.usersLower = [username];

      // no username
      $controller.saveUser();

      // non-unique username
      $controller.username = username;
      $controller.saveUser();

      expect(SocketService.emit).not.toHaveBeenCalled();
    });

    it('calls SocketService.emit with valid username', function () {
      var username = 'username';

      spyOn(SocketService, 'emit').and.callThrough();

      $controller.username = username;
      $controller.saveUser();

      expect(SocketService.emit).toHaveBeenCalledWith('login request', username);
    });
  });

  describe('.loadVideo', function () {

    it('calls VideoService.launchPlayer', function () {
      var currentVideo = { property: true };

      spyOn(VideoService, 'launchPlayer').and.callThrough();

      $controller.currentVideo = currentVideo;
      $controller.loadVideo();

      expect(VideoService.launchPlayer).toHaveBeenCalledWith(currentVideo);
    });
  });

  describe('.search', function () {

    it('calls VideoService.search and sets settings', inject(function ($q) {
      var query = 'query';

      VideoService.search.returns($q.when(searchResults));

      $controller.query = query;
      $controller.search();

      $scope.$apply();

      expect(VideoService.search.calledWith(query)).toBe(true);
      expect($controller.searchQuery).toEqual(query);
      expect($controller.results).toEqual(searchResults.data.items);
    }));
  });

  describe('.add', function () {

    it('returns if video exists in playlist', function () {
      var video = {
        id: {
          videoId: '1'
        }
      };

      spyOn(SocketService, 'emit').and.callThrough();

      $controller.playlist = [video];
      $controller.add(0, video);

      expect(SocketService.emit).not.toHaveBeenCalled();
    });

    it('removes video from search results, adds username, and calls SocketService.emit', function () {
      var username = 'username';
      var video = {
        id: {
          videoId: '1'
        }
      };

      spyOn(SocketService, 'emit').and.callThrough();

      $controller.results = [video];
      $controller.username = username;
      $controller.add(0, video);

      expect($controller.results.length).toEqual(0);
      expect(SocketService.emit).toHaveBeenCalledWith('video added', $.extend({}, video, { username: username }));
    });
  });

  describe('.clearSearch', function () {

    it('clears search results', function () {
      $controller.query = 'query';
      $controller.searchQuery = 'searchQuery';
      $controller.results = [{}];
      $controller.showResults = true;

      $controller.clearSearch();

      expect($controller.query).toEqual('');
      expect($controller.searchQuery).toEqual('');
      expect($controller.results).toEqual([]);
      expect($controller.showResults).toEqual(false);
    });
  });

  describe('.delete', function () {

    it('calls SocketService.emit', function () {
      var video = {
        id: {
          videoId: '1'
        }
      };

      spyOn(SocketService, 'emit').and.callThrough();

      $controller.delete(video);

      expect(SocketService.emit).toHaveBeenCalledWith('video deleted', video);
    });
  });

  describe('.postMessage', function () {

    it('ignores empty messages', function () {
      spyOn(SocketService, 'emit').and.callThrough();

      $controller.postMessage();

      expect(SocketService.emit).not.toHaveBeenCalled();
    });

    it('calls SocketService.emit with valid message', function () {
      var message = {
        text: 'message',
        username: 'username'
      };

      spyOn(SocketService, 'emit').and.callThrough();

      $controller.message = message.text;
      $controller.username = message.username;
      $controller.postMessage();

      expect($controller.message).toEqual('');
      expect(SocketService.emit).toHaveBeenCalledWith('message posted', message);
    });
  });

  describe('SocketService listeners', function () {

    describe('"socket connected"', function () {

      it('updates controller data with passed data', function () {
        var data = {
          messages: [ { message: 'message' }],
          playlist: [ { videoId: '1' }],
          users: ['username']
        };

        socketEvents['socket connected'](data);

        expect($controller.messages).toEqual(data.messages);
        expect($controller.playlist).toEqual(data.playlist);
        expect($controller.users).toEqual(data.users);
      });
    });

    describe('"login error"', function () {

      it('displays an alert', function () {
        spyOn(window, 'alert').and.callThrough();

        socketEvents['login error']();

        expect(window.alert).toHaveBeenCalled();
      });
    });

    describe('"login success"', function () {

      it('sets showLogin and calls SocketService.emit', function () {
        spyOn(SocketService, 'emit').and.callThrough();

        expect($controller.showLogin).toBe(true);

        socketEvents['login success']();

        expect($controller.showLogin).toBe(false);
        expect(SocketService.emit).toHaveBeenCalledWith('current video request');
      });
    });

    describe('"user connected"', function () {

      it('adds username to users and usersLower', function () {
        var username = 'Username';

        socketEvents['user connected'](username);

        expect($controller.users.indexOf(username)).toEqual(0);
        expect($controller.usersLower.indexOf(username.toLowerCase())).toEqual(0);
      });
    });

    describe('"current video response"', function () {

      it('updates currentVideo and calls VideoService.launchPlayer', function () {
        var video = {
          startSeconds: 17,
          video: {
            videoId: '1'
          }
        };

        spyOn(VideoService, 'launchPlayer').and.callThrough();

        socketEvents['current video response'](video);

        expect($controller.currentVideo.startSeconds).toEqual(20);
        expect(VideoService.launchPlayer).toHaveBeenCalled();
      });
    });

    describe('"add video to playlist"', function () {

      it('adds video to playlist and calls VideoService.launchPlayer if only video', function () {
        var video = {
          video: {
            videoId: '1'
          }
        };

        spyOn(VideoService, 'launchPlayer').and.callThrough();

        expect($controller.playlist.length).toEqual(0);

        socketEvents['add video to playlist'](video);

        expect($controller.playlist.length).toEqual(1);
        expect($controller.currentVideo.video).toEqual(video);
        expect(VideoService.launchPlayer).toHaveBeenCalled();
      });
    });

    describe('"delete video from playlist"', function () {

      it('deletes video from playlist', function () {
        var video = {
          id: {
            videoId: '1'
          }
        };

        $controller.playlist = [video];

        socketEvents['delete video from playlist'](video);

        expect($controller.playlist.length).toEqual(0);
      });
    });

    describe('"add message"', function () {

      it('adds new message to messages', function () {
        var message = {
          text: 'message',
          username: 'username'
        };

        socketEvents['add message'](message);

        expect($controller.messages[0]).toEqual(message);
      });
    });

    describe('"play next video"', function () {

      it('removes current video from playlist and adds to playedVideos', function () {
        var video = {
          id: {
            videoId: '1'
          }
        };

        spyOn(VideoService, 'launchPlayer').and.callThrough();

        $controller.playlist = [video];

        socketEvents['play next video'](video);

        expect($controller.playedVideos.length).toEqual(1);
        expect($controller.playlist.length).toEqual(0);
        expect(VideoService.launchPlayer).not.toHaveBeenCalled();
      });

      it('updates currentVideo and calls VideoService.launchPlayer if playlist is not empty', function () {
        var videos = [
          {
            id: {
              videoId: '1'
            }
          },
          {
            id: {
              videoId: '2'
            }
          }
        ];

        spyOn(VideoService, 'launchPlayer').and.callThrough();

        $controller.playlist = videos;

        socketEvents['play next video'](videos[0]);

        expect($controller.currentVideo.video.id.videoId).toEqual('2');
        expect($controller.playedVideos.length).toEqual(1);
        expect($controller.playlist.length).toEqual(1);
        expect(VideoService.launchPlayer).toHaveBeenCalled();
      });
    });

    describe('"user disconnected"', function () {

      it('deletes user from users', function () {
        var username = 'username';

        $controller.users = [username];
        $controller.usersLower = [username];

        socketEvents['user disconnected'](username);

        expect($controller.users.length).toEqual(0);
        expect($controller.usersLower.length).toEqual(0);
      });
    });

    describe('"socket refresh request"', function () {

      it('calls /refresh and calls SocketService.emit', function () {
        var emit = 'emit';

        $httpBackend.when('GET', '/refresh').respond(emit);
        spyOn(SocketService, 'emit').and.callThrough();

        socketEvents['socket refresh request']();

        $httpBackend.flush();

        expect(SocketService.emit).toHaveBeenCalledWith(emit);
      });
    });
  });
});
