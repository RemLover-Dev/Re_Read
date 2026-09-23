import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Character Registry Integrity (42 Characters)
import { RE_ZERO_CHARACTERS, FACTIONS } from '../src/themes/characters.data.ts';

test('Re:Zero Character Registry contains all 43 distinct characters from all 8 camps', () => {
  const characters = Object.values(RE_ZERO_CHARACTERS);
  assert.equal(characters.length, 43, `Expected 43 characters, found ${characters.length}`);
});

test('All characters belong to recognized factions', () => {
  const factionIds = new Set(Object.keys(FACTIONS));
  for (const char of Object.values(RE_ZERO_CHARACTERS)) {
    assert.ok(
      factionIds.has(char.faction),
      `Character ${char.id} has unknown faction: ${char.faction}`
    );
  }
});

test('All characters have English, Persian, and Romaji localized names', () => {
  for (const char of Object.values(RE_ZERO_CHARACTERS)) {
    assert.ok(char.name.en && char.name.en.length > 0, `${char.id} missing English name`);
    assert.ok(char.name.fa && char.name.fa.length > 0, `${char.id} missing Persian name`);
    assert.ok(char.name.romaji && char.name.romaji.length > 0, `${char.id} missing Romaji name`);
  }
});

test('All character palettes define required contrast tokens', () => {
  for (const char of Object.values(RE_ZERO_CHARACTERS)) {
    const p = char.palette;
    assert.ok(p.primary.startsWith('#') || p.primary.startsWith('rgb'), `${char.id} invalid primary`);
    assert.ok(p.secondary.startsWith('#') || p.secondary.startsWith('rgb'), `${char.id} invalid secondary`);
    assert.ok(p.surface.startsWith('rgba'), `${char.id} surface must be RGBA for glass`);
    assert.ok(p.textPrimary.startsWith('#'), `${char.id} invalid textPrimary`);
    assert.ok(p.glassOpacity >= 0.15 && p.glassOpacity <= 0.40, `${char.id} opacity out of bounds`);
  }
});
