var socket = io();
var messages = $("#messages");
var form = $("#form");
var input = $("#inp-send");
var btnSend = $("btn-send");
const room = document.location.pathname.split('/')[1] || "Geral";

function criarMensagem(msg) {
  var item = document.createElement("li");
  item.textContent = msg;
  messages.append(item);
  window.scrollTo(0, document.body.scrollHeight);
}

function comandos(msg) {
  const cmds = {
    ".priv": () => {
      const args = msg.split(" ");
      if (args.length < 2) {
        criarMensagem(
          "Para enviar uma mensagem privada, use o comando .priv id_do_usuario mensagem"
        );
        return;
      }
      const usuario = args[1];
      const mensagem = args.slice(2).join(" ");

      /*
      socket.id do usuario a ser enviado, 
      mensagem a enviar, 
      socket.id do usuario que enviou a mensagem,
      nome do usuario que enviou a mensagem.
      */
      criarMensagem(`Tu: ${mensagem} (enviado)`);
      socket.emit("privateMsg", usuario, mensagem, socket.id, nick);
    },
    ".nick": () => { 
      const args = msg.split(" ");
      if (args.length < 2) {
        criarMensagem("Para mudar seu nick, use o comando .nick novo_nick");
        return;
      }
      const novoNick = args[1];
      socket.emit("nick", {
        new: novoNick,
        id: socket.id
      });
      localStorage.setItem('nick', novoNick);
    },
    ".clear": () => {
      messages.empty();
    },
    ".sair": () => {
      window.location.href = "/";
    },
    ".join": () => {
      const args = msg.split(" ");
      if (args.length < 2) {
        criarMensagem("Para entrar em um canal, use o comando .join nome_do_canal");
        return;
      }
      const novoCanal = args[1];
      window.location = `/${novoCanal}`;
    },
    ".salas": () => {
      socket.emit("listarSalas");
    },
    ".lista": () => {
      socket.emit("lista");
    },
    ".help": () => {
      criarMensagem(
        "Comandos disponiveis: .priv id_do_usuario mensagem, .nick novo_nick, .clear, .sair, .join nome_do_canal, .salas, .lista"
      );
    },
  };
  try {
    cmds[msg.split(" ")[0]]();
    input.val("");
  } catch (err) {
    return new Error("Comando não encontrado");
  }
}

input.keydown((e) => {
  if (e.keyCode == 13) {
    form.click();
  }
});

form.click(function (e) {
  e.preventDefault();
  if (input.val() == "" || input.val() == null) {
    input.val("");
    input.focus();
    return;
  }
  if (input.val().startsWith(".")) {
    try {
      comandos(input.val());
    } catch (err) {}
    input.val("");
    input.focus();
    return;
  }
  socket.emit("messageRoom", input.val(), socket.id);
  input.val("");  
  input.focus();
});

// Recebe mensagem do servidor e adiciona na lista
socket.on("send_message", function (msg, id, nome) {
  if (id == socket.id) {
    criarMensagem(`Você: ${msg}`);
  } else {
    criarMensagem(`${nome}: ${msg}`);
  }
});

// receber mensagem privada do servidor e adiciona na lista
socket.on("privateMsg", (data) => {
  if (data.id == socket.id) {
    criarMensagem(`Você: ${data.msg} (privado)`);
  } else {
    criarMensagem(`${data.nome}: ${data.msg} (privado)`);
  }
});

socket.on('lista', (lista) => {
  criarMensagem(`Lista: ${lista.join(', ')}`);
})
socket.on("writeConsole", function (msg) {
  criarMensagem(`[Console]: ${msg} `);
});

$(document).ready(function () {
  input.focus();
  localStorage.getItem('firstTime') ? firstTime() : null;
  socket.emit("new_user", {
    id: socket.id,
    nick: localStorage.getItem('nick') || "Novo usuário",
    room: room
  });
});

function firstTime(){
  criarMensagem("Bem vindo ao chat!");
  criarMensagem("Para enviar uma mensagem privada, use o comando .priv id_do_usuario mensagem");
  criarMensagem("Para mudar seu nick, use o comando .nick novo_nick");
  criarMensagem("Para sair do chat, use o comando .sair");
  criarMensagem("Para ver a lista de usuários, use o comando .lista");
  criarMensagem("Para ver a lista de comandos, use o comando .help");
  criarMensagem("Para ver a lista de salas, use o comando .salas");
  criarMensagem("Para entrar em uma sala, use o comando .join id_sala");
  criarMensagem("Isso é tudo, obrigado por usar o chat!");
  criarMensagem("Agora coMIAUce a conversa!");
  localStorage.setItem('firstTime', false);
}