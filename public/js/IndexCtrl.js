/* global poptart, angular */

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
    }

    $scope.submitMagnet = function() {
        var magnetLink = angular.element('#magnet-link-submit').val()
        var newTorrentEl = $compile('<div torrent-item torrent-name=\'\'></div>')($scope)
        $scope.state.showLoader = true

        $http.get('/api/v1/new_torrent?magnet=' + magnetLink).then(function (data) {
            $scope.state.showLoader = false
            var torrentId = data.data
            console.log('setting new id for elem')

            var $newTorrentEl = $(newTorrentEl).appendTo('.torrents').prop('id', torrentId)

            var updateProgress = setInterval(function () {
                $scope.getProgress(torrentId, $newTorrentEl)
            }, 2000)

            $scope.torrents.push(torrentId)
            $scope.progressIntervals.push(updateProgress)
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
