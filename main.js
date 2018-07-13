import { Mesheam } from "./lib.js";

window.publish = Mesheam("myVideo");

window.play = () => {
  document.querySelector("#tostream").play();
  document.querySelector("#tostream").style.display = "block";
  window.publish(document.querySelector("#tostream").captureStream());
};
