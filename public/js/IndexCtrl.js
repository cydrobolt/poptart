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
    $scope.init = function() {
    	angular.element("#add-torrent").modal()
    }
    

    $scope.submitMagnet = function() {
    	var magnetLink = angular.element("#magnet-link-submit").val()
    	var newTorrentEl = $compile('<div torrent-item torrent-name="helo"></div>')($scope)

    	$('.torrents').append(newTorrentEl)

    	return magnetLink
    }

    $scope.init()

    $scope.getProgress = function(torrentId) {
    	$http.get("/api/v1/torrent_progress/" + torrentId).then(function (perc) {
    		console.log("torrent", torrentId, "is ", perc)
    	})
    }

    var torrents = [];
    $http.get("/api/v1/new_torrent").then(function (data) {
    	var torrentId = data;
    	var updateProgress = setInterval(function () {
    		$scope.getProgress(torrentId)
    	}, 2000)
    })

})
