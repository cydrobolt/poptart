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
                scope.getFiles = function() {
                	scope.$parent.getFiles(scope.torrentId)
                }
                scope.postDLSpeeds = function() {
                	scope.$parent.postDLSpeeds(scope.torrentId)
                }
            })
        }
    }
})

poptart.controller('IndexCtrl', function($scope, $rootScope, $compile, $http) {
    $scope.torrents = {}
    $scope.progressIntervals = {}
    $scope.downloadSpeedIntervals = {}

    $scope.state = {
        showLoader: false
    }

    $scope.init = function() {
        angular.element('#add-torrent').modal()

        // add existing magnet links
        if (_.size(existingTorrents) > 0) {
            _.forOwn(existingTorrents, function (v, k) {
                $scope.torrents[k] = true
                var torrentEl = $scope.getTorrentEl(k, v.name)
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

        var downloadProgress = setInterval(function () {
        	$scope.postDLSpeeds(torrentId, $newTorrentEl)
        }, 2000)

        $scope.downloadSpeedIntervals[torrentId] = downloadProgress
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
            if (percComplete < 99) {
            	$('.green .btn').trigger("click")	
            }
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

    $scope.getFiles = function(torrentId) {
    	$http.get('/api/v1/torrent_files/' + torrentId).then(function(data) {
    		console.log(data.data)
    		$('#files').append('</br><h5>Files</h5>')
    		for (var i = 0; i < data.data.length; i++) {
    			var element = '<a href="http://localhost:7000/' + i + '">' + data.data[i] + '</a></br>'
    			console.log(element)
    			$('#files').append(element)
    		}
    	})
    }

    $scope.postDLSpeeds = function(torrentId) {
    	$http.get('/api/v1/torrent_download_speed/' + torrentId).then(function(data) {
    		console.log(data.data)
    		var speed = data.data
    		console.log("speed is" + speed)
            var $torrentEl = $scope.getTorrentCard(torrentId)

            // update percentage
            $('.dl-speed').html(speed)
            console.log('torrent', torrentId, 'is ', speed)
    	})	
    }

    $scope.postUPSpeeds = function(torrentId) {
    	$http.get('/api/v1/torrent_upload_speed/' + torrentId).then(function(data) {
    		console.log(data.data)
    		var speed = data.data
    		console.log("speed is" + speed)
            var $torrentEl = $scope.getTorrentCard(torrentId)

            // update percentage
            $('.up-speed').html(speed)
            console.log('torrent', torrentId, 'is ', speed)
    	})	
    }

    $scope.init()
})
