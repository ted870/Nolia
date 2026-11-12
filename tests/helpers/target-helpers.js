/**
 * Shared helpers for the target-language and provisional tests.
 */
import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { TARGET_LANGUAGE } from "../../core/target-language.js";
import { TEST_PACK } from "../../core/locale-test-pack.js";
import { createNoliaController } from "../../core/nolia-controller.js";
import { createNoliaPanel } from "../../core/nolia-panel.js";
import { FakeDocument, addText, fakeMutationObserverFor } from "./fake-dom.js";

const root = new URL("../../", import.meta.url);
export const OTHER_LANGUAGE = TARGET_LANGUAGE.code === "bum" ? "ewo" : "bum";

export function setupPanel(target) {
  const document = new FakeDocument();
  const node = addText(document, document.body, "Continuer", "button");
  let panel = null;
  const controller = createNoliaController({
    root: document.documentElement,
    packs: { test: TEST_PACK, target },
    version: "0.5.5",
    onStatus: (status) => panel?.render(status),
    MutationObserverImpl: fakeMutationObserverFor(document),
    scheduleTask: (task) => task()
  });
  panel = createNoliaPanel({ document, controller });
  panel.mount(document.body);
  controller.start();
  return { document, node, controller, panel };
}

/** Run the install script with its output redirected to a temporary file. */
export async function runInstall(args) {
  const directory = await mkdtemp(join(tmpdir(), "nolia-"));
  const output = join(directory, "locale-target-pack.js");
  const before = await readFile(new URL("core/locale-target-pack.js", root), "utf8");
  try {
    const result = await promisify(execFile)(process.execPath, ["scripts/install-language-pack.js", ...args], {
      cwd: root,
      env: { ...process.env, NOLIA_TARGET_MODULE: output }
    });
    return { ok: true, stdout: result.stdout, output: await readFile(output, "utf8") };
  } catch (error) {
    return { ok: false, code: error.code, stderr: error.stderr };
  } finally {
    // The shipped module must never be touched by a test.
    assert.equal(await readFile(new URL("core/locale-target-pack.js", root), "utf8"), before);
  }
}

export async function writeTempPack(pack) {
  const path = join(await mkdtemp(join(tmpdir(), "nolia-")), "pack.json");
  await writeFile(path, JSON.stringify(pack));
  return path;
}

