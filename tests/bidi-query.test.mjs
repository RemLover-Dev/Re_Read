import test from 'node:test';
import assert from 'node:assert/strict';

import { detectTextDirection, compileBiDiMarkdown } from '../src/core/bidi/markdown-pipeline.ts';
import { buildSafeBooruQuery, getCleanCharacterTag } from '../src/core/booru/query-builder.ts';

test('detectTextDirection identifies Persian RTL paragraphs correctly', () => {
  const persianText = 'این یک متن آزمایشی است.';
  assert.equal(detectTextDirection(persianText), 'rtl');

  const englishText = 'This is an English test sentence.';
  assert.equal(detectTextDirection(englishText), 'ltr');

  const mixedStartingWithPersian = 'مقدار تابع $f(x) = 2x$ برابر است.';
  assert.equal(detectTextDirection(mixedStartingWithPersian), 'rtl');

  const mixedStartingWithEnglish = 'Function $f(x)$ for مقادیر مختلف.';
  assert.equal(detectTextDirection(mixedStartingWithEnglish), 'ltr');
});

test('compileBiDiMarkdown renders Persian text with LTR KaTeX isolation', async () => {
  const md = 'رابطه معروف $E = mc^2$ انیشتین.';
  const html = await compileBiDiMarkdown(md);

  // Assert direction is RTL for the Persian container
  assert.ok(html.includes('dir="rtl"'), 'Should wrap Persian paragraph in dir="rtl"');

  // Assert KaTeX is isolated with LTR
  assert.ok(html.includes('dir="ltr"'), 'KaTeX math should have dir="ltr"');
  assert.ok(html.includes('unicode-bidi: isolate'), 'KaTeX math should have unicode-bidi: isolate');
});

test('buildSafeBooruQuery disambiguates character collisions and enforces rating:safe', () => {
  const alQuery = buildSafeBooruQuery('aldebaran', ['aldebaran_(re:zero)']);
  assert.ok(alQuery.formattedQuery.includes('rating:safe'), 'Must include rating:safe');
  assert.ok(alQuery.formattedQuery.includes('helmet'), 'Aldebaran must include disambiguation helmet tag');

  const remQuery = buildSafeBooruQuery('rem', ['rem_(re:zero)']);
  assert.ok(remQuery.formattedQuery.includes('-ram_(re:zero)'), 'Rem query must exclude Ram to prevent twin bleed');
  assert.ok(remQuery.formattedQuery.includes('rating:safe'), 'Rem query must be safe');
});

test('getCleanCharacterTag produces clean tags across Safebooru, Zerochan, and E-shuushuu', () => {
  assert.equal(getCleanCharacterTag('rem', 'Rem', 'safebooru'), 'rem_(re:zero)');
  assert.equal(getCleanCharacterTag('rem', 'Rem', 'zerochan'), 'Rem (Re:Zero)');
  assert.equal(getCleanCharacterTag('rem', 'Rem', 'eshuushuu'), 'Rem');

  assert.equal(getCleanCharacterTag('emilia', 'Emilia', 'safebooru'), 'emilia_(re:zero)');
  assert.equal(getCleanCharacterTag('emilia', 'Emilia', 'zerochan'), 'Emilia (Re:Zero)');
  assert.equal(getCleanCharacterTag('emilia', 'Emilia', 'eshuushuu'), 'Emilia');

  assert.equal(getCleanCharacterTag('natsuki-subaru', 'Natsuki Subaru', 'safebooru'), 'natsuki_subaru');
  assert.equal(getCleanCharacterTag('natsuki-subaru', 'Natsuki Subaru', 'zerochan'), 'Natsuki Subaru');
  assert.equal(getCleanCharacterTag('natsuki-subaru', 'Natsuki Subaru', 'eshuushuu'), 'Natsuki Subaru');
});
