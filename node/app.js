
/*
 * Module Dependencies
 */

var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , sys = require('util')
  , exec = require('child_process').exec

var app = express()
var io = require('socket.io').listen(app)

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
  res.render('index',
  { title : 'Home' }
  )
})
app.listen(31415)

function puts(error, stdout, sterr) { sys.puts(stdout) }

io.sockets.on('connection', function (socket) {
    socket.on('toggle', function(){
    exec('/home/pi/nebulus/toggle.py',puts) 
    console.log('toggle')
    })
  })
