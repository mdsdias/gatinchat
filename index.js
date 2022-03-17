const express = require("express");
const app = express();
const http = require("http").Server(app);
const server = require("socket.io")(http);
const port = process.env.PORT || 3000;
var users = [
  //{"id": "id", "nick": "Nome 01", "room": "Sala 01"},
  //{"id": "id", "nick": "Nome 02", "room": "Sala 02"},
];
var rooms = [
  // {"id": "id", "name": "Nome da sala", "users": [
  //    {"id": "id", "nick": "Nome 01"},
  //    {"id": "id", "nick": "Nome 02"}
  // ]},
];

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.get("/*", (q, r) => {
  r.render("chat.ejs");
});

app.get("/pingOn", (q, r) => {
  r.send("Pong!");
});

function room(id) {
  try {
    return rooms.find((r) => r.id == id);
  } catch (e) {
    return null;
  }
}

function user(id) {
  return users.find((u) => u.id == id) || null;
}

function deduplicate(arr) {
  try {
    u = arr.filter((obj, index, self) => {
      return index === self.findIndex((t) => t.id === obj.id);
    });
    users = u;
  } catch (e) {}
}

function roomUpdate() {
  r = [];
  for (const [k, v] of Object.entries(users)) {
    if (v.room in r) {
      r[v.room].users.push(v);
    } else r.push({ id: v.room, name: v.room, users: [v] });
  }
  rooms = r;
}

server.on("connection", (socket) => {
  socket.on("messageRoom", (msg, id, roomLocal) => {
    if (user(id)) { //verifica se o usuario existe
      if (room(roomLocal)) { //verifica se a sala existe
        server.to(roomLocal).emit("messageRoom", msg, id, roomLocal);
      } else {
        socket.emit("messageRoom", "Sala não existe", id, roomLocal);
      }
    } else {
      socket.emit("messageRoom", "Usuário não existe", id, roomLocal);
    }
    // var usr = user(id),
    //   nick = usr["nick"] || "Anônimo",
    //   room = usr["room"] || roomLocal;
    // if (room == roomLocal) usr['room'] = roomLocal;
    // server.to(room).emit("send_message", msg, id, nick);
  });

  socket.on('privateMsg', (IdRecive, mensagem, IdInvite) => {
    if (user(IdRecive)) {
      if (user(IdInvite)) {
        server.to(IdRecive).emit('privateMsg', { id: IdInvite, msg: mensagem, nome: user(IdInvite).nick });
        server.to(IdInvite).emit('privateMsg', { id: IdRecive, msg: mensagem, nome: user(IdRecive).nick });
      } else {
        socket.emit('privateMsg', 'Usuário não existe', IdInvite, IdRecive);
      }
    } else {
      socket.emit('privateMsg', 'Usuário não existe', IdRecive, IdInvite);
    }
  })

  socket.on("lista", () => {
    try {
      var usr = user(socket.id);
    } catch (err) {
      socket.emit("new_user", {
        id: socket.id,
        nick: "Anonymus",
        room: "",
      });
      var usr = user(socket.id);
    }
    var usuarios = [];
    users.forEach((user) => {
      if (user.room === room) {
        usuarios.push(user["nick"] + " - " + user["id"]);
      }
    });
    var nick = usr["nick"],
      room = usr["room"];
    socket.emit("lista", usuarios);
  });

  socket.on("new_user", (data) => {
    var obj = {
      id: socket.id,
      nick: data.nick,
      room: data.room,
    };
    users.push(obj);
    socket.join(data.room);
    server.to(data.room).emit("userList", users);
  });

  socket.on("nick", (data) => {
    users.forEach((item) => {
      if (item.id == data.id) {
        item.nick = data.new;
      }
    });
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      socket.connect();
    }
    try {
      var usr = user(socket.id);
      if (usr.room) {
        socket.leave(usr.room);
        for (let i = 0; i < rooms.length; i++) {
          if (rooms[i].id == usr.room) {
            for (let j = 0; j < rooms[i].users.length; j++) {
              if (rooms[i].users[j].id == usr.id) {
                delete rooms[i].users[j];
              }
            }
          }
        }
      } else {
        for (var i = 0; i < users.length; i++) {
          if (users[i].id === socket.id) {
            delete users[i];
          }
        }
      }
    } catch (e) {
      console.log("Não foi possível desconectar o usuário");
    }
  });
});

setInterval(() => {
  deduplicate(users);
  for (let i = 0; i < rooms.length; i++) {
    deduplicate(rooms[i].users);
  }
  roomUpdate();
}, 1000);

setInterval(() => {
  console.dir(rooms, { depth: null });
}, 5 * 1000);

http.listen(port);
