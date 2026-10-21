import test from 'node:test';
import assert from 'node:assert/strict';
import * as fflate from 'fflate';
import { parseEpubArchive, resolveRelativePath } from '../src/core/archive/ebook-parser.ts';
import { epubEntries, makeEpub, zipEpub, epubPng } from './epub-fixtures.mjs';

test('namespaced EPUB with spaced attributes and encoded paths keeps every chapter and opens at text', async () => {
  const book = await parseEpubArchive(makeEpub(), 'test.epub');
  try {
    assert.equal(book.title, 'Visible Text & Images');
    assert.equal(book.author, 'EPUB Regression');
    assert.equal(book.chapters.length, 4);
    assert.equal(book.initialChapterIndex, 2);
    assert.match(book.chapters[0].content, /<img src="blob:/);
    assert.match(book.chapters[2].content, /The chapter text is finally visible &amp; readable/);
    assert.match(book.chapters[2].content, /این متن فارسی/);
    assert.match(book.chapters[2].content, /<ruby>/);
    assert.match(book.chapters[2].content, /<em>readable<\/em>/);
    assert.doesNotMatch(book.chapters[2].content, /<style|<script|class="hidden"|display:none|position:absolute|color:black|font-size:0/);
    assert.ok(book.coverUrl);
  } finally { book.cleanup(); }
});

test('EPUB 3 navigation preserves nesting, fragments and exact paths with duplicate basenames', async () => {
  const book = await parseEpubArchive(makeEpub(), 'nav.epub');
  try {
    assert.deepEqual(book.toc.map((entry) => entry.chapterIndex), [0, 2, 3]);
    assert.equal(book.toc[1].children[0].chapterIndex, 2);
    assert.equal(book.toc[1].children[0].fragment, 'scene-2');
    assert.equal(book.toc[2].href, 'OPS/Bonus/Chapter One.xhtml');
    assert.equal(book.toc[2].fragment, 'arrival');
    assert.match(book.chapters[2].content, /data-epub-href="OPS\/Bonus\/Chapter%20One.xhtml#arrival"/);
  } finally { book.cleanup(); }
});

test('EPUB 2 NCX paths are relative to the NCX file and preserve nested entries', async () => {
  const book = await parseEpubArchive(makeEpub({ epub3: false }), 'ncx.epub');
  try {
    assert.equal(book.toc[0].title, 'First & Main');
    assert.equal(book.toc[0].chapterIndex, 2);
    assert.equal(book.toc[0].children[0].fragment, 'scene-2');
    assert.equal(book.toc[1].chapterIndex, 3);
  } finally { book.cleanup(); }
});

test('missing chapter files and manifest references fail instead of silently showing only a cover', async () => {
  const files = epubEntries(); delete files['OPS/Text/Chapter One.xhtml'];
  await assert.rejects(parseEpubArchive(zipEpub(files), 'broken.epub'), /missing file: OPS\/Text\/Chapter One.xhtml/);
  const refs = epubEntries();
  refs['OPS/package.opf'] = fflate.strToU8(fflate.strFromU8(refs['OPS/package.opf']).replace("idref = 'chapter1'", "idref = 'missing'"));
  await assert.rejects(parseEpubArchive(zipEpub(refs), 'broken.epub'), /Spine item "missing"/);
});

test('EPUB parsing releases already-created resource URLs when a later chapter fails', async (t) => {
  const created = [], revoked = [];
  const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
  t.mock.method(URL, 'createObjectURL', (blob) => { const url = create(blob); created.push(url); return url; });
  t.mock.method(URL, 'revokeObjectURL', (url) => { revoked.push(url); revoke(url); });
  const files = epubEntries(); delete files['OPS/Bonus/Chapter One.xhtml'];
  await assert.rejects(parseEpubArchive(zipEpub(files), 'broken.epub'));
  assert.ok(created.length >= 1);
  assert.deepEqual(revoked, created);
});

test('chapter images preserve original bytes and do not depend on basename guessing', async () => {
  const book = await parseEpubArchive(makeEpub(), 'images.epub');
  const imageUrl = book.chapters[2].content.match(/<img src="([^"]+)"/)[1];
  try {
    assert.deepEqual(new Uint8Array(await (await fetch(imageUrl)).arrayBuffer()), epubPng);
  } finally { book.cleanup(); }
  await assert.rejects(fetch(imageUrl));
});

test('UTF-16 chapter content is decoded using its BOM', async () => {
  const files = epubEntries();
  files['OPS/Text/Chapter One.xhtml'] = Buffer.concat([Buffer.from([255, 254]), Buffer.from('<?xml version="1.0" encoding="UTF-16"?><html xmlns="http://www.w3.org/1999/xhtml"><body><h1>UTF-16</h1><p>متن فارسی در فصل</p></body></html>', 'utf16le')]);
  const book = await parseEpubArchive(zipEpub(files), 'utf16.epub');
  try { assert.match(book.chapters[2].content, /متن فارسی در فصل/); } finally { book.cleanup(); }
});

test('image-only EPUBs still open and EPUBs without navigation get a chapter list', async () => {
  const files = epubEntries();
  files['OPS/package.opf'] = fflate.strToU8(`<package xmlns="http://www.idpf.org/2007/opf"><manifest><item id="art" href="Images/cover%20art.png" media-type="image/png"/></manifest><spine><itemref idref="art"/></spine></package>`);
  const book = await parseEpubArchive(zipEpub(files), 'pictures.epub');
  try {
    assert.equal(book.initialChapterIndex, 0);
    assert.equal(book.chapters.length, 1);
    assert.match(book.chapters[0].content, /<img src="blob:/);
    assert.equal(book.toc[0].chapterIndex, 0);
  } finally { book.cleanup(); }
});

test('EPUB reference resolution decodes once and separates fragments before decoding', () => {
  assert.equal(resolveRelativePath('OPS/Nav', '../Text/Chapter%20One.xhtml#scene'), 'OPS/Text/Chapter One.xhtml');
  assert.equal(resolveRelativePath('OPS', 'Text/A%23B.xhtml#scene'), 'OPS/Text/A#B.xhtml');
  assert.equal(resolveRelativePath('OPS', 'Text/A%2520B.xhtml'), 'OPS/Text/A%20B.xhtml');
});
