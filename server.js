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
    log("New node registered -> ", data.id);
    NODES[data.id] = socket;
    NODES[data.id].key = data.id;
    NODES[data.id].outputs = [];
    NODES[data.id].inputs = [];
    findFreePeerFor(data.id);
    socket.on("disconnect", () => {
      log("Node lost ", socket.key, " -> reallocating childs...");
      socket.outputs.forEach(id => {
        findFreePeerFor(id);
      });
    });
  });
});

http.listen(SOCKETIOPORT, function() {
  console.log(
    "Listening on " + SOCKETIOPORT + " and PeerServer on " + PEERJSPORT
  );
});

function log(...params) {
  console.log(...params);
}

function findFreePeerFor(id) {
  log("findFreePeerFor", id);
  for (var key in NODES) {
    if (NODES.hasOwnProperty(key)) {
      if (NODES[key].outputs.length < 2 && key != id) {
        log("free peer found! -> linking...");
        NODES[key].outputs.push(id);
        NODES[id].inputs.push(key);
        NODES[id].emit("stream:nodes:add", {
          id: key
        });
        return key;
      }
    }
  }
  setTimeout(() => {
    if (NODES[id].inputs.length < 2) {
      log("Free peer not found for ", id, " -> retrying");
      findFreePeerFor(id);
    }
  }, 1000);
}
