const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
var current;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', (socket) => {
  const userId = await fetchProjects(socket);
//   socket.emit('secret message', (msg) => {
//       socket.to(user)
//       io.emit(msg)
//   });
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
