const SOCKETIOPORT = 7000;
const MAX_INPUT = 1;
const MAX_OUTPUT = 2;

const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  pingInterval: 10000,
  pingTimeout: 5000
});

const NODES = {};

io.on("connection", function(socket) {
  socket.on("stream:nodes:register", data => {
    log("New node registered -> ", data.id);
    NODES[data.id] = socket;
    NODES[data.id].outputs = [];
    NODES[data.id].inputs = [];
    NODES[data.id].key = data.id;
    for (let e = 0; e < MAX_INPUT; e++) {
      findFreePeerFor(data.id);
    }
  });
  socket.on("signal:to", data => {
    NODES[data.target].emit("call", {
      id: socket.key,
      data: data.data
    });
  });
  socket.on("signal:back", data => {
    NODES[data.target].emit("callback", {
      id: socket.key,
      data: data.data
    });
  });
  socket.on("disconnect", () => {
    log("Node lost ", socket.key, " -> reallocating childs...");
    try {
      delete NODES[socket.key];
      log("remove outputs from ", socket.inputs);
      if (socket.inputs)
        socket.inputs.forEach(id => {
          for (let i = 0; i < NODES[id].outputs.length; i++) {
            if (NODES[id].outputs[i] == socket.key) {
              log("Removing ", socket.key, " from ", id, "outputs");
              NODES[id].emit("stream:nodes:remove", {
                id: socket.key
              });
              delete NODES[id].outputs[i];
            }
          }
          NODES[id].outputs = NODES[id].outputs.filter(function(x) {
            return x !== (undefined || null || "");
          });
        });
      if (socket.outputs) {
        socket.outputs.forEach(id => {
          for (let i = 0; i < NODES[id].inputs.length; i++) {
            if (NODES[id].inputs[i] == socket.key) {
              log("Removing ", socket.key, " from ", id, "inputs");
              NODES[id].emit("stream:nodes:remove", {
                id: socket.key
              });
              delete NODES[id].inputs[i];
            }
          }
          NODES[id].inputs = NODES[id].inputs.filter(function(x) {
            return x !== (undefined || null || "");
          });
        });
        log("Reallocate new inputs for orphan nodes");
        socket.outputs.forEach(id => {
          log("reallocating inputs for ", id);
          for (let e = 0; e < MAX_INPUT; e++) {
            findFreePeerFor(id);
          }
        });
      }
    } catch (e) {
      log("ERROR:", e);
    }
  });
});

http.listen(SOCKETIOPORT, function() {
  console.log("Listening on " + SOCKETIOPORT);
});

function log(...params) {
  console.log(...params);
}

function findFreePeerFor(id) {
  log("Finding input for", id);
  for (var key in NODES) {
    if (key == id) continue;
    log(
      key,
      "has outputs",
      NODES[key].outputs,
      "and inputs",
      NODES[key].inputs,
      "outputs length",
      NODES[key].outputs.length
    );
    if (NODES.hasOwnProperty(key)) {
      if (NODES[key].outputs.length < MAX_OUTPUT) {
        try {
          if (NODES[id].inputs.indexOf(key) != -1) continue;
          if (NODES[id].outputs.indexOf(key) != -1) continue;
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
    log(key, "not worked");
  }
  setTimeout(() => {
    try {
      if (typeof NODES[id] == "undefined") return;
      if (NODES[id].inputs.length < MAX_INPUT) {
        findFreePeerFor(id);
      }
    } catch (e) {
      log("ERR", e);
    }
  }, 1000);
}
