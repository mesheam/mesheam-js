let handler;

export const Load = async fn => {
  handler = fn;

  window._peerConnection = new Peer({
    host: "localhost",
    port: 9000,
    path: "/"
  });

  window._peerConnection.on("connection", con => {
    fn({
      listen: fn => {
        con.on("data", fn);
      },
      send: data => {
        con.send(data);
      }
    });
  });

  return await new Promise((ac, re) => {
    window._peerConnection.on("open", id => {
      ac(id);
    });
  });
};

export const connect = id => {
  const con = window._peerConnection.connect(id);
  handler({
    listen: fn => {
      con.on("data", fn);
    },
    send: data => {
      con.send(data);
    }
  });
};
