const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true
  });
  const page = await browser.newPage();
  await page.goto("http://localhost:5000");
  await page.waitFor(5000);
  await page.evaluate(() => {
    window.play();
  });

  await process.stdin.resume();
})();
