// Optional: npm install --no-save --package-lock=false playwright
// npx playwright install chromium
// node --test tests/epub-reader.browser.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { makeEpub, epubEntries, zipEpub } from './epub-fixtures.mjs';
let server, browser, page;
const errors = [], dialogs = [];
test.before(async () => {
  server = await createServer({ server: { port: 0, host: '127.0.0.1', strictPort: false } });
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.EPUB_TEST_CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' || ['blob:', 'data:'].includes(url.protocol) ? route.continue() : route.abort();
  });
  page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByTitle('E-Book & Light Novel Reader (.epub, .fb2, .txt)').click();
});
test.after(async () => { await browser?.close(); await server?.close(); });
const content = () => page.locator('.epub-chapter-content');
const upload = (name, data) => page.locator('main input[type=file]').setInputFiles({ name, mimeType: 'application/epub+zip', buffer: Buffer.from(data) });
const scrollViewport = () => page.locator('main .overflow-auto').last();
const ready = async (snippet) => { await content().getByText(snippet, { exact: true }).waitFor(); };

test('upload opens at chapter text instead of a cover-only spine entry', async () => {
  await upload('light-novel.epub', makeEpub());
  await ready('The chapter text is finally visible & readable.');
  assert.deepEqual(errors, []); assert.deepEqual(dialogs, []);
  const styles = await content().locator('#opening').evaluate((element) => {
    const style = getComputedStyle(element), box = element.getBoundingClientRect();
    return { display: style.display, visibility: style.visibility, opacity: style.opacity, color: style.color, fontSize: parseFloat(style.fontSize), width: box.width, height: box.height, text: element.textContent };
  });
  assert.equal(styles.display, 'block'); assert.equal(styles.visibility, 'visible'); assert.equal(styles.opacity, '1');
  assert.ok(styles.fontSize >= 12 && styles.width > 200 && styles.height > 0);
  assert.notEqual(styles.color, 'rgba(0, 0, 0, 0)');
  assert.equal(await page.evaluate(() => window.EPUB_SCRIPT_EXECUTED), undefined);
  await ready('این متن فارسی باید نمایش داده شود.');
  assert.equal(await content().locator('[dir=rtl]').getAttribute('lang'), 'fa');
});

test('contents retain the cover, nested scenes and the second chapter', async () => {
  await page.getByTitle('Toggle Table of Contents (T)').click();
  const toc = page.locator('aside');
  await toc.getByRole('button', { name: /Cover page/ }).click();
  await content().locator('img[alt="Cover art"]').waitFor();
  await toc.getByRole('button', { name: /Part Two/ }).click();
  await ready('Second chapter text, from a different folder.');
  await toc.getByRole('button', { name: /Second Scene/ }).click();
  await ready('The second scene remains reachable.');
  await page.waitForFunction(() => document.querySelector('main .overflow-auto:last-child')?.scrollTop > 100 || [...document.querySelectorAll('main .overflow-auto')].some((element) => element.scrollTop > 100));
  const scene = await content().locator('#scene-2').boundingBox();
  const viewport = await scrollViewport().boundingBox();
  assert.ok(scene.y >= viewport.y && scene.y < viewport.y + viewport.height);
});

test('internal chapter links navigate by exact path and preserve fragment destinations', async () => {
  await page.locator('aside').getByRole('button', { name: /Part Two/ }).click();
  await content().getByRole('link', { name: 'Return to the second scene' }).click();
  await ready('The second scene remains reachable.');
  const scene = await content().locator('#scene-2').boundingBox();
  const viewport = await scrollViewport().boundingBox();
  assert.ok(scene.y >= viewport.y && scene.y < viewport.y + viewport.height);
  await page.locator('aside').getByRole('button', { name: /Part One/ }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('main .overflow-auto')].some((element) => element.scrollTop === 0 && element.querySelector('.epub-chapter-content')));
  await content().getByRole('link', { name: 'Read the second chapter' }).click();
  await ready('Second chapter text, from a different folder.');
});

test('changing chapter resets the actual scroll viewport; column mode retains visible text', async () => {
  await page.locator('aside').getByRole('button', { name: /Part One/ }).click();
  await scrollViewport().evaluate((element) => { element.scrollTop = 1500; });
  await page.getByTitle('Next Chapter', { exact: true }).click();
  await ready('Second chapter text, from a different folder.');
  assert.ok(await scrollViewport().evaluate((element) => element.scrollTop < 5));
  await page.getByTitle('Two-Column Book Mode').click();
  await ready('Second chapter text, from a different folder.');
  assert.equal(await content().evaluate((element) => getComputedStyle(element).columnCount), '2');
  assert.deepEqual(errors, []);
});

test('broken EPUB gives an explicit missing-chapter error and keeps the previous book usable', async () => {
  const files = epubEntries(); delete files['OPS/Text/Chapter One.xhtml'];
  await upload('retry.epub', zipEpub(files));
  await page.waitForFunction(() => !document.body.textContent.includes('Decompressing and parsing in memory'));
  assert.match(dialogs.at(-1), /missing file.*Chapter One.xhtml/);
  await ready('Second chapter text, from a different folder.');
  await upload('retry.epub', makeEpub({ epub3: false }));
  await ready('The chapter text is finally visible & readable.');
  await page.getByTitle('Toggle Table of Contents (T)').click();
  await page.locator('aside').getByRole('button', { name: /Second Chapter/ }).click();
  await ready('Second chapter text, from a different folder.');
  assert.deepEqual(errors, []);
});
