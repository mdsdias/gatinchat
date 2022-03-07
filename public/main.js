var socket = io();
var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");
function criarMensagem(msg)
{
    var item = document.createElement("li");
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

form.addEventListener("submit", function (e)
{
    e.preventDefault();
    if (input.value)
    {
        socket.emit("sub", input.value);
        input.value = "";
    }
});
socket.on('started', (id) => {
    socket.emit('add', localStorage.getItem('name'), id)
})

socket.on("writeConsole", function (msg)
{
    criarMensagem(`[Console]: ${msg} `);
});

socket.on("writeMsg", function (msg, id)
{
    criarMensagem(`${id}: ${msg}`);
});