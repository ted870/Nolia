import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../manifest.json", import.meta.url), "utf8")
);

test("uses Chrome Manifest V3", () => {
  assert.equal(manifest.manifest_version, 3);
});

test("runs only on the Safinum hackathon test path", () => {
  assert.deepEqual(manifest.content_scripts[0].matches, [
    "https://safinum.cm/hackathon-test",
    "https://safinum.cm/hackathon-test/*"
  ]);
  assert.equal(manifest.content_scripts[0].run_at, "document_idle");
});

test("requests no browser permissions and no broad host access", () => {
  assert.equal("permissions" in manifest, false);
  assert.equal("host_permissions" in manifest, false);
});

test("exposes only local core modules to the authorized page", () => {
  assert.deepEqual(manifest.web_accessible_resources, [
    {
      resources: ["core/*.js"],
      matches: ["https://safinum.cm/*"]
    }
  ]);
});

test("uses only valid Chrome match patterns (no wildcard inside the host or path stem)", () => {
  const pattern = /^https:\/\/[a-z0-9.-]+\/(\*|[^*]*(\/\*)?)$/u;
  // Chrome rejects web_accessible_resources matches with a path other than /*
  // (verified: "https://safinum.cm/hackathon-test/*" -> "Invalid match pattern").
  for (const entry of manifest.web_accessible_resources) {
    for (const value of entry.matches) {
      assert.match(value, /^https:\/\/[a-z0-9.-]+\/\*$/u, `WAR match must be host + /*: ${value}`);
    }
  }
  const all = [
    ...manifest.content_scripts.flatMap((entry) => entry.matches),
    ...manifest.web_accessible_resources.flatMap((entry) => entry.matches)
  ];
  for (const value of all) {
    assert.match(value, pattern, `invalid match pattern: ${value}`);
  }
});
