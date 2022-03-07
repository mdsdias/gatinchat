const express = require('express');
const app = express();
const http = require('http').Server(app);
const server = require('socket.io')(http);
const port = process.env.PORT || 3000;
const users = {
    //"nome": "id"
};

app.set('views', __dirname + "/views");
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.get('/', (q, r) => {
    r.render('chat.ejs');
});
server.on('connection', (socket) => {
    server.emit('started', socket.id);
    console.log(users);
    server.emit('writeConsole', `Entrou um novo user, ${
        socket.id
    }`);
    socket.on('sub', (msg) => {
        server.emit('writeMsg', msg, users[socket.id]);
    });
    socket.on('add', (name, atualId) => {
        if (users[atualId] == name) {
            server.emit('writeConsole', "Existe um user registrado com esse nick!")
        }
        else {
            users[atualId] = name
        }
    })
});

http.listen(port);
