/**
 * Minimal DOM for tests: elements, text nodes, attributes, a closed shadow
 * root, click events and a controllable MutationObserver. Not a browser:
 * the real Chrome check is scripts/chrome-smoke.mjs.
 */

class FakeNode {
  constructor(nodeType, ownerDocument) {
    this.nodeType = nodeType;
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
  }

  get isConnected() {
    let current = this;
    while (current.parentNode) current = current.parentNode;
    return current === this.ownerDocument.documentElement;
  }

  append(...nodes) {
    for (const node of nodes) {
      const child = typeof node === "string" ? this.ownerDocument.createTextNode(node) : node;
      child.parentNode?.removeChild?.(child);
      child.parentNode = this;
      this.childNodes.push(child);
      this.ownerDocument.notify({ type: "childList", target: this, addedNodes: [child] });
    }
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  removeChild(node) {
    this.childNodes = this.childNodes.filter((child) => child !== node);
    node.parentNode = null;
    return node;
  }
}

export class FakeText extends FakeNode {
  constructor(value, ownerDocument) {
    super(3, ownerDocument);
    this._value = value;
  }

  get nodeValue() {
    return this._value;
  }

  set nodeValue(value) {
    this._value = value;
    this.ownerDocument.notify({ type: "characterData", target: this });
  }

  get textContent() {
    return this._value;
  }
}

export class FakeElement extends FakeNode {
  constructor(tagName, ownerDocument) {
    super(1, ownerDocument);
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.style = {};
    this.listeners = {};
    this.shadow = null;
    this.disabled = false;
    this.hidden = false;
  }

  getAttribute(name) {
    return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
  }

  hasAttribute(name) {
    return Object.hasOwn(this.attributes, name);
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  set textContent(value) {
    this.childNodes = [];
    if (value !== "") {
      const text = new FakeText(String(value), this.ownerDocument);
      text.parentNode = this;
      this.childNodes.push(text);
    }
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent ?? "").join("");
  }

  set innerHTML(_) {
    throw new Error("innerHTML is forbidden in Nolia");
  }

  attachShadow({ mode }) {
    // A shadow root is not part of childNodes: the page and the extractor
    // walking the light DOM never see its content.
    this.shadow = new FakeShadowRoot(this.ownerDocument, mode);
    return this.shadow;
  }

  addEventListener(type, listener) {
    (this.listeners[type] ??= []).push(listener);
  }

  click() {
    if (this.disabled) return;
    for (const listener of this.listeners.click ?? []) listener({ type: "click", target: this });
  }
}

class FakeShadowRoot extends FakeNode {
  constructor(ownerDocument, mode) {
    super(11, ownerDocument);
    this.mode = mode;
  }

  get textContent() {
    return this.childNodes.map((child) => child.textContent ?? "").join("");
  }
}

export class FakeDocument {
  constructor() {
    this.observers = [];
    this.defaultView = { getComputedStyle: (node) => node.style ?? {} };
    this.documentElement = new FakeElement("html", this);
    this.body = new FakeElement("body", this);
    this.documentElement.childNodes.push(this.body);
    this.body.parentNode = this.documentElement;
  }

  createElement(tag) {
    return new FakeElement(tag, this);
  }

  createTextNode(value) {
    return new FakeText(value, this);
  }

  notify(mutation) {
    for (const observer of this.observers) observer.pending.push(mutation);
  }
}

/** MutationObserver bound to a FakeDocument; call flushMutations() to deliver. */
export function fakeMutationObserverFor(document) {
  return class FakeMutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.pending = [];
      document.observers.push(this);
    }

    observe() {}

    disconnect() {
      document.observers = document.observers.filter((observer) => observer !== this);
    }

    deliver() {
      const batch = this.pending;
      this.pending = [];
      if (batch.length > 0) this.callback(batch);
    }
  };
}

export function flushMutations(document) {
  for (const observer of [...document.observers]) observer.deliver();
}

/** Build <tag>text</tag> under parent and return the text node. */
export function addText(document, parent, text, tag = "p") {
  const element = document.createElement(tag);
  element.append(document.createTextNode(text));
  parent.append(element);
  return element.childNodes[0];
}
