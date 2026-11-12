import { extractVisibleText } from "./dom-extractor.js";

const ELEMENT_NODE = 1;

/**
 * Observe a page and report only new or changed visible text records.
 *
 * The MutationObserver implementation and scheduler are injectable so the
 * behavior can be tested without Chrome. The observer never changes the DOM.
 *
 * @param {object} options
 * @param {Node|object} options.root
 * @param {(records: Array<object>) => void} options.onRecords
 * @param {(root: Node|object) => Array<object>} [options.extract]
 * @param {typeof MutationObserver} [options.MutationObserverImpl]
 * @param {(task: () => void) => void} [options.scheduleTask]
 */
export function createDomObserver({
  root,
  onRecords,
  extract = extractVisibleText,
  MutationObserverImpl = globalThis.MutationObserver,
  scheduleTask = globalThis.queueMicrotask
}) {
  if (!root) throw new TypeError("An observation root is required.");
  if (typeof onRecords !== "function") {
    throw new TypeError("onRecords must be a function.");
  }
  if (typeof MutationObserverImpl !== "function") {
    throw new TypeError("MutationObserver is not available.");
  }
  if (typeof scheduleTask !== "function") {
    throw new TypeError("A task scheduler is required.");
  }

  const lastTextByNode = new WeakMap();
  const pendingRoots = new Set();
  let started = false;
  let taskScheduled = false;

  function emitFreshRecords(candidateRoots) {
    const freshRecords = [];

    for (const candidate of candidateRoots) {
      for (const record of extract(candidate)) {
        if (lastTextByNode.get(record.node) === record.text) continue;
        lastTextByNode.set(record.node, record.text);
        freshRecords.push(record);
      }
    }

    if (freshRecords.length > 0) onRecords(freshRecords);
  }

  // Mutations can report any node type (text, comment, processing instruction).
  // Only elements are valid extraction roots, so other nodes are mapped to their
  // nearest element ancestor. Without this, a comment node throws in the
  // extractor during the deferred flush and drops the rest of the batch.
  function normalizeCandidate(node) {
    let current = node ?? null;
    while (current && current.nodeType !== ELEMENT_NODE) {
      current = current.parentNode ?? null;
    }
    return current;
  }

  function flush() {
    taskScheduled = false;
    const candidates = [...pendingRoots];
    pendingRoots.clear();
    if (candidates.length > 0) emitFreshRecords(candidates);
  }

  function enqueue(node) {
    const candidate = normalizeCandidate(node);
    if (!candidate) return;
    pendingRoots.add(candidate);

    if (!taskScheduled) {
      taskScheduled = true;
      scheduleTask(flush);
    }
  }

  const mutationObserver = new MutationObserverImpl((mutations) => {
    if (!started) return;

    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const addedNode of Array.from(mutation.addedNodes ?? [])) {
          enqueue(addedNode);
        }
      } else {
        enqueue(mutation.target);
      }
    }
  });

  return Object.freeze({
    start() {
      if (started) return;
      started = true;
      emitFreshRecords([root]);
      mutationObserver.observe(root, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["hidden", "aria-hidden", "inert", "style", "class"]
      });
    },

    disconnect() {
      if (!started) return;
      started = false;
      pendingRoots.clear();
      taskScheduled = false;
      mutationObserver.disconnect();
    },

    flush,

    get started() {
      return started;
    }
  });
}
