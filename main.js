import { Load, connect } from "./lib.js";

(async () => {
  const myId = await Load(con => {
    console.log("New connection:", con);
    window.con = con;
  });

  console.log("My id:", myId);

  window.connect = connect;
})();
