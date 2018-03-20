import io from "socket.io-client";

const SERVER = "http://localhost:3000";

let hashesSent = [];
let socket;
let conn;
let inputPeers = {};
let outputPeers = {};

export const Mesheam = () => {
  socket = io(SERVER);
  conn = new Peer({
    host: "localhost",
    port: 9000,
    path: "/"
  });

  conn.on("open", id => {
    setStreamOutputHandlers(conn);
    setControlHandlersAndRegister(id);
  });

  garbageCollector();

  return publish;
};

function addInputPeer(id) {
  inputPeers[id] = setStreamInputHandlers(conn.connect(id));
}

function removePeer(id) {
  inputPeers[id] && inputPeers[id].close();
  outputPeers[id] && outputPeers[id].close();
  delete inputPeers[id];
  delete outputPeers[id];
}

function lostPeer(id) {
  log("stream:nodes:lost", id);
  socket.emit("stream:nodes:lost", {
    id
  });
}

function publish(data) {
  const time = new Date().getTime();
  const block = {
    data: data,
    hash: hashCode(data + time),
    timestamp: time
  };
  republish(block);
}

function republish(block) {
  if (hashDoesNotExists(block)) {
    log("republish because hashDoesNotExists(block)", hashDoesNotExists(block));
    hashesSent.push({
      hash: block.hash,
      timestamp: block.timestamp
    });
    for (var key in outputPeers) {
      if (outputPeers.hasOwnProperty(key)) {
        log("publish to " + key + " -> ", block);
        outputPeers[key].send(block);
      }
    }
  }
}

function setStreamInputHandlers(peerSocket) {
  log("setStreamInputHandlers");
  peerSocket.on("data", data => {
    log("got video data, republishing...");
    republish(data); // data is in data.data
  });
  return peerSocket;
}

function setStreamOutputHandlers(peerSocket) {
  log("setStreamOutputHandlers");
  conn.on("connection", con => {
    log("New peer connected to me", con.peer);
    outputPeers[con.peer] = con;
  });
}

function setControlHandlersAndRegister(id) {
  log("setControlHandlersAndRegister");
  log("stream:nodes:register");
  socket.emit("stream:nodes:register", {
    id
  });
  socket.on("stream:nodes:add", data => {
    log("stream:nodes:add");
    addInputPeer(data.id);
  });
  socket.on("stream:nodes:remove", data => {
    log("stream:nodes:remove");
    removePeer(data.id);
  });
}

function log(...params) {
  console.log(...params);
}

function hashDoesNotExists(block) {
  for (let i = 0; i < hashesSent.length; i++) {
    if (parseInt(hashesSent[i].hash) == parseInt(block.hash)) return false;
  }
  return true;
}

function hashCode(string) {
  var hash = 0,
    i,
    chr;
  if (string.length === 0) return hash;
  for (i = 0; i < string.length; i++) {
    chr = string.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function garbageCollector() {
  log("garbageCollector");
  const tenMin = 1000 * 60 * 10;
  const now = new Date().getTime();
  hashesSent.forEach(h => {
    if (now - h.timestamp > tenMin) {
      delete hashesSent[h];
    }
  });
  setTimeout(() => {
    garbageCollector();
  }, 60000);
}
