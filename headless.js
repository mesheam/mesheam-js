const puppeteer = require("puppeteer");

process.on("uncaughtException", function(err) {
  console.log("Caught exception: " + err);
});

(async () => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.goto("http://localhost:8080");
  await page.waitFor(5000);
  await page.evaluate(() => {
    window.play();
  });

  await process.stdin.resume();
})();
