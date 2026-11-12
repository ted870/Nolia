/**
 * Nolia controller (v0.5.1): observation, display modes and restoration.
 *
 * Separated from extension/content-script.js so that it can be tested without
 * Chrome. It reads visible text, classifies it, and in TEST or ewondo mode
 * replaces catalog messages or appends explanations through the DOM adapter.
 * "Restaurer le français" puts back every original text node exactly.
 *
 * Privacy: the status holds only counters and identifiers. No page text,
 * amount, name, account or reference is stored, logged or sent.
 */

import { createDomObserver } from "./dom-observer.js";
import { extractVisibleText } from "./dom-extractor.js";
import { analyzeTextRecord } from "./text-analyzer.js";
import { createDomTextAdapter } from "./dom-text-adapter.js";
import { createDisplayRenderer } from "./display-renderer.js";
import { summarizeRefusal, validateLanguagePack } from "./language-pack.js";

export const MODES = Object.freeze({ OBSERVATION: "observation", TEST: "test", EWONDO: "ewondo" });

const DISPLAYABLE = new Set(["message", "intent", "fallback"]);

function bucketOf(classification) {
  switch (classification.kind) {
    case "message":
    case "intent":
      return "recognized";
    case "protected":
      return "protected";
    case "ignored":
      return "ignored";
    default:
      return "unknown"; // unknown fragments and degraded-mode sentences
  }
}

/**
 * @param {object} options
 * @param {object} options.root Observation root (document.documentElement).
 * @param {{test: object, ewo: object|null}} options.packs
 * @param {string} options.version
 * @param {(status: object) => void} [options.onStatus]
 * @param {typeof MutationObserver} [options.MutationObserverImpl]
 * @param {(task: () => void) => void} [options.scheduleTask]
 * @param {(error: unknown) => void} [options.onDisplayError] Receives the error only, never page text.
 */
export function createNoliaController({
  root,
  packs,
  version,
  onStatus = () => {},
  MutationObserverImpl,
  scheduleTask,
  onDisplayError = () => {}
}) {
  const ewoValidation = validateLanguagePack(packs?.ewo ?? null, { mode: "demo" });
  const testValidation = validateLanguagePack(packs?.test ?? null, { mode: "test" });

  const status = {
    name: "Nolia",
    version,
    mode: MODES.OBSERVATION,
    state: "starting",
    recognizedCount: 0,
    protectedCount: 0,
    unknownCount: 0,
    intentCount: 0,
    fallbackCount: 0,
    displayedCount: 0,
    displayErrorCount: 0,
    recognizedMessageIds: [],
    recognizedIntentIds: [],
    fallbackReasons: {},
    testAvailable: testValidation.ok,
    ewondoAvailable: ewoValidation.ok,
    ewondoRefusal: ewoValidation.ok ? "" : summarizeRefusal(ewoValidation),
    lastObservationAt: null,
    errorCode: null
  };

  // node -> classification, for nodes currently known. Only counted while the
  // node is still attached; the classification holds ids, never text.
  const known = new Map();
  let adapter = null;

  function snapshot() {
    return Object.freeze({
      ...status,
      recognizedMessageIds: [...status.recognizedMessageIds],
      recognizedIntentIds: [...status.recognizedIntentIds],
      fallbackReasons: { ...status.fallbackReasons }
    });
  }

  function recount() {
    const counts = { recognized: 0, protected: 0, unknown: 0, ignored: 0 };
    const messageIds = new Set();
    const intentIds = new Set();
    const reasons = {};
    let intents = 0;
    let fallbacks = 0;
    for (const [node, classification] of known) {
      if (node.isConnected === false) {
        known.delete(node);
        continue;
      }
      counts[bucketOf(classification)] += 1;
      if (classification.kind === "message") messageIds.add(classification.messageId);
      if (classification.kind === "intent") {
        intents += 1;
        intentIds.add(classification.intentId);
      }
      if (classification.kind === "fallback") {
        fallbacks += 1;
        reasons[classification.reason] = (reasons[classification.reason] ?? 0) + 1;
      }
    }
    status.recognizedCount = counts.recognized;
    status.protectedCount = counts.protected;
    status.unknownCount = counts.unknown;
    status.intentCount = intents;
    status.fallbackCount = fallbacks;
    status.recognizedMessageIds = [...messageIds].sort();
    status.recognizedIntentIds = [...intentIds].sort();
    status.fallbackReasons = reasons;
    status.displayedCount = adapter ? adapter.size : 0;
  }

  function display(record, classification) {
    if (!adapter || !DISPLAYABLE.has(classification.kind)) return;
    try {
      adapter.applyRecord(record, classification);
    } catch (error) {
      status.displayErrorCount += 1;
      onDisplayError(error);
    }
  }

  function handleRecords(records) {
    for (const record of records) {
      if (adapter && adapter.isManagedRecord(record)) continue; // Nolia's own text
      const classification = analyzeTextRecord(record);
      known.set(record.node, classification);
      display(record, classification);
    }
    recount();
    status.lastObservationAt = new Date().toISOString();
    status.state = "observing";
    onStatus(snapshot());
  }

  const observer = createDomObserver({
    root,
    onRecords: handleRecords,
    ...(MutationObserverImpl ? { MutationObserverImpl } : {}),
    ...(scheduleTask ? { scheduleTask } : {})
  });

  function restoreFrench() {
    const result = adapter ? adapter.restore() : Object.freeze({ restored: 0, hostChanged: 0 });
    adapter = null;
    status.mode = MODES.OBSERVATION;
    // Restored nodes are observed again as French text.
    observer.flush();
    recount();
    onStatus(snapshot());
    return result;
  }

  function enable(mode, pack) {
    if (adapter) restoreFrench();
    adapter = createDomTextAdapter({
      renderText: createDisplayRenderer(pack, { mode: mode === MODES.TEST ? "test" : "demo" })
    });
    status.mode = mode;
    for (const record of extractVisibleText(root)) {
      const classification = analyzeTextRecord(record);
      known.set(record.node, classification);
      display(record, classification);
    }
    observer.flush();
    recount();
    onStatus(snapshot());
    return Object.freeze({ enabled: true, mode, displayedCount: adapter.size });
  }

  return Object.freeze({
    start() {
      try {
        observer.start();
        if (status.state === "starting") {
          status.state = "observing";
          onStatus(snapshot());
        }
      } catch (error) {
        status.state = "error";
        status.errorCode = "OBSERVER_START_FAILED";
        onStatus(snapshot());
        throw error;
      }
    },
    stop() {
      restoreFrench();
      observer.disconnect();
    },
    enableTest() {
      if (!testValidation.ok) {
        return Object.freeze({ enabled: false, mode: status.mode, reason: summarizeRefusal(testValidation) });
      }
      return enable(MODES.TEST, packs.test);
    },
    enableEwondo() {
      if (!ewoValidation.ok) {
        return Object.freeze({ enabled: false, mode: status.mode, reason: status.ewondoRefusal });
      }
      return enable(MODES.EWONDO, packs.ewo);
    },
    restoreFrench,
    get status() {
      return snapshot();
    }
  });
}
