import test from 'node:test';
import assert from 'node:assert';
import * as fflate from 'fflate';
import { parseComicArchive, isZipArchive, isRarArchive } from '../src/core/archive/comic-parser.ts';
import { sizeComicPages } from '../src/core/archive/comic-layout.ts';
import {
  naturalSortItems,
  parseComicInfo,
  isImageFile,
  getImageMimeType,
  inspectArchive,
} from '../src/core/archive/comic-parser.ts';
import {
  resolveRelativePath,
  parseTxtBook,
  parseEpubArchive,
  parseFb2Book,
} from '../src/core/archive/ebook-parser.ts';
import {
  computeSpreads,
} from '../src/core/archive/spread-helper.ts';

test('naturalSortItems sorts numeric filenames in human order', () => {
  const pages = [
    { name: 'page_10.jpg' },
    { name: 'page_2.jpg' },
    { name: 'page_1.jpg' },
    { name: 'page_20.jpg' },
    { name: 'page_3.png' },
  ];

  const sorted = naturalSortItems(pages);
  const names = sorted.map((p) => p.name);

  assert.deepStrictEqual(names, [
    'page_1.jpg',
    'page_2.jpg',
    'page_3.png',
    'page_10.jpg',
    'page_20.jpg',
  ]);
});

test('isImageFile filters out hidden files, macOS metadata, and non-images', () => {
  assert.strictEqual(isImageFile('page1.jpg'), true);
  assert.strictEqual(isImageFile('ch1/page_02.png'), true);
  assert.strictEqual(isImageFile('cover.webp'), true);
  assert.strictEqual(isImageFile('__MACOSX/._page1.jpg'), false);
  assert.strictEqual(isImageFile('.DS_Store'), false);
  assert.strictEqual(isImageFile('info.txt'), false);
  assert.strictEqual(isImageFile('ComicInfo.xml'), false);
});

test('getImageMimeType assigns accurate MIME types for comic formats', () => {
  assert.strictEqual(getImageMimeType('scan.jpg'), 'image/jpeg');
  assert.strictEqual(getImageMimeType('scan.jpeg'), 'image/jpeg');
  assert.strictEqual(getImageMimeType('scan.png'), 'image/png');
  assert.strictEqual(getImageMimeType('scan.webp'), 'image/webp');
  assert.strictEqual(getImageMimeType('scan.avif'), 'image/avif');
});

test('parseComicInfo extracts metadata and detects Manga RTL mode', () => {
  const comicInfoMangaXml = `
    <?xml version="1.0"?>
    <ComicInfo>
      <Title>Re:Zero Arc 4</Title>
      <Series>Re:Zero</Series>
      <Number>12</Number>
      <Writer>Tappei Nagatsuki</Writer>
      <PageCount>45</PageCount>
      <Manga>YesAndRightToLeft</Manga>
    </ComicInfo>
  `;

  const meta = parseComicInfo(comicInfoMangaXml);
  assert.strictEqual(meta.title, 'Re:Zero Arc 4');
  assert.strictEqual(meta.series, 'Re:Zero');
  assert.strictEqual(meta.number, '12');
  assert.strictEqual(meta.writer, 'Tappei Nagatsuki');
  assert.strictEqual(meta.pageCount, 45);
  assert.strictEqual(meta.isManga, true);

  const comicInfoWesternXml = `
    <?xml version="1.0"?>
    <ComicInfo>
      <Title>Spider-Man</Title>
      <Manga>No</Manga>
    </ComicInfo>
  `;
  const metaWestern = parseComicInfo(comicInfoWesternXml);
  assert.strictEqual(metaWestern.isManga, undefined);
});

test('resolveRelativePath correctly traverses parent and nested directories', () => {
  assert.strictEqual(
    resolveRelativePath('OEBPS/Text', '../Images/cover.jpg'),
    'OEBPS/Images/cover.jpg'
  );
  assert.strictEqual(
    resolveRelativePath('OPS', 'chapter1.xhtml'),
    'OPS/chapter1.xhtml'
  );
  assert.strictEqual(
    resolveRelativePath('content/sub/deep', '../../img/hero.png'),
    'content/img/hero.png'
  );
});

test('parseTxtBook splits web novels by multilingual chapter headings', () => {
  const sampleText = `
Chapter 1: The Beginning
Subaru woke up on the stone steps of the capital.

Chapter 2: The Insignia
He met a silver-haired half-elf with amethyst eyes.

فصل ۳: خانه غارت‌ها
آن‌ها به منطقه فقیرنشین پایتخت رسیدند.
  `.trim();

  const book = parseTxtBook(sampleText, 'ReZero_WN.txt');
  assert.strictEqual(book.chapters.length, 3);
  assert.strictEqual(book.chapters[0].title, 'Chapter 1: The Beginning');
  assert.strictEqual(book.chapters[1].title, 'Chapter 2: The Insignia');
  assert.strictEqual(book.chapters[2].title, 'فصل ۳: خانه غارت‌ها');
  assert.strictEqual(book.toc.length, 3);
  assert.ok(book.chapters[0].content.includes('Subaru woke up'));
});

