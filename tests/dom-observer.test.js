import test from "node:test";
import assert from "node:assert/strict";

import { createDomObserver } from "../core/dom-observer.js";

function text(nodeValue) {
  return { nodeType: 3, nodeValue, childNodes: [], parentNode: null };
}

function element(tagName, children = []) {
  return {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    childNodes: children,
    attributes: {},
    style: {},
    parentNode: null,
    ownerDocument: null,
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    hasAttribute(name) {
      return Object.hasOwn(this.attributes, name);
    }
  };
}

function connectTree(root) {
  const document = {
    defaultView: { getComputedStyle: (node) => node.style ?? {} }
  };

  function connect(node, parent = null) {
    node.parentNode = parent;
    node.ownerDocument = document;
    for (const child of node.childNodes ?? []) connect(child, node);
  }

  connect(root);
  return root;
}

class FakeMutationObserver {
  static latest = null;

  constructor(callback) {
    this.callback = callback;
    this.observed = null;
    this.disconnected = false;
    FakeMutationObserver.latest = this;
  }

  observe(root, options) {
    this.observed = { root, options };
  }

  disconnect() {
    this.disconnected = true;
  }

  emit(mutations) {
    this.callback(mutations);
  }
}

function immediateScheduler(task) {
  task();
}

test("performs an initial scan and configures a constrained observer", () => {
  const root = connectTree(element("main", [element("p", [text("Solde : 500 FCFA")])]));
  const batches = [];
  const observer = createDomObserver({
    root,
    onRecords: (records) => batches.push(records),
    MutationObserverImpl: FakeMutationObserver,
    scheduleTask: immediateScheduler
  });

  observer.start();

  assert.equal(batches.length, 1);
  assert.equal(batches[0][0].text, "Solde : 500 FCFA");
  assert.deepEqual(FakeMutationObserver.latest.observed.options.attributeFilter, [
    "hidden",
    "aria-hidden",
    "inert",
    "style",
    "class"
  ]);
});

test("reports a message added after page load", () => {
  const root = connectTree(element("main", [element("p", [text("Accueil")])]));
  const batches = [];
  const observer = createDomObserver({
    root,
    onRecords: (records) => batches.push(records),
    MutationObserverImpl: FakeMutationObserver,
    scheduleTask: immediateScheduler
  });
  observer.start();

  const warning = connectTree(element("div", [text("Transaction échouée")])) ;
  warning.parentNode = root;
  root.childNodes.push(warning);
  FakeMutationObserver.latest.emit([
    { type: "childList", target: root, addedNodes: [warning] }
  ]);

  assert.equal(batches.length, 2);
  assert.equal(batches[1][0].text, "Transaction échouée");
});

test("reports a changed text node but suppresses an unchanged duplicate", () => {
  const message = text("En attente");
  const paragraph = element("p", [message]);
  const root = connectTree(element("main", [paragraph]));
  const batches = [];
  const observer = createDomObserver({
    root,
    onRecords: (records) => batches.push(records),
    MutationObserverImpl: FakeMutationObserver,
    scheduleTask: immediateScheduler
  });
  observer.start();

  FakeMutationObserver.latest.emit([{ type: "characterData", target: message }]);
  assert.equal(batches.length, 1);

  message.nodeValue = "Transaction réussie";
  FakeMutationObserver.latest.emit([{ type: "characterData", target: message }]);

  assert.equal(batches.length, 2);
  assert.equal(batches[1][0].text, "Transaction réussie");
});

test("disconnect stops future mutation processing", () => {
  const root = connectTree(element("main", [element("p", [text("Accueil")])]));
  const batches = [];
  const observer = createDomObserver({
    root,
    onRecords: (records) => batches.push(records),
    MutationObserverImpl: FakeMutationObserver,
    scheduleTask: immediateScheduler
  });
  observer.start();
  observer.disconnect();

  FakeMutationObserver.latest.emit([
    { type: "childList", target: root, addedNodes: [element("p", [text("Ignored")])] }
  ]);

  assert.equal(observer.started, false);
  assert.equal(batches.length, 1);
  assert.equal(FakeMutationObserver.latest.disconnected, true);
});
