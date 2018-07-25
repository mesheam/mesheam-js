import io from "socket.io-client";
import Peer from "simple-peer";

let hashesSent = [];
let socket;
let inputPeers = {};
let outputPeers = {};
let videoId;
let receiving = false;
let globalStream;
let emisor = false;
let myid;
let waitForSignal = true;

export const Mesheam = (id, server) => {
  myid = makeid();
  videoId = id;
  server = server ? server : window.location.hostname + ":7000";
  socket = io(server);

  setControlHandlersAndRegister(myid);
  log("Registered! ", myid);
  document.querySelector("#iam").innerHTML = "(" + myid + ")";

  socket.on("call", data => {
    log("got video call ...");
    if (!inputPeers[data.id]) {
      log("first call, creating receiver");
      inputPeers[data.id] = new Peer({
        reconnectTimer: 2000
      });
      inputPeers[data.id].on("signal", signal => {
        log("receiver got signal from ", data.id);
        log("emit signal:back to ", data.id);
        socket.emit("signal:back", {
          target: data.id,
          data: signal
        });
      });
      inputPeers[data.id].on("stream", stream => {
        // Resend to output Peers
        log("got video data -> recalling...");
        globalStream = stream;
        recall();

        // Play video
        log("I'm already receiving?", receiving);
        if (!receiving) document.getElementById(videoId).srcObject = stream;
        receiving = true;
      });
      inputPeers[data.id].on("close", () => {
        log("Input node lost!", data.id);
        removePeer(data.id);
        lostPeer(data.id);
      });
    }
    inputPeers[data.id].signal(data.data);
  });

  garbageCollector();

  return publish;
};

function addInputPeer(id) {
  document.querySelector("#input").innerHTML += "(" + id + ")";
  log("addInputPeer connecting to -> ", id);
  inputPeers[id] = false;
}

function addOutputPeer(id) {
  document.querySelector("#output").innerHTML += "(" + id + ")";
  log("addOutputPeer connecting to -> ", id);
  outputPeers[id] = false;
  if (receiving || emisor) {
    recall();
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
  if (!emisor) receiving = false;
  socket.emit("stream:nodes:lost", {
    id
  });
}

function publish(mediaStream) {
  log("publish -> recalling ");
  document.getElementById(videoId).srcObject = mediaStream;
  globalStream = mediaStream;
  receiving = true;
  emisor = true;
  socket.emit("stream:nodes:iam:master", {
    myid
  });
  recall();
}

function recall() {
  for (var key in outputPeers) {
    if (outputPeers.hasOwnProperty(key)) {
      setCaller(key);
    }
  }
}

function setCaller(key) {
  if (outputPeers[key]) {
    log("Peer " + key + " already have a Caller, do nothing");
    return;
  }
  log("setCaller for " + key);
  outputPeers[key] = new Peer({
    initiator: true,
    stream: globalStream,
    reconnectTimer: 2000
  });
  outputPeers[key].on("signal", data => {
    log("Send signal to " + key, data);
    socket.emit("signal:to", {
      target: key,
      data
    });
  });
}

function setControlHandlersAndRegister(id) {
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
  socket.on("callback", data => {
    log("Got call back from " + data.id, data.data);
    try {
      log("signaling " + data.id + " caller");
      outputPeers[data.id].signal(data.data);
    } catch (e) {}
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

let gcSet = null;
function garbageCollector() {
  if (gcSet) {
    return;
  }
  log("garbageCollector");
  const tenMin = 1000 * 60 * 10;
  const now = new Date().getTime();
  hashesSent.forEach(h => {
    if (now - h.timestamp > tenMin) {
      delete hashesSent[h];
    }
  });
  gcSet = setTimeout(() => {
    gcSet = null;
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

function makeid() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 15; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
