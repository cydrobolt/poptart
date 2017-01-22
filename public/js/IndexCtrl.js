/* global _, poptart, angular, existingTorrents */

poptart.directive('torrentItem', function($compile, $timeout) {
    return {
        scope: {
            torrentName: '@',
            torrentId: '@'
        },
        replace: true,
        templateUrl: '/directives/torrentItem.html',
        link: function (scope) {
            $timeout(function () {
                scope.deleteTorrent = function () {
                    scope.$parent.deleteTorrent(scope.torrentId)
                }
            })
        }
    }
})

poptart.controller('IndexCtrl', function($scope, $rootScope, $compile, $http) {
    $scope.torrents = {}
    $scope.progressIntervals = {}

    $scope.state = {
        showLoader: false
    }

    $scope.init = function() {
        angular.element('#add-torrent').modal()

        // add existing magnet links
        if (_.size(existingTorrents) > 0) {
            _.forOwn(existingTorrents, function (v, k) {
                $scope.torrents.push[k] = true
                var torrentEl = $scope.getTorrentEl(v.name)
                $scope.appendAndPoll(k, torrentEl)
            })
        }
    }

    $scope.getTorrentEl = function (torrentId, magnetName) {
        return $compile('<div torrent-item torrent-id=\'' + torrentId + '\' torrent-name=\'' + magnetName + '\' delete-torrent=\'deleteTorrent\'></div>')($scope)
    }

    $scope.appendAndPoll = function(torrentId, newTorrentEl) {
        var $newTorrentEl = $(newTorrentEl).appendTo('.torrents').prop('id', torrentId)

        var updateProgress = setInterval(function () {
            $scope.getProgress(torrentId, $newTorrentEl)
        }, 2000)

        $scope.progressIntervals[torrentId] = updateProgress
    }

    $scope.getTorrentCard = function(torrentId) {
        return $('div[torrent-id=\'' + torrentId + '\']')
    }

    $scope.submitMagnet = function() {
        var magnetLink = angular.element('#magnet-link').val()
        var magnetName = angular.element('#magnet-name').val()

        $scope.state.showLoader = true

        $http.get('/api/v1/new_torrent?magnet=' + magnetLink + '&name=' + magnetName).then(function (data) {
            $scope.state.showLoader = false
            var torrentId = data.data
            console.log('setting new id for elem')

            var newTorrentEl = $scope.getTorrentEl(torrentId, magnetName)
            $scope.appendAndPoll(torrentId, newTorrentEl)

            $scope.torrents[torrentId] = true
        })

        return magnetLink
    }

    $scope.getProgress = function(torrentId) {
        $http.get('/api/v1/torrent_progress/' + torrentId).then(function (perc) {
            var percComplete = perc.data
            var $torrentEl = $scope.getTorrentCard(torrentId)

            // update percentage
            $torrentEl.find('.determinate').css('width', percComplete + '%')
            console.log('torrent', torrentId, 'is ', percComplete)
        })
    }

    $scope.deleteTorrent = function(torrentId) {
        console.log("clicked")
        console.log(torrentId)
        $http.get('/api/v1/remove_torrent/' + torrentId).then(function (data) {
            clearInterval($scope.progressIntervals[torrentId])
            delete $scope.torrents[torrentId]
            console.log("0")
            console.log('removing', $scope.getTorrentCard(torrentId))
            $scope.getTorrentCard(torrentId).remove()
            console.log("1")
            console.log("torrent " + torrentId + " removed")
        })
    }

    $scope.downloadTorrent = function(torrentId) {

    }

    $scope.init()
})
