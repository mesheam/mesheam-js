var PeerServer = require("peer").PeerServer;
var server = PeerServer({ port: 9000, path: "/" });

server.on("connection", function(id) {
  console.log("New connection", id);
});

server.on("disconnect", function(id) {
  console.log("New disconnect", id);
});
