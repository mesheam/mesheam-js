import { Mesheam } from "./lib.js";

window.publish = Mesheam("myVideo", "https://streamserver.galax.be");

window.play = () => {
  document.querySelector("#tostream").play();
  document.querySelector("#tostream").style.display = "block";
  window.publish(document.querySelector("#tostream").captureStream());
};
