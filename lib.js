import io from "socket.io-client";

let hashesSent = [];
let socket;
let conn;
let inputPeers = {};
let outputPeers = {};
let videoId;
let receiving = false;
let globalStream;
let emisor = false;

export const Mesheam = (server, id, myid) => {
  videoId = id;
  socket = io(server + ":3000");
  conn = new Peer(myid, {
    host: server,
    port: 9000,
    path: "/"
  });

  conn.on("open", id => {
    log("Registered! ", id);
    document.querySelector("#iam").innerHTML = "(" + id + ")";
    setStreamOutputHandlers(conn);
    setControlHandlersAndRegister(id);
  });

  conn.on("call", function(call) {
    log("got video call -> answering...");
    if (emisor) return false;
    if (!receiving) {
      call.answer();
      call.on("stream", function(stream) {
        log("got video data -> recalling...");
        recall(stream);
        globalStream = stream;
        // `stream` is the MediaStream of the remote peer.
        // Here you'd add it to an HTML video/canvas element.
        if (!receiving) document.getElementById(videoId).srcObject = stream;
        receiving = true;
      });
    } else {
      log("Got call but already receiving -> rejected");
    }
  });

  garbageCollector();

  return startCamera;
};

function addInputPeer(id) {
  document.querySelector("#input").innerHTML += "(" + id + ")";
  log("addInputPeer connecting to -> ", id);
  inputPeers[id] = true;
}

function addOutputPeer(id) {
  document.querySelector("#output").innerHTML += "(" + id + ")";
  log("addOutputPeer connecting to -> ", id);
  outputPeers[id] = true;
  if (receiving) {
    outputPeers[id] = setStreamInputHandlers(conn.call(id, globalStream));
  } else {
    log("Not receiving");
  }
}

function removePeer(id) {
  document.querySelector("#output").innerHTML = document
    .querySelector("#output")
    .innerHTML.split("(" + id + ")")
    .join("");
  document.querySelector("#input").innerHTML = document
    .querySelector("#input")
    .innerHTML.split("(" + id + ")")
    .join("");
  inputPeers[id] && inputPeers[id].close && inputPeers[id].close();
  outputPeers[id] && outputPeers[id].close && outputPeers[id].close();
  delete inputPeers[id];
  delete outputPeers[id];
}

function lostPeer(id) {
  log("stream:nodes:lost", id);
  receiving = false;
  socket.emit("stream:nodes:lost", {
    id
  });
}

function publish(mediaStream) {
  log("publish -> recalling ");
  document.getElementById(videoId).srcObject = mediaStream;
  receiving = true;
  emisor = true;
  recall(mediaStream);
}

function recall(stream) {
  log("recall -> outputPeers", outputPeers);
  for (var key in outputPeers) {
    if (outputPeers.hasOwnProperty(key)) {
      log("call to " + key + " -> ", stream);
      outputPeers[key] = setStreamInputHandlers(conn.call(key, stream));
    }
  }
}

function setStreamInputHandlers(peerSocket) {
  log("setStreamInputHandlers");
  peerSocket.on("close", () => {
    log("Input node lost!", peerSocket.peer);
    removePeer(peerSocket.peer);
    lostPeer(peerSocket.peer);
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
  socket.on("stream:nodes:add:input", data => {
    log("stream:nodes:add:input");
    receiving = false;
    addInputPeer(data.id);
  });
  socket.on("stream:nodes:add:output", data => {
    log("stream:nodes:add:output");
    addOutputPeer(data.id);
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

function startCamera() {
  navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

  navigator.getMedia(
    {
      video: true,
      audio: true
    },
    localMediaStream => {
      publish(localMediaStream);
    },
    err => {
      console.log("Error getting camera input: " + err);
    }
  );
}
