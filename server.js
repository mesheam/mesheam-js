const PeerServer = require("peer").PeerServer;
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const PEERJSPORT = 9000;
const SOCKETIOPORT = 3000;
const NODES = {};

const server = PeerServer({ port: PEERJSPORT, path: "/" });

io.on("connection", function(socket) {
  socket.on("stream:nodes:register", data => {
    log("New node", data.id);
    NODES[data.id] = socket;
  });
});

http.listen(SOCKETIOPORT, function() {
  console.log("Listening on *:" + SOCKETIOPORT);
});

function log(...params) {
  console.log(params);
}
