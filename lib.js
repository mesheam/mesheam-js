import io from "socket.io-client";

const SERVER = "http://localhost:3000";

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

  return republish;
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
  socket.emit("stream:nodes:lost", {
    id
  });
}

function republish(data) {
  for (var key in outputPeers) {
    if (outputPeers.hasOwnProperty(key)) {
      log("republish:: " + data + " -> " + key);
      outputPeers[key].send(data);
    }
  }
}

function setStreamInputHandlers(peerSocket) {
  peerSocket.on("data", data => {
    log("got video data, republishing...");
    republish(data);
  });
  return peerSocket;
}

function setStreamOutputHandlers(peerSocket) {
  conn.on("connection", con => {
    log("New peer connected to me", con.peer);
    outputPeers[con.peer] = con;
  });
}

function setControlHandlersAndRegister(id) {
  socket.emit("stream:nodes:register", {
    id
  });
  socket.on("stream:nodes:add", data => {
    addInputPeer(data.id);
  });
  socket.on("stream:nodes:remove", data => {
    removePeer(data.id);
  });
}
