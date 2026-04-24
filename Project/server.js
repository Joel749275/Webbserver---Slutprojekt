const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("."));

const players = {};

io.on("connection", (socket) => {
  console.log("Spelare ansluten:", socket.id);

  players[socket.id] = { x: 5, y: 5 };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("playerJoined", { id: socket.id, x: 5, y: 5 });

  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].direction = data.direction;
      socket.broadcast.emit("playerMoved", { id: socket.id, x: data.x, y: data.y, direction: data.direction });
    }
  });

  socket.on("disconnect", () => {
    console.log("Spelare frånkopplad:", socket.id);
    delete players[socket.id];
    io.emit("playerLeft", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server körs på http://localhost:3000");
});