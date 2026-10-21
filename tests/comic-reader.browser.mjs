// Optional browser regressions: npm install --no-save playwright
// npx playwright install chromium
// node --test tests/comic-reader.browser.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import * as fflate from 'fflate';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function png(width, height) {
  const chunk = (name, data) => {
    const type = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([type, data])));
    return Buffer.concat([length, type, data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 3 + 1) + 1 + x * 3;
      raw.fill((x % 80 < 3 || y % 120 < 3) ? 0 : 255, offset, offset + 3);
    }
  }
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
// A tiny RAR4 stored-file fixture, containing the same PNG as the ZIP fixture.
function rarStored(name, data) {
  const header = (body) => {
    const checksum = Buffer.alloc(2); checksum.writeUInt16LE(crc32(body) & 0xffff);
    return Buffer.concat([checksum, body]);
  };
  const main = Buffer.alloc(11); main[0] = 0x73; main.writeUInt16LE(13, 3);
  const filename = Buffer.from(name);
  const file = Buffer.alloc(30 + filename.length);
  file[0] = 0x74; file.writeUInt16LE(0x8000, 1); file.writeUInt16LE(32 + filename.length, 3);
  file.writeUInt32LE(data.length, 5); file.writeUInt32LE(data.length, 9); file[13] = 2;
  file.writeUInt32LE(crc32(data), 14); file[22] = 20; file[23] = 0x30;
  file.writeUInt16LE(filename.length, 24); file.writeUInt32LE(0x20, 26); filename.copy(file, 30);
  const end = Buffer.from([0x7b, 0, 0, 7, 0]);
  return Buffer.concat([Buffer.from([82,97,114,33,26,7,0]), header(main), header(file), data, header(end)]);
}

const original = png(1200, 1800);
const archive = Buffer.from(fflate.zipSync({
  './chapter/page10.png': png(1800, 900),
  '.\\chapter\\page2.png': png(1000, 1600),
  './chapter/page1.png': original,
  './chapter/__MACOSX/._page1.png': original,
  './chapter/ComicInfo.xml': fflate.strToU8('<ComicInfo><Title>Regression Manga</Title><Manga>YesAndRightToLeft</Manga></ComicInfo>'),
}));
let server, browser, context, page;
const errors = [], dialogs = [];
test.before(async () => {
  server = await createServer({ server: { port: 0, host: '127.0.0.1', strictPort: false } });
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.COMIC_TEST_CHROMIUM_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  context = await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' || url.protocol === 'blob:' || url.protocol === 'data:'
      ? route.continue() : route.abort();
  });
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByTitle('Manga & Comic Reader (.cbz, .cbr, .zip, .rar)').click();
});
test.after(async () => { await browser?.close(); await server?.close(); });
const images = () => page.locator('img[alt^="Page "]');
const upload = (name, buffer) => page.locator('main input[type=file]').setInputFiles({ name, mimeType: 'application/octet-stream', buffer });
const ready = async (alt) => {
  await page.locator(`img[alt="${alt}"]`).waitFor();
  await page.waitForFunction((label) => {
    const image = document.querySelector(`img[alt="${label}"]`);
    return image?.complete && image.naturalWidth > 0 && parseFloat(image.style.width) > 1;
  }, alt);
};

test('ZIP upload from the empty reader succeeds without a React hook crash', async () => {
  await upload('manga.zip', archive);
  await ready('Page 1');
  assert.deepEqual(errors, []);
  assert.deepEqual(dialogs, []);
  assert.equal(await page.getByText('Decompressing and parsing in memory').count(), 0);
  const quality = await images().first().evaluate(async (image) => ({
    width: image.naturalWidth, height: image.naturalHeight,
    rendered: image.getBoundingClientRect().width,
    bytes: Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer())),
    draggable: image.draggable,
  }));
  assert.equal(quality.width, 1200); assert.equal(quality.height, 1800);
  assert.deepEqual(Buffer.from(quality.bytes), original);
  assert.ok(quality.rendered < 1200); assert.equal(quality.draggable, false);
});

test('fit modes, explicit zoom, wide pages and spread changes preserve page position', async () => {
  const fit = page.getByTitle('Cycle Image Fit (Fit Height / Fit Width / Original)');
  await fit.click(); await fit.click(); // Original
  await page.waitForFunction(() => document.querySelector('img[alt="Page 1"]').getBoundingClientRect().width === 1200);
  await page.getByTitle('Zoom In', { exact: true }).click();
  await page.waitForFunction(() => document.querySelector('img[alt="Page 1"]').getBoundingClientRect().width === 1440);
  await page.getByTitle('Reset Zoom', { exact: true }).click();
  await fit.click(); // Fit height again
  await page.getByTitle('Next Spread', { exact: true }).click();
  await ready('Page 2');
  // Page 3 is detected as landscape and gets its own spread; Page 2 remains selected.
  await page.waitForFunction(() => document.querySelectorAll('img[alt^="Page "]').length === 1);
  await page.getByTitle('Next Spread', { exact: true }).click();
  await ready('Page 3');
  await page.getByTitle('Toggle Single / Double Spread').click();
  await ready('Page 3');
  assert.equal(await images().count(), 1);
  const wide = await images().first().boundingBox();
  assert.ok(wide.width <= 1200 && wide.height < 800);
  assert.ok(Math.abs(wide.width / wide.height - 2) < .01);
  await page.getByTitle('Toggle Single / Double Spread').click();
  await ready('Page 3');
});

test('internal image drags do not activate the blurred file-drop overlay', async () => {
  await images().first().evaluate((image) => {
    const transfer = new DataTransfer(); transfer.setData('text/uri-list', image.src);
    image.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: transfer }));
  });
  assert.equal(await page.getByText('Drop Document or Archive Here').count(), 0);
});

test('empty archive reports an error, clears loading, and allows retrying the same filename', async () => {
  await upload('retry.zip', Buffer.from(fflate.zipSync({})));
  await page.waitForFunction(async () => !(await import('/src/stores/useWorkspaceStore.ts')).useWorkspaceStore.getState().isArchiveLoading);
  assert.match(dialogs.at(-1), /No readable image pages/);
  await ready('Page 3'); // Previous book remains usable.
  await upload('retry.zip', archive);
  await ready('Page 1');
  assert.deepEqual(errors, []);
});

test('small pages stay at native size in webtoon mode; damaged images show a message', async () => {
  await upload('small.zip', Buffer.from(fflate.zipSync({ '1.png': png(120, 180) })));
  await ready('Page 1');
  await page.getByTitle('Manhwa / Webtoon (Vertical Strip)').click();
  await ready('Page 1');
  assert.equal((await images().first().boundingBox()).width, 120);
  await upload('damaged.zip', Buffer.from(fflate.zipSync({ 'broken.png': new Uint8Array([1,2,3,4]) })));
  await page.getByRole('alert').filter({ hasText: 'Could not decode page' }).waitFor();
  assert.deepEqual(errors, []);
});

test('RAR decoder is bundled and can open a real stored PNG page', async () => {
  await upload('stored.cbr', rarStored('page1.png', original));
  await ready('Page 1');
  assert.equal(await images().first().evaluate((image) => image.naturalWidth), 1200);
  assert.deepEqual(errors, []);
});
