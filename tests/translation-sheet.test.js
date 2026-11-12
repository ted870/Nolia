import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { HEADER, SHEET_FILES, buildIntentRows, buildMessageRows, toCsv } from "../scripts/build-translation-sheet.js";

test("the translation sheet has exactly 66 rows with the 13 requested columns", () => {
  const rows = buildMessageRows();
  assert.equal(rows.length, 66); // 63 until v0.5.2
  assert.equal(HEADER.length, 13);
  assert.equal(new Set(rows.map((row) => row[0])).size, 66);
  for (const row of rows) assert.equal(row.length, 13);
});

test("no translation, validator or date is pre-filled", () => {
  for (const row of [...buildMessageRows(), ...buildIntentRows()]) {
    assert.deepEqual(row.slice(6, 11), ["", "", "", "", ""], row[0]);
    assert.equal(row[11], "à traduire");
  }
});

test("the committed CSV files are in sync with the code", async () => {
  const read = (name) => readFile(new URL(`../docs/${name}`, import.meta.url), "utf8");
  assert.equal(await read(SHEET_FILES.messages), toCsv([HEADER, ...buildMessageRows()]));
  assert.equal(await read(SHEET_FILES.intents), toCsv([HEADER, ...buildIntentRows()]));
});
