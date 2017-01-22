import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import nunjucks from 'nunjucks'
import crypto from 'crypto'
import _ from 'lodash'

import WebTorrent from 'webtorrent'

/* constants */
const API_PREFIX = '/api/v1/'

/* initialization */
let app = express()
let client = new WebTorrent()
let torrents = []

nunjucks.configure('views', {
    autoescape: true,
    express: app
})

let server = http.Server(app)

/* middleware */
app.use('/static', express.static('public'))
app.use('/directives', express.static('directives'))
app.use('/downloads', express.static('/tmp/webtorrent'))

/* helper functions */
var getToken = (len) => {
    return crypto.randomBytes(len).toString('hex')
}

/* routes */
app.get('/', (req, res) => {
    let mappedTorrents = _.mapValues(torrents, function(torrent) {
        return {
            name: torrent.name
        }
    })
    console.log(mappedTorrents)

    res.render('index.html', { torrents: JSON.stringify(mappedTorrents) })
})

app.param('torrentId', (req, res, next, torrentId) => {
    req.torrentId = torrentId
    next()
})

app.get(API_PREFIX + 'new_torrent', (req, res) => {
    let magnetURI = req.query.magnet
    let magnetName = req.query.name

    console.log('received request to download ' + magnetURI)
    let torrentId

    client.add(magnetURI, {}, function (torrent) {
        // create HTTP server
        var server = torrent.createServer()
        server.listen(7000)
        // Got torrent metadata!
        console.log('Client is downloading:', torrent.infoHash)

        torrentId = getToken(16)

        torrent.on('done', function () {
            console.log('torrent download has finished')
        })

        // save torrent pointer to master list
        torrents[torrentId] = {
            torrent: torrent,
            name: magnetName
        }

        res.send(torrentId)

    })
})

app.get(API_PREFIX + 'torrent_progress/:torrentId', (req, res) => {
    // get torrent progress given torrent ID
    console.log('received request for progress of ', req.torrentId)
    var torrent = torrents[req.torrentId].torrent
    res.send((torrent.progress * 100).toFixed(1))
})

app.get(API_PREFIX + 'remove_torrent/:torrentId', (req, res) => {
    // remove torrent
    // client.remove(<torrent>)
    console.log('its moving!' + req.torrentId)
    var torrent = torrents[req.torrentId].torrent
    torrent.destroy()

    res.send('torrent destroyed')
})

app.get(API_PREFIX + 'torrent_files/:torrentId', (req, res) => {
    var torrent = torrents[req.torrentId].torrent

    console.log(torrent.files)
    let files = _.map(torrent.files, (file) => {
        return file.name
    })

    res.send(JSON.stringify(files))
})

export { server }
