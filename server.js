const PEERJSPORT = 9000;
const SOCKETIOPORT = 3000;
const MAX_INPUT = 2;
const MAX_OUTPUT = 2;

const PeerServer = require("peer").PeerServer;
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  pingInterval: 10000,
  pingTimeout: 5000
});

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
  });
  socket.on("disconnect", () => {
    log("Node lost ", socket.key, " -> reallocating childs...");
    try {
      delete NODES[socket.key];
      socket.outputs.forEach(id => {
        findFreePeerFor(id);
      });
    } catch (e) {}
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
      if (NODES[key].outputs.length < MAX_OUTPUT && key != id) {
        try {
          log("[" + id + "]", "free peer found! -> linking...", key);
          NODES[key].outputs.push(id);
          NODES[id].inputs.push(key);
          NODES[key].emit("stream:nodes:add:output", {
            id: id
          });
          NODES[id].emit("stream:nodes:add:input", {
            id: key
          });
          return key;
        } catch (e) {
          log("ERROR:", e);
        }
      }
    }
  }
  setTimeout(() => {
    try {
      if (NODES[id].inputs.length < MAX_INPUT) {
        log("Free peer not found for ", id, " -> retrying", Object.keys(NODES));
        findFreePeerFor(id);
      }
    } catch (e) {
      log("ERROR:", e);
    }
  }, 1000);
}
