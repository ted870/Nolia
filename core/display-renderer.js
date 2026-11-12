/**
 * Display dispatcher for the DOM adapter (v0.5.0).
 *
 * - message  → the pack's text for one of the 63 catalog messages (v0.5.1);
 * - intent   → French source + validated explanation + values (renderIntent);
 * - fallback → French source + "not recognized" notice + values (renderFallback).
 *
 * Only the TEST pack is accepted in test mode. A demo renderer can be created
 * only with a pack that template-renderer.js accepts as validated.
 */

import { renderFallback, renderIntent } from "./intent-renderer.js";
import { renderCatalogMessage } from "./language-pack.js";

export function createDisplayRenderer(pack, { mode = "demo" } = {}) {
  if (mode !== "demo" && mode !== "test") throw new TypeError(`Unsupported mode: ${mode}`);

  return function renderText(record, classification) {
    const originalText = String(record?.node?.nodeValue ?? record?.text ?? "");
    if (classification?.kind === "message") {
      // v0.5.1: the 63 catalog messages come from the pack (TEST or validated).
      return renderCatalogMessage(pack, classification, { mode });
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
