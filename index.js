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

function room(id) {
  try {
    return rooms.find((r) => r.id == id);
  } catch (e) {
    return null;
  }
}

function user(id) {
  try {
    return users.find((u) => u.id == id);
  } catch (e) {
    return null;
  }
}

function deduplicate(arr) {
  try {
    users = arr.filter((obj, index, self) => {
      return index === self.findIndex((t) => t.id === obj.id);
    });
  } catch (e) {
    console.log(e);
  }
}

function roomUpdate() { 
  for (const [k, v] of Object.entries(users)) {
    console.log(k, v);
    
  }
}

server.on("connection", (socket) => {
  socket.on("messageRoom", (msg, id) => {
    var usr = user(id),
      nick = usr["nick"],
      room = usr["room"];
    server.to(room).emit("send_message", msg, id, nick);
  });

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
    server.emit("userList", users);
  });

  socket.on("disconnect", (reason) => {
    if (reason === "io server disconnect") {
      socket.connect();
    }
    try {
      var usr = user(socket.id);
      console.log("Usuário desconectado: " + usr["nick"]);
      for (var i = 0; i < users.length; i++) {
        if (users[i].id === socket.id) {
          delete users[i];
        }
      }
    } catch (e) {
      console.log('Não foi possível desconectar o usuário');
    }
  });
  roomUpdate();
});

setInterval(() => deduplicate(users), 2 * 1000);

http.listen(port);
