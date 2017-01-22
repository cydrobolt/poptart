/* global _, poptart, angular, existingTorrents */

poptart.directive('torrentItem', function() {
    return {
        scope: {
            torrentName: '@'
        },
        replace: true,
        templateUrl: '/directives/torrentItem.html'
    }
})

poptart.controller('IndexCtrl', function($scope, $compile, $http) {
    $scope.torrents = []
    $scope.progressIntervals = []

    $scope.state = {
        showLoader: false
    }

    $scope.init = function() {
        angular.element('#add-torrent').modal()

        // add existing magnet links
        if (_.size(existingTorrents) > 0) {
            _.forOwn(existingTorrents, function (v, k) {
                $scope.torrents.push(k)
                var torrentEl = $scope.getTorrentEl(v.name)
                $scope.appendAndPoll(k, torrentEl)
            })
        }
    }

    $scope.getTorrentEl = function (magnetName) {
        return $compile('<div torrent-item torrent-name=\'' + magnetName + '\'></div>')($scope)
    }

    $scope.appendAndPoll = function(torrentId, newTorrentEl) {
        var $newTorrentEl = $(newTorrentEl).appendTo('.torrents').prop('id', torrentId)

        var updateProgress = setInterval(function () {
            $scope.getProgress(torrentId, $newTorrentEl)
        }, 2000)

        $scope.progressIntervals.push(updateProgress)
    }

    $scope.submitMagnet = function() {
        var magnetLink = angular.element('#magnet-link').val()
        var magnetName = angular.element('#magnet-name').val()

        var newTorrentEl = $scope.getTorrentEl(magnetName)
        $scope.state.showLoader = true

        $http.get('/api/v1/new_torrent?magnet=' + magnetLink + '&name=' + magnetName).then(function (data) {
            $scope.state.showLoader = false
            var torrentId = data.data
            console.log('setting new id for elem')

            $scope.appendAndPoll(torrentId, newTorrentEl)
            $scope.torrents.push(torrentId)
        })

        return magnetLink
    }

    $scope.getProgress = function(torrentId) {
        $http.get('/api/v1/torrent_progress/' + torrentId).then(function (perc) {
            var percComplete = perc.data
            var $torrentEl = $('#' + torrentId)

            // update percentage
            $torrentEl.find('.determinate').css('width', percComplete + '%')
            console.log('torrent', torrentId, 'is ', percComplete)
        })
    }

    $scope.init()
})
