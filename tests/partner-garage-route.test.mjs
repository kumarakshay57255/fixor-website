import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

test('Partner Garages navigation opens the existing partner page', async () => {
  const names = (await readdir(new URL('../', import.meta.url))).filter((name) => name.endsWith('.html'));
  const pages = await Promise.all(names.map((name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8')));

  for (const page of pages) {
    assert.doesNotMatch(page, /href="index\.html#network">Partner Garages<\/a>/);
    assert.match(page, /href="become-partner\.html">Partner Garages<\/a>/);
  }
});
