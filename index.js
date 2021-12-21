const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ejs = require('ejs');

const port = process.env.PORT || 3000;
var current;

app.set('views', __dirname + "/views")
app.set('view engine', 'ejs');


app.get('/chat/:id', (req, res) => {
  res.render('index.ejs');
  current = req.params.id;
});

io.on('connection', (socket) => {
  io.emit('started', socket.id)
  socket.on('chat message', (msg) => {
    if (current) {
        socket.join(current)
        socket.to(current).emit('chat message', msg, socket.id)
    } else {
        io.emit('chat message', msg, socket.id);
    }
  });
});

http.listen(port, () => {
  console.log(`Hello Legumi! Como vai meu bom?`);
});
