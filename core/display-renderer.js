/**
 * Display dispatcher for the DOM adapter (v0.5.0).
 *
 * - message  → v0.4.0 behaviour (renderTestDisplay in test mode);
 * - intent   → French source + validated explanation + values (renderIntent);
 * - fallback → French source + "not recognized" notice + values (renderFallback).
 *
 * Only the TEST pack is accepted in test mode. A demo renderer can be created
 * only with a pack that template-renderer.js accepts as validated.
 */

import { renderTestDisplay } from "./dom-text-adapter.js";
import { renderFallback, renderIntent } from "./intent-renderer.js";

export function createDisplayRenderer(pack, { mode = "demo" } = {}) {
  if (mode !== "demo" && mode !== "test") throw new TypeError(`Unsupported mode: ${mode}`);

  return function renderText(record, classification) {
    const originalText = String(record?.node?.nodeValue ?? record?.text ?? "");
    if (classification?.kind === "message") {
      if (mode === "test") return renderTestDisplay(record, classification);
      throw new TypeError("Catalog messages need a validated message pack (not available in v0.5.0).");
    }
    if (classification?.kind === "intent") {
      return renderIntent(pack, classification.contract, { mode, originalText }).text;
    }
    if (classification?.kind === "fallback") {
      return renderFallback(pack, classification, { mode, originalText }).text;
    }
    throw new TypeError(`Nothing to display for kind ${String(classification?.kind)}.`);
  };
}
