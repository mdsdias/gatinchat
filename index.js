const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
var current;

app.set('views', __dirname + "/views")

app.get('/:current', (req, res) => {
  res.render('index.html');

});

// chat p2p
navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (stream) {
    // This is used for Signaling the Peer
    const signalhub = require('signalhub')
    const createSwarm = require('webrtc-swarm')
    // Creates the Signal rub running in the mentioned port
    const hub = signalhub('my-game', [
      'http://localhost:8080'
    ])
    const swarm = createSwarm(hub, {
      stream: stream
    })
    //Creates a video player
    const Player = require('./videoplayer.js')
    const you = new Player({ x: 0, y : 0 ,color : 'black',left : 0,top : 0})
    you.addStream(stream)

    const players = {}
    swarm.on('connect', function (peer, id) {
      if (!players[id]) {
        players[id] = new Player({
            x : 300,
            y : 0,
            left : 200,
            top : 0,
            color : 'red'
        })
        peer.on('data', function (data) {
          data = JSON.parse(data.toString())
          players[id].update(data)
        })
        players[id].addStream(peer.stream)
      }
    })
    //On webRTC Disconnets
    swarm.on('disconnect', function (peer, id) {
      if (players[id]) {
        players[id].element.parentNode.removeChild(players[id].element)
        delete players[id]
      }
    })


    setInterval(function () {
      you.update()

      const youString = JSON.stringify(you)
      swarm.peers.forEach(function (peer) {
        peer.send(youString)
      })
    }, 100)
  })

io.on('connection', (socket) => {
  io.emit('started', socket.id)
  socket.on('chat message', (msg) => {
    if (current !== undefined) {
        socket.join(current)
        io.sockets.emit('chat message', msg)
    } else {
        io.emit('chat message', msg);
    }
  });
});

http.listen(port, () => {
  console.log(`Hello Legumi! Como vai meu bom?`);
});
