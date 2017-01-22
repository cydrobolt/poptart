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
        var magnetLink = angular.element('#magnet-link').val()
        var magnetName = angular.element('#magnet-name').val()

        var newTorrentEl = $compile('<div torrent-item torrent-name=\'' + magnetName + '\'></div>')($scope)
        $scope.state.showLoader = true

        $http.get('/api/v1/new_torrent?magnet=' + magnetLink + '&name=' + magnetName).then(function (data) {
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

    $scope.deleteTorrent = function(torrentId) {
    	$http.get('/api/v1/remove_torrent/' + torrentId).then(function (data) {
    		$scope.progressIntervals.clear();
    		var index = $scope.torrents.indexOf(torrentId)
    		$scope.torrents.splice(index, 1)
    		$('#' + torrentId).remove()
    		console.log("torrent " + torrentId + " removed")
    	})

    }

    $scope.downloadTorrent = function(torrentId) {

    }

    $scope.init()
})
