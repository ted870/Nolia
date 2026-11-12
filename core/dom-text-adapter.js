import { normalizeText } from "./semantic-contract.js";

const TEXT_NODE = 3;

function assertProtectedSlotsPreserved(renderedText, slots = {}) {
  const normalizedRendered = normalizeText(renderedText);
  for (const [slotName, value] of Object.entries(slots)) {
    const normalizedValue = normalizeText(value);
    if (!normalizedRendered.includes(normalizedValue)) {
      throw new TypeError(`Protected slot {${slotName}} was not preserved.`);
    }
  }
}

/**
 * Apply plain-text replacements to classified text nodes and restore them.
 * The adapter never writes innerHTML, attributes, form values or event data.
 */
export function createDomTextAdapter({ renderText }) {
  if (typeof renderText !== "function") {
    throw new TypeError("renderText must be a function.");
  }

  const managed = new Map();

  function applyRecord(record, classification) {
    if (classification?.kind !== "message") return { outcome: "skipped" };

    const node = record?.node;
    if (!node || node.nodeType !== TEXT_NODE) return { outcome: "invalid-node" };

    const currentText = String(node.nodeValue ?? "");
    if (normalizeText(currentText) !== normalizeText(record.text)) {
      return { outcome: "stale-record" };
    }

    const renderedText = renderText(record, classification);
    if (typeof renderedText !== "string" || !normalizeText(renderedText)) {
      throw new TypeError("The rendered display text must be a non-empty string.");
    }
    assertProtectedSlotsPreserved(renderedText, classification.slots);

    if (renderedText === currentText) return { outcome: "unchanged" };

    managed.set(node, { originalText: currentText, renderedText });
    node.nodeValue = renderedText;
    return { outcome: "applied", messageId: classification.messageId };
  }

  function isManagedRecord(record) {
    const state = managed.get(record?.node);
    if (!state) return false;
    if (String(record.node.nodeValue ?? "") === state.renderedText) return true;

    // The host page changed the node after Nolia rendered it. Relinquish it so
    // the new source text can be classified instead of overwriting page state.
    managed.delete(record.node);
    return false;
  }

  function restore() {
    let restored = 0;
    let hostChanged = 0;

    for (const [node, state] of managed) {
      managed.delete(node);
      if (String(node.nodeValue ?? "") !== state.renderedText) {
        hostChanged += 1;
        continue;
      }
      node.nodeValue = state.originalText;
      restored += 1;
    }

    return Object.freeze({ restored, hostChanged });
  }

  return Object.freeze({
    applyRecord,
    isManagedRecord,
    restore,
    get size() {
      return managed.size;
    }
  });
}

/** Visible diagnostic renderer. It is not a translation and cannot hide that. */
export function renderTestDisplay(record, classification) {
  if (classification?.kind !== "message") {
    throw new TypeError("Test display accepts only catalog messages.");
  }
  return `[TEST] ${record.text}`;
}
