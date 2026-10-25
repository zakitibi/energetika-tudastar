// Az ikonok PNG-változatainak újragenerálása az SVG-forrásokból.
// Futtatás a repó gyökeréből:  node tools/render-icons.mjs
// Forrás: icons/icon.svg (lekerekített, „any" + böngészőfül), icons/src/*.svg
// (maskable: teljes kitöltés, a villám a 0,4-es sugarú biztonsági körön belül;
//  apple-touch: teljes kitöltés, az iOS maga kerekít; favicon: nagyobb villám 16–32 px-re).
// Playwright/Chromium kell; ha nincs helyi telepítés, a PLAYWRIGHT_MODULE útvonalát használja.
import fs from 'fs';
let pw;
try { pw = await import('playwright'); }
catch { pw = await import(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs'); }
const jobs = [
  ['icons/icon.svg',            192, 'icons/icon-192.png'],
  ['icons/icon.svg',            512, 'icons/icon-512.png'],
  ['icons/src/maskable.svg',    192, 'icons/maskable-192.png'],
  ['icons/src/maskable.svg',    512, 'icons/maskable-512.png'],
  ['icons/src/apple-touch.svg', 180, 'icons/apple-touch-icon.png'],
  ['icons/src/favicon.svg',      32, 'icons/favicon-32.png'],
  ['icons/src/favicon.svg',      16, 'icons/favicon-16.png'],
];
const b = await pw.chromium.launch();
for (const [src, px, out] of jobs) {
  const p = await b.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  const svg = fs.readFileSync(src, 'utf8').replace('<svg ', `<svg width="${px}" height="${px}" `);
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: px, height: px } });
  await p.close();
  console.log(out, px + 'px');
}
await b.close();
