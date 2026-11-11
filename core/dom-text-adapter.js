import { normalizeText } from "./semantic-contract.js";

const TEXT_NODE = 3;
const DISPLAYABLE_KINDS = new Set(["message", "intent", "fallback"]);

/**
 * Intent and degraded-mode displays must keep the French source verbatim at
 * the start and carry every critical value of the contract after it.
 */
function assertSourceAndValuesPreserved(renderedText, currentText, contract) {
  if (!renderedText.startsWith(currentText)) {
    throw new TypeError("The French source text was not preserved.");
  }
  const appended = renderedText.slice(currentText.length);
  for (const value of contract?.values ?? []) {
    if (!appended.includes(value.raw)) {
      throw new TypeError(`Protected value {${value.type}} was not preserved.`);
    }
  }
}

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
    if (!DISPLAYABLE_KINDS.has(classification?.kind)) return { outcome: "skipped" };

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
    if (classification.kind === "message") {
      assertProtectedSlotsPreserved(renderedText, classification.slots);
    } else {
      assertSourceAndValuesPreserved(renderedText, currentText, classification.contract);
    }

    if (renderedText === currentText) return { outcome: "unchanged" };

    managed.set(node, { originalText: currentText, renderedText });
    node.nodeValue = renderedText;
    if (classification.kind === "message") {
      return { outcome: "applied", messageId: classification.messageId };
    }
    return {
      outcome: "applied",
      kind: classification.kind,
      intentId: classification.contract.intentId
    };
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
