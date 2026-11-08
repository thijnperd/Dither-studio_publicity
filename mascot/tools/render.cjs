'use strict';

/* Render Mote's PNG sizes and inspection previews.
   Playwright is a tool, not a dependency: it is resolved globally when it is
   not already on NODE_PATH. */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { pathToFileURL } = require('url');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (err) {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(root, 'playwright'));
  }
}

const { chromium } = loadPlaywright();
const root = path.join(__dirname, '..');
const harness = pathToFileURL(path.join(__dirname, 'render.html')).href;

async function shot(browser, { src, size, bg, file, wait = 0 }) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  const url = `${harness}?src=${encodeURIComponent(src)}&size=${size}&bg=${bg}`;
  await page.goto(url);
  await page.waitForFunction(() => {
    const image = document.querySelector('img');
    return image && image.complete && image.naturalWidth > 0;
  });
  if (wait) await page.waitForTimeout(wait);
  await page.screenshot({ path: file, omitBackground: bg === 'transparent' });
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const size of [512, 128, 64, 32]) {
      await shot(browser, {
        src: '../mote-master.svg',
        size,
        bg: 'transparent',
        file: path.join(root, `mote-${size}.png`),
      });
    }

    await shot(browser, {
      src: '../mote-master.svg',
      size: 512,
      bg: 'dark',
      file: path.join(root, 'preview-still.png'),
    });

    await shot(browser, {
      src: '../mote.svg',
      size: 512,
      bg: 'dark',
      file: path.join(root, 'preview-motion.png'),
      wait: 1100,
    });

    const reduced = await browser.newPage({ viewport: { width: 512, height: 512 } });
    await reduced.emulateMedia({ reducedMotion: 'reduce' });
    await reduced.goto(`${harness}?src=${encodeURIComponent('../mote.svg')}&size=512&bg=dark`);
    await reduced.waitForFunction(() => {
      const image = document.querySelector('img');
      return image && image.complete && image.naturalWidth > 0;
    });
    await reduced.waitForTimeout(350);
    await reduced.screenshot({ path: path.join(root, 'preview-reduced.png') });
    await reduced.close();
  } finally {
    await browser.close();
  }

  const files = ['mote-512.png', 'mote-128.png', 'mote-64.png', 'mote-32.png', 'preview-still.png', 'preview-motion.png', 'preview-reduced.png'];
  console.log(JSON.stringify(files.map((name) => ({ name, bytes: fs.statSync(path.join(root, name)).size })), null, 2));
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
