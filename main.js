import { Mesheam } from "./lib.js";

let videos = ["bad-boy", "et", "everytime-we-touch", "mimimi"];
let index = 0;

window.publish = Mesheam("myVideo");

window.play = () => {
  document.querySelector("#tostream").src = "/videos/" + videos[0] + ".webm";
  document.querySelector("#tostream").play();
  document.querySelector("#tostream").style.display = "block";
  window.publish(document.querySelector("#tostream").captureStream());
};

document.querySelector("#tostream").addEventListener(
  "ended",
  () => {
    index++;
    if (!videos[index]) {
      index = 0;
    }
    document.querySelector("#tostream").src =
      "/videos/" + videos[index] + ".webm";
  },
  false
);