test('computeSpreads handles 1P, 2P RTL Manga, and 2P LTR Comic spread pairing', () => {
  const pages = [
    { index: 0, name: 'cover.jpg', url: 'blob:0' },
    { index: 1, name: 'p1.jpg', url: 'blob:1' },
    { index: 2, name: 'p2.jpg', url: 'blob:2' },
    { index: 3, name: 'p3.jpg', url: 'blob:3' },
    { index: 4, name: 'wide.jpg', url: 'blob:4', isWide: true },
    { index: 5, name: 'p5.jpg', url: 'blob:5' },
  ];

  // 1P Mode
  const spreads1P = computeSpreads(pages, 'manga-rtl', '1P', false);
  assert.strictEqual(spreads1P.length, 6);

  // 2P RTL Manga with cover offset
  // Page 0 (Cover) alone -> Page 1 (Right) + Page 2 (Left) -> Page 3 (Right) alone because next is wide -> Page 4 (Wide) alone -> Page 5 alone
  const spreads2PManga = computeSpreads(pages, 'manga-rtl', '2P', true);
  assert.strictEqual(spreads2PManga.length, 5);
  // Spread 0: Cover alone
  assert.strictEqual(spreads2PManga[0].rightPage?.name, 'cover.jpg');
  assert.strictEqual(spreads2PManga[0].leftPage, undefined);
  // Spread 1: Page 1 on Right, Page 2 on Left (Manga order)
  assert.strictEqual(spreads2PManga[1].rightPage?.name, 'p1.jpg');
  assert.strictEqual(spreads2PManga[1].leftPage?.name, 'p2.jpg');
  // Spread 2: Page 3 on Right alone
  assert.strictEqual(spreads2PManga[2].rightPage?.name, 'p3.jpg');
  // Spread 3: Page 4 (Wide landscape) standalone
  assert.strictEqual(spreads2PManga[3].isWideSingle, true);
  assert.strictEqual(spreads2PManga[3].leftPage?.name, 'wide.jpg');
  // Spread 4: Page 5
  assert.strictEqual(spreads2PManga[4].rightPage?.name, 'p5.jpg');

  // 2P LTR Comic without cover offset: Page 0 (Left) + Page 1 (Right)
  const spreads2PComic = computeSpreads(pages.slice(0, 4), 'comic-ltr', '2P', false);
  assert.strictEqual(spreads2PComic.length, 2);
  assert.strictEqual(spreads2PComic[0].leftPage?.name, 'cover.jpg');
  assert.strictEqual(spreads2PComic[0].rightPage?.name, 'p1.jpg');
  assert.strictEqual(spreads2PComic[1].leftPage?.name, 'p2.jpg');
  assert.strictEqual(spreads2PComic[1].rightPage?.name, 'p3.jpg');
});

test('parseEpubArchive extracts metadata, spine, TOC, and rewrites relative images', async () => {
  const containerXml = `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>
  `;

  const opfXml = `<?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="2.0">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>Re:Zero Starting Life in Another World</dc:title>
        <dc:creator>Tappei Nagatsuki</dc:creator>
      </metadata>
      <manifest>
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="cover" href="Images/cover.jpg" media-type="image/jpeg"/>
        <item id="ch1" href="Text/ch1.xhtml" media-type="application/xhtml+xml"/>
      </manifest>
      <spine toc="ncx">
        <itemref idref="ch1"/>
      </spine>
    </package>
  `;

  const ncxXml = `<?xml version="1.0" encoding="utf-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      <navMap>
        <navPoint id="navPoint-1">
          <navLabel><text>Chapter 1: The Waste Heat of the Beginning</text></navLabel>
          <content src="Text/ch1.xhtml"/>
        </navPoint>
      </navMap>
    </ncx>
  `;

  const ch1Html = `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head><title>Chapter 1</title></head>
      <body>
        <h1>The Waste Heat of the Beginning</h1>
        <p>Suddenly, Natsuki Subaru was summoned to a fantasy world.</p>
        <img src="../Images/cover.jpg" alt="Cover Art"/>
      </body>
    </html>
  `;

  const dummyImageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

  const epubZip = fflate.zipSync({
    'META-INF/container.xml': fflate.strToU8(containerXml),
    'OEBPS/content.opf': fflate.strToU8(opfXml),
    'OEBPS/toc.ncx': fflate.strToU8(ncxXml),
    'OEBPS/Text/ch1.xhtml': fflate.strToU8(ch1Html),
    'OEBPS/Images/cover.jpg': dummyImageBytes,
  });

  const book = await parseEpubArchive(epubZip, 'rezero_vol1.epub');

  assert.strictEqual(book.title, 'Re:Zero Starting Life in Another World');
  assert.strictEqual(book.author, 'Tappei Nagatsuki');
  assert.ok(book.coverUrl);
  assert.strictEqual(book.chapters.length, 1);
  assert.strictEqual(book.chapters[0].title, 'The Waste Heat of the Beginning');
  assert.ok(book.chapters[0].content.includes('Natsuki Subaru was summoned'));
  // Relative img src="../Images/cover.jpg" was rewritten to in-memory URL
  assert.ok(book.chapters[0].content.includes('<img src="blob:'));
  assert.strictEqual(book.toc.length, 1);
  assert.strictEqual(book.toc[0].title, 'Chapter 1: The Waste Heat of the Beginning');

  // Verify inspectArchive recognizes it as EPUB
  const detected = await inspectArchive(epubZip, 'rezero.zip');
  assert.strictEqual(detected, 'epub');
});

