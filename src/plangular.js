
// Plangular
// AngularJS Version
//boop

'use strict';

var plangular = angular.module('plangular', []);
var resolve = require('soundcloud-resolve-jsonp');
var Player = require('audio-player');
var hhmmss = require('hhmmss');

plangular.directive('plangular', ['$timeout', '$rootScope', 'plangularConfig', function($timeout, $rootScope, plangularConfig) {

  var client_id = plangularConfig.clientId;
  var player = new Player();

  return {

    restrict: 'A',
    scope: true,

    link: function(scope, elem, attr) {

      var src = attr.plangular;
      scope.player = player;
      scope.audio = player.audio;
      scope.currentTime = 0;
      scope.duration = 0;
      scope.track = {};
      scope.index = 0;
      scope.playlist;
      scope.tracks = [];
      scope.states = {
        paused: false
      };

      if (!client_id) {
        var message = [
          'You must provide a client_id for Plangular',
          '',
          'Example:',
          "var app = angular.module('app', ['plangular'])",
          "  .config(function(plangularConfigProvider){",
          "    plangularConfigProvider.clientId = '[CLIENT_ID]';",
          "  });",
          '',
          'Register for app at https://developers.soundcloud.com/',
        ].join('\n');
        console.error(message);
        return false;
      }

      function createSrc(track) {
        if (track.stream_url) {
          var sep = track.stream_url.indexOf('?') === -1 ? '?' : '&'
          track.src = track.stream_url + sep + 'client_id=' + client_id;
        }
        return track;
      }

      // Not used currently
      function setSrc() {
        resolve({ url: src, client_id: client_id }, function(err, res) {
          if (err || typeof res === 'undefined') {
            scope.$apply(function() {
              console.error(err);
              $rootScope.$broadcast("plangular.track.error", src);
              return;
            });
          }
          scope.$apply(function() {
            if(typeof res === 'undefined') {
              console.error("undefined dawg");
              $rootScope.$broadcast("plangular.track.error", src);
              return;
            }
            console.log("track src result", res);
            scope.track = createSrc(res);
            $rootScope.$broadcast("plangular.track.loaded", src);
            if (Array.isArray(res)) {
              scope.tracks = res.map(function(track) {
                return createSrc(track);
              });
            } else if (res.tracks) {
              scope.playlist = res;
              scope.tracks = res.tracks.map(function(track) {
                return createSrc(track);
              });
            }
          });
        });
      }

      function getSrc(trackId) {
        return "https://api.soundcloud.com/tracks/" + trackId + "/stream?client_id=" + client_id;
      }

      function setSrcPlay(trackId, dontPlay) {
        //scope.$apply(function() {
          scope.track.src = getSrc(trackId);
          scope.track.srcId = trackId;
        if(!dontPlay && !scope.states.paused) {
          scope.play();
        }
          //if(attr.playing == 'true' && attr.trackId == scope.track.trackId) {
          //  scope.play();
          //} else {
          //  console.log("shouldn't start playing");
          //}
        //});
      }

      function _watchAttr() {

        scope.$watch(function() {
          return attr.plangular;
        }, function() {
          console.log("attr for plangular has been updated", attr.plangular);
          if(!attr.plangular) return;
          src = attr.plangular;
          setSrc();
        });

        if (src) {
          //setSrc();
        }

      }

      scope.play = function(i) {
        scope.states.paused = false;
        if (typeof i !== 'undefined' && scope.tracks.length) {
          scope.index = i;
          scope.track = scope.tracks[i];
        }
        player.play(scope.track.src);
      };

      scope.pause = function() {
        scope.states.paused = true;
        player.pause();
      };

      //scope.playNew = function(src) {
      //  if (typeof i !== 'undefined' && scope.tracks.length) {
      //    scope.index = i;
      //    scope.track = scope.tracks[i];
      //  }
      //  player.playPause(scope.track.src);
      //};

      scope.playPause = function(i) {
        if (typeof i !== 'undefined' && scope.tracks.length) {
          scope.index = i;
          scope.track = scope.tracks[i];
        }
        player.playPause(scope.track.src);
      };

      scope.previous = function() {
        if (scope.tracks.length < 1) { return false }
        if (scope.index > 0) {
          scope.index--;
          scope.play(scope.index);
        }
      };

      scope.next = function() {
        if (scope.tracks.length < 1) { return false }
        if (scope.index < scope.tracks.length - 1) {
          scope.index++;
          scope.play(scope.index);
        } else {
          scope.pause();
        }
      };

      scope.setSrcPlay = function(trackId, dontPlay) {
        scope.states.paused = false;
        setSrcPlay(trackId, dontPlay);
      }

      scope.seek = function(e) {
        if (scope.track.src === player.audio.src) {
          scope.player.seek(e);
        }
      };

      player.audio.addEventListener('timeupdate', function() {
        if (!scope.$$phase && scope.track.src === player.audio.src) {
          $timeout(function() {
            scope.currentTime = player.audio.currentTime;
            scope.duration = player.audio.duration;
          });
        }
      });

      player.audio.addEventListener('ended', function() {
        if (scope.track.src === player.audio.src) {
          scope.next();
          $rootScope.$broadcast("plangular.track.ended");
        }
      });

    }

  }

}]);

plangular.filter('hhmmss', function() {
  return hhmmss;
});

plangular.provider('plangularConfig', function() {
  var self = this;
  this.$get = function() {
    return {
      clientId: self.clientId
    };
  };
});


module.exports = 'plangular';
