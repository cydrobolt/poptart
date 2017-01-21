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

/* helper functions */
var getToken = (len) => {
    return crypto.randomBytes(len).toString('hex')
}

/* routes */
app.get('/', (req, res) => {
    res.render('index.html')
})

app.param('torrentId', (req, res, next, torrentId) => {
    req.torrentId = torrentId
    next()
})

app.get(API_PREFIX + 'new_torrent', (req, res) => {
    let magnetURI = 'magnet:?xt=urn:btih:ZOCMZQIPFFW7OLLMIC5HUB6BPCSDEOQU'
    let torrentId

    client.add(magnetURI, {}, function (torrent) {
        // Got torrent metadata!
        console.log('Client is downloading:', torrent.infoHash)

        torrentId = getToken(16)

        torrent.on('done', function () {
            console.log('torrent download has finished')
        })

        // save torrent pointer to master list
        torrents[torrentId] = torrent

        res.send(torrentId)
    })
})

app.get(API_PREFIX + 'torrent_progress/:torrentId', (req, res) => {
    // get torrent progress given torrent ID
    var torrent = torrents[req.torrentId]
    res.send((torrent.progress * 100).toFixed(1))
})

app.get(API_PREFIX + 'remove_torrent/:torrentId', (req, res) => {
    // remove torrent
    // client.remove(<torrent>)
    console.log('its moving!' + req.torrentId)
    var torrent = torrents[req.torrentId]
    torrent.destroy()

    res.send('torrent destroyed')
})

app.get(API_PREFIX + 'torrent_files/:torrentId', (req, res) => {
    var torrent = torrents[req.torrentId]
    console.log(torrent.files)
    let files = _.map(torrent.files, (file) => {
        return file.name
    })

    res.send(JSON.stringify(files))
})

export { server }
