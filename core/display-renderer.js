/**
 * Display dispatcher for the DOM adapter (v0.5.0).
 *
 * - message  → the pack's text for one of the 63 catalog messages (v0.5.1);
 * - intent   → French source + validated explanation + values (renderIntent);
 * - fallback → French source + "not recognized" notice + values (renderFallback).
 *
 * Only the TEST pack is accepted in test mode. A demo renderer can be created
 * only with a pack that template-renderer.js accepts as validated. A
 * provisional renderer prefixes every text with [AUTO] and skips the messages
 * that the (partial) provisional pack does not contain.
 */

import { renderFallback, renderIntent } from "./intent-renderer.js";
import { renderCatalogMessage } from "./language-pack.js";
import { AUTO_MARKER } from "./template-renderer.js";

export function createDisplayRenderer(pack, { mode = "demo" } = {}) {
  if (!["demo", "test", "provisional"].includes(mode)) throw new TypeError(`Unsupported mode: ${mode}`);
  // Provisional (machine) texts are always shown with a visible [AUTO] prefix.
  const marker = mode === "provisional" ? AUTO_MARKER : "";
  const expectedStatus = mode === "test" ? "test" : mode === "provisional" ? "provisional" : "validated";

  function templateIdOf(classification) {
    if (classification?.kind === "message") return classification.messageId;
    if (classification?.kind === "intent") return classification.contract.intentId;
    if (classification?.kind === "fallback") return classification.contract.intentId;
    return null;
  }

  function renderText(record, classification) {
    const originalText = String(record?.node?.nodeValue ?? record?.text ?? "");
    if (classification?.kind === "message") {
      // The 63+ catalog messages come from the pack (TEST, provisional or validated).
      const text = renderCatalogMessage(pack, classification, { mode });
      return marker ? `${marker} ${text}` : text;
    }
    if (classification?.kind === "intent") {
      return renderIntent(pack, classification.contract, { mode, originalText, marker }).text;
    }
    if (classification?.kind === "fallback") {
      return renderFallback(pack, classification, { mode, originalText, marker }).text;
    }
    throw new TypeError(`Nothing to display for kind ${String(classification?.kind)}.`);
  }

  /** A partial provisional pack leaves the messages it lacks in French. */
  renderText.canRender = (classification) => {
    const id = templateIdOf(classification);
    return id !== null && pack?.templates?.[id]?.status === expectedStatus;
  };
  return renderText;
}
