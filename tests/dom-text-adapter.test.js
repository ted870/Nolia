import test from "node:test";
import assert from "node:assert/strict";

import {
  createDomTextAdapter,
  renderTestDisplay
} from "../core/dom-text-adapter.js";

function textNode(value) {
  return { nodeType: 3, nodeValue: value };
}

function message(messageId, slots = {}) {
  return { kind: "message", messageId, role: "label", severity: "normal", slots };
}

test("test display changes only a catalog message and restores it", () => {
  const node = textNode("Continuer");
  const record = { text: "Continuer", node, financialTokens: [] };
  const adapter = createDomTextAdapter({ renderText: renderTestDisplay });

  assert.equal(adapter.applyRecord(record, message("common.continue")).outcome, "applied");
  assert.equal(node.nodeValue, "[TEST] Continuer");
  assert.equal(adapter.size, 1);
  assert.deepEqual(adapter.restore(), { restored: 1, hostChanged: 0 });
  assert.equal(node.nodeValue, "Continuer");
});

test("protected and unknown records are never changed", () => {
  const adapter = createDomTextAdapter({ renderText: renderTestDisplay });
  const protectedNode = textNode("25 000 FCFA");
  const unknownNode = textNode("Texte inédit");

  adapter.applyRecord({ text: protectedNode.nodeValue, node: protectedNode }, {
    kind: "protected",
    reason: "financial-value"
  });
  adapter.applyRecord({ text: unknownNode.nodeValue, node: unknownNode }, { kind: "unknown" });

  assert.equal(protectedNode.nodeValue, "25 000 FCFA");
  assert.equal(unknownNode.nodeValue, "Texte inédit");
  assert.equal(adapter.size, 0);
});

test("a protected dynamic slot remains byte-for-byte present", () => {
  const node = textNode("Bonjour, Amina");
  const adapter = createDomTextAdapter({ renderText: renderTestDisplay });
  adapter.applyRecord(
    { text: node.nodeValue, node },
    message("balance.greeting", { name: "Amina" })
  );
  assert.equal(node.nodeValue, "[TEST] Bonjour, Amina");
});

test("rejects a renderer that drops a protected slot", () => {
  const node = textNode("Bonjour, Amina");
  const adapter = createDomTextAdapter({ renderText: () => "[TEST] Bonjour" });
  assert.throws(
    () => adapter.applyRecord(
      { text: node.nodeValue, node },
      message("balance.greeting", { name: "Amina" })
    ),
    /Protected slot \{name\}/u
  );
  assert.equal(node.nodeValue, "Bonjour, Amina");
});

test("does not overwrite a later host-page change during restore", () => {
  const node = textNode("Continuer");
  const adapter = createDomTextAdapter({ renderText: renderTestDisplay });
  adapter.applyRecord({ text: node.nodeValue, node }, message("common.continue"));
  node.nodeValue = "Nouvelle action du site";

  assert.equal(adapter.isManagedRecord({ node }), false);
  assert.deepEqual(adapter.restore(), { restored: 0, hostChanged: 0 });
  assert.equal(node.nodeValue, "Nouvelle action du site");
});
