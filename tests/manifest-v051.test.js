import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

test("the manifest is a valid Manifest V3 for version 0.5.1 or later", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.ok(["0.5.1", "0.5.2", "0.5.3", "0.5.4"].includes(manifest.version), manifest.version);
  assert.equal(packageJson.version, manifest.version);
  assert.match(manifest.version, /^\d+(\.\d+){0,3}$/u);
  assert.equal(typeof manifest.name, "string");
  assert.ok(manifest.description.length <= 132, "Chrome limits the description to 132 characters");
  assert.equal("background" in manifest, false);
  assert.equal("permissions" in manifest, false);
  assert.equal("host_permissions" in manifest, false);
  assert.equal("externally_connectable" in manifest, false);
  assert.equal("content_security_policy" in manifest, false);
});

test("every file declared by the manifest exists", async () => {
  for (const script of manifest.content_scripts.flatMap((entry) => entry.js)) {
    await access(new URL(script, root));
  }
});

test("every module imported by the content script is a core/*.js web-accessible resource", async () => {
  const source = await readFile(new URL("extension/content-script.js", root), "utf8");
  const imported = [...source.matchAll(/getURL\("([^"]+)"\)/gu)].map((match) => match[1]);
  assert.ok(imported.length >= 4);
  for (const path of imported) {
    assert.match(path, /^core\/[a-z-]+\.js$/u);
    await access(new URL(path, root));
  }
});

test("core modules import only local relative modules (no remote script, no package)", async () => {
  for (const file of await readdir(new URL("core/", root))) {
    const source = await readFile(new URL(`core/${file}`, root), "utf8");
    for (const match of source.matchAll(/^\s*(?:import|export)[^"']*from\s+["']([^"']+)["']/gmu)) {
      assert.match(match[1], /^\.\/[a-z-]+\.js$/u, `${file} imports ${match[1]}`);
    }
    assert.doesNotMatch(source, /\bfetch\(|XMLHttpRequest|WebSocket|sendBeacon|chrome\.storage|localStorage|indexedDB/u, file);
  }
});

test("the extension never logs page text: console calls carry fixed messages only", async () => {
  const source = await readFile(new URL("extension/content-script.js", root), "utf8");
  for (const match of source.matchAll(/console\.\w+\(([^;]*)\);/gu)) {
    assert.doesNotMatch(match[1], /record|text|nodeValue|snapshot/u, match[0]);
  }
});
