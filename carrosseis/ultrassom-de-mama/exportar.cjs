// Exporta cada card de carrossel.html como PNG 1080×1350 em ./export
// Uso: node exportar.cjs            (1080×1350, padrão Instagram)
//      node exportar.cjs --2x       (2160×2700, para impressão/arquivo)
// Requer Playwright (npx playwright ou instalação global com NODE_PATH).
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");

const scale = process.argv.includes("--2x") ? 2 : 1;
const outDir = path.join(__dirname, "export");

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1500 }, deviceScaleFactor: scale });
  await page.goto("file://" + path.join(__dirname, "carrossel.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");

  const cards = await page.$$(".card");
  for (const [i, card] of cards.entries()) {
    const file = path.join(outDir, `card-${String(i + 1).padStart(2, "0")}${scale > 1 ? "@2x" : ""}.png`);
    await card.screenshot({ path: file });
    console.log("✓", path.relative(__dirname, file));
  }
  await browser.close();
})();