test('parseFb2Book extracts sections, base64 images, and metadata', async () => {
  const fb2Xml = `<?xml version="1.0" encoding="utf-8"?>
    <FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
      <description>
        <title-info>
          <book-title>Overlord Volume 1</book-title>
          <author>
            <first-name>Kugane</first-name>
            <last-name>Maruyama</last-name>
          </author>
          <coverpage>
            <image l:href="#cover.jpg"/>
          </coverpage>
        </title-info>
      </description>
      <body>
        <section>
          <title><p>Chapter 1: The End and the Beginning</p></title>
          <p>The virtual reality MMORPG Yggdrasil was about to shut down.</p>
          <image l:href="#cover.jpg"/>
        </section>
      </body>
      <binary id="cover.jpg" content-type="image/jpeg">/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=</binary>
    </FictionBook>
  `;

  const book = await parseFb2Book(new TextEncoder().encode(fb2Xml), 'overlord.fb2');

  assert.strictEqual(book.title, 'Overlord Volume 1');
  assert.strictEqual(book.author, 'Kugane Maruyama');
  assert.ok(book.coverUrl);
  assert.strictEqual(book.chapters.length, 1);
  assert.strictEqual(book.chapters[0].title, 'Chapter 1: The End and the Beginning');
  assert.ok(book.chapters[0].content.includes('virtual reality MMORPG'));
  assert.ok(book.chapters[0].content.includes('<img src="blob:'));
});

// Regression coverage for real comic ZIP extraction, not only filename helpers.
test('comic ZIP normalizes dot/Windows paths, skips metadata and preserves original bytes', async () => {
  const original = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
  const archive = fflate.zipSync({
    './chapter/page10.JPG': original,
    '.\\chapter\\page2.JPG': original,
    './chapter/page1.JPG': original,
    './chapter/__MACOSX/thumbnail.jpg': original,
    './chapter/.hidden/preview.png': original,
    './chapter/._page1.JPG': original,
    './chapter/empty.jpg': new Uint8Array(),
    './chapter/ComicInfo.xml': fflate.strToU8('<ComicInfo><Title>Test Manga</Title></ComicInfo>'),
    'notes.txt': fflate.strToU8('not a page'),
  });
  assert.equal(await inspectArchive(archive, 'manga.zip'), 'comic');
  const book = await parseComicArchive(archive, 'manga.zip');
  try {
    assert.equal(book.title, 'Test Manga');
    assert.deepEqual(book.pages.map((p) => p.name), [
      'chapter/page1.JPG', 'chapter/page2.JPG', 'chapter/page10.JPG',
    ]);
    assert.deepEqual(book.pages.map((p) => p.index), [0, 1, 2]);
    const response = await fetch(book.pages[0].url);
    assert.equal(response.headers.get('content-type'), 'image/jpeg');
    assert.deepEqual(new Uint8Array(await response.arrayBuffer()), original);
  } finally { book.cleanup(); }
  await assert.rejects(fetch(book.pages[0].url));
});

test('content signature takes precedence over a misleading .cbr extension', async () => {
  const archive = fflate.zipSync({ 'page.png': Uint8Array.from([137, 80, 78, 71]) });
  const book = await parseComicArchive(archive, 'actually-a-zip.cbr');
  assert.equal(book.pages.length, 1);
  book.cleanup();
});

