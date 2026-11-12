import test from "node:test";
import assert from "node:assert/strict";

import {
  createNodePath,
  extractFinancialTokens,
  extractVisibleText,
  isElementHidden
} from "../core/dom-extractor.js";

function text(nodeValue) {
  return { nodeType: 3, nodeValue, childNodes: [], parentNode: null };
}

function element(tagName, { attributes = {}, style = {}, children = [] } = {}) {
  return {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    attributes,
    style,
    childNodes: children,
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
    defaultView: {
      getComputedStyle(node) {
        return node.style ?? {};
      }
    }
  };

  function connect(node, parent = null) {
    node.parentNode = parent;
    node.ownerDocument = document;
    for (const child of node.childNodes ?? []) connect(child, node);
  }

  connect(root);
  return root;
}

test("extracts visible text and preserves Cameroonian characters", () => {
  const root = connectTree(
    element("main", {
      children: [
        element("h1", { children: [text("  Bonjour, Mɛlɛŋ́  ")] }),
        element("p", { children: [text("Solde disponible : 250 000 FCFA")] })
      ]
    })
  );

  const records = extractVisibleText(root);

  assert.deepEqual(records.map(({ text: value }) => value), [
    "Bonjour, Mɛlɛŋ́",
    "Solde disponible : 250 000 FCFA"
  ]);
  assert.deepEqual(records[1].financialTokens, [
    { raw: "250 000 FCFA", amount: "250000", currency: "XAF" }
  ]);
});

test("ignores hidden, inert, scripted and explicitly excluded content", () => {
  const root = connectTree(
    element("main", {
      children: [
        element("p", { attributes: { hidden: "" }, children: [text("hidden attr")] }),
        element("p", { attributes: { "aria-hidden": "true" }, children: [text("aria hidden")] }),
        element("p", { attributes: { inert: "" }, children: [text("inert")] }),
        element("p", { attributes: { "data-nolia-ignore": "" }, children: [text("ignored")] }),
        element("p", { style: { display: "none" }, children: [text("css hidden")] }),
        element("script", { children: [text("dangerous script text")] }),
        element("template", { children: [text("future template text")] }),
        element("p", { children: [text("visible message")] })
      ]
    })
  );

  assert.deepEqual(extractVisibleText(root).map((record) => record.text), [
    "visible message"
  ]);
});

test("reads button labels but marks them as interactive", () => {
  const root = connectTree(
    element("main", {
      children: [
        element("button", { children: [text("Confirmer le transfert")] }),
        element("p", { children: [text("Récapitulatif")] })
      ]
    })
  );

  const records = extractVisibleText(root);

  assert.equal(records[0].interactive, true);
  assert.equal(records[1].interactive, false);
  assert.equal(records[0].node.nodeValue, "Confirmer le transfert");
});

test("does not extract text stored inside form controls", () => {
  const root = connectTree(
    element("main", {
      children: [
        element("textarea", { children: [text("secret typed value")] }),
        element("select", {
          children: [element("option", { children: [text("Beneficiary option")] })]
        }),
        element("p", { children: [text("Safe label")] })
      ]
    })
  );

  assert.deepEqual(extractVisibleText(root).map((record) => record.text), ["Safe label"]);
});

test("extracts several XAF values without numeric rounding", () => {
  assert.deepEqual(
    extractFinancialTokens("Montant 9 007 199 254 740 993 XAF, frais 500 FCFA"),
    [
      { raw: "9 007 199 254 740 993 XAF", amount: "9007199254740993", currency: "XAF" },
      { raw: "500 FCFA", amount: "500", currency: "XAF" }
    ]
  );
});

test("creates a structural identifier without mutating the page", () => {
  const message = text("Message dynamique");
  const root = connectTree(
    element("main", { children: [element("section", { children: [message] })] })
  );

  assert.equal(createNodePath(message), "section[0]/#text[0]");
  assert.equal(root.attributes["data-nolia-id"], undefined);
});

test("recognizes common hidden styles", () => {
  const hidden = connectTree(element("p", { style: { visibility: "hidden" } }));
  assert.equal(isElementHidden(hidden), true);
});

test("keeps the amount regex linear on long numeric text without currency", () => {
  const input = "1 ".repeat(4000) + "x";
  const started = performance.now();
  const tokens = extractFinancialTokens(input);
  const elapsed = performance.now() - started;

  assert.deepEqual(tokens, []);
  assert.ok(elapsed < 500, `regex took ${elapsed.toFixed(1)} ms`);
});

test("still extracts amounts followed by a currency after spaced digits", () => {
  assert.deepEqual(extractFinancialTokens("Total 1 2 3 FCFA"), [
    { raw: "1 2 3 FCFA", amount: "123", currency: "XAF" }
  ]);
});
