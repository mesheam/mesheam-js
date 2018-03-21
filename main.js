import { Mesheam } from "./lib.js";

window.publish = Mesheam("10.114.146.70", "myVideo");

window.play = () => {
  document.querySelector("#tostream").play();
  document.querySelector("#tostream").style.display = "block";
  window.publish(document.querySelector("#tostream").captureStream());
};