test('comic extraction respects Uint8Array byte offsets', async () => {
  const zip = fflate.zipSync({ 'p1.webp': Uint8Array.from([1, 2, 3]) });
  const padded = new Uint8Array(zip.length + 64);
  padded.set(zip, 32);
  const book = await parseComicArchive(padded.subarray(32, 32 + zip.length), 'offset.cbz');
  assert.equal(book.pages.length, 1);
  book.cleanup();
});

test('empty, hidden-only and unsupported archives fail with an actionable error', async () => {
  for (const entries of [{}, { './__MACOSX/._1.jpg': new Uint8Array([1]) }, { 'page.tiff': new Uint8Array([1]) }]) {
    const zip = fflate.zipSync(entries);
    assert.equal(await inspectArchive(zip, 'empty.zip'), 'unknown');
    await assert.rejects(parseComicArchive(zip, 'empty.zip'), /No readable image pages/);
  }
  await assert.rejects(parseComicArchive(new Uint8Array([1, 2, 3, 4]), 'fake.zip'), /not a supported ZIP/);
  await assert.rejects(parseComicArchive(new Uint8Array([80, 75, 3, 4, 0]), 'broken.zip'), /Could not open comic/);
});

test('ZIP inspection and comic extraction skip unsupported compression in unrelated files', async () => {
  const zip = fflate.zipSync({ 'page.jpg': new Uint8Array([1, 2, 3]), 'notes.bin': new Uint8Array([4]) });
  const view = new DataView(zip.buffer);
  // Mark only the unrelated notes.bin entry as an unsupported ZIP compression method.
  for (let i = 0; i < zip.length - 46; i++) {
    const signature = view.getUint32(i, true);
    if (signature !== 0x02014b50) continue;
    const nameLength = view.getUint16(i + 28, true);
    const name = new TextDecoder().decode(zip.subarray(i + 46, i + 46 + nameLength));
    if (name === 'notes.bin') {
      view.setUint16(i + 10, 99, true);
      const localOffset = view.getUint32(i + 42, true);
      view.setUint16(localOffset + 8, 99, true);
    }
  }
  assert.equal(await inspectArchive(zip, 'comic.zip'), 'comic');
  const book = await parseComicArchive(zip, 'comic.zip');
  assert.equal(book.pages.length, 1);
  book.cleanup();
});

test('partial comic failures revoke every created image URL', async (t) => {
  const create = URL.createObjectURL.bind(URL);
  const revoke = URL.revokeObjectURL.bind(URL);
  const created = [], revoked = [];
  t.mock.method(URL, 'createObjectURL', (blob) => {
    if (created.length) throw new Error('simulated allocation failure');
    const url = create(blob); created.push(url); return url;
  });
  t.mock.method(URL, 'revokeObjectURL', (url) => { revoked.push(url); revoke(url); });
  const zip = fflate.zipSync({ '1.jpg': new Uint8Array([1]), '2.jpg': new Uint8Array([2]) });
  await assert.rejects(parseComicArchive(zip, 'allocation.zip'), /allocation failure/);
  assert.equal(created.length, 1);
  assert.deepEqual(revoked, created);
});

test('archive signatures reject unrelated PK and truncated RAR data', () => {
  assert.equal(isZipArchive(new Uint8Array([80, 75, 0, 0])), false);
  assert.equal(isZipArchive(new Uint8Array([80, 75, 5, 6])), true);
  assert.equal(isRarArchive(new Uint8Array([82, 97, 114, 33, 26, 7, 1])), false);
  assert.equal(isRarArchive(new Uint8Array([82, 97, 114, 33, 26, 7, 1, 0])), true);
});

test('comic fitting preserves aspect ratios, fits the whole spread and avoids automatic upscaling', () => {
  const pages = [{ width: 1200, height: 1800 }, { width: 1000, height: 1600 }];
  const sizes = sizeComicPages(pages, { width: 800, height: 600 }, 'fit-height');
  assert.ok(sizes[0].width + sizes[1].width <= 800);
  assert.ok(sizes.every((s) => s.height <= 600));
  sizes.forEach((size, i) => assert.ok(Math.abs(size.width / size.height - pages[i].width / pages[i].height) < 1e-10));
  const small = [{ width: 120, height: 180 }];
  assert.deepEqual(sizeComicPages(small, { width: 1600, height: 900 }, 'fit-width'), small);
  assert.deepEqual(sizeComicPages(small, { width: 1600, height: 900 }, 'fit-width', 2), [{ width: 240, height: 360 }]);
  assert.deepEqual(sizeComicPages(pages, { width: 800, height: 600 }, 'original'), pages);
});
