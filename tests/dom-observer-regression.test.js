import test from "node:test";
import assert from "node:assert/strict";

import { createDomObserver } from "../core/dom-observer.js";

function fakeRoot() {
  return {
    nodeType: 1,
    tagName: "HTML",
    childNodes: [],
    getAttribute: () => null,
    hasAttribute: () => false
  };
}

test("does not throw when a comment node is mutated or added", () => {
  const root = fakeRoot();
  let observerInstance;
  class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      observerInstance = this;
    }
    observe() {}
    disconnect() {}
  }

  const records = [];
  const observer = createDomObserver({
    root,
    onRecords: (batch) => records.push(...batch),
    MutationObserverImpl: FakeMutationObserver,
    scheduleTask: (task) => task()
  });

  observer.start();
  const comment = { nodeType: 8, nodeValue: "note", parentNode: root, childNodes: [] };

  assert.doesNotThrow(() =>
    observerInstance.callback([
      { type: "childList", addedNodes: [comment], target: root },
      { type: "characterData", addedNodes: [], target: comment }
    ])
  );
});
