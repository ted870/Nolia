import { normalizeMoney, normalizeText } from "./semantic-contract.js";

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

const SKIPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "SVG",
  "CANVAS",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "OPTION"
]);

const INTERACTIVE_TAGS = new Set(["A", "BUTTON", "SUMMARY"]);
const INTERACTIVE_ROLES = new Set(["button", "link", "menuitem", "tab"]);

/**
 * @param {Element|object} element
 * @returns {boolean}
 */
export function isElementHidden(element) {
  if (!element || element.nodeType !== ELEMENT_NODE) return false;

  const getAttribute = (name) => element.getAttribute?.(name) ?? null;
  const hasAttribute = (name) => element.hasAttribute?.(name) ?? false;

  if (
    hasAttribute("hidden") ||
    hasAttribute("inert") ||
    getAttribute("aria-hidden") === "true" ||
    getAttribute("data-nolia-ignore") !== null
  ) {
    return true;
  }

  const view = element.ownerDocument?.defaultView;
  const computed = view?.getComputedStyle
    ? view.getComputedStyle(element)
    : element.style ?? {};

  return (
    computed.display === "none" ||
    computed.visibility === "hidden" ||
    computed.visibility === "collapse" ||
    computed.opacity === "0"
  );
}

/**
 * @param {Element|object} element
 * @returns {boolean}
 */
export function isInteractiveElement(element) {
  if (!element || element.nodeType !== ELEMENT_NODE) return false;

  const tagName = String(element.tagName ?? "").toUpperCase();
  const role = String(element.getAttribute?.("role") ?? "").toLowerCase();
  const contentEditable = String(
    element.getAttribute?.("contenteditable") ?? ""
  ).toLowerCase();

  return (
    INTERACTIVE_TAGS.has(tagName) ||
    INTERACTIVE_ROLES.has(role) ||
    (contentEditable === "" && element.hasAttribute?.("contenteditable")) ||
    contentEditable === "true"
  );
}

/**
 * Extract financial values without converting them to floating-point numbers.
 *
 * @param {string} text
 * @returns {Array<{raw: string, amount: string, currency: "XAF"}>}
 */
export function extractFinancialTokens(text) {
  // Bounded separator run: the amount must start with a digit and end with a
  // digit or separator directly before the currency. The bound keeps the match
  // linear on long numeric text that never receives a currency suffix.
  const pattern = /\d[\d\s\u00A0\u202F]{0,40}(?:FCFA|XAF)\b/giu;

  return [...text.matchAll(pattern)].map((match) => {
    const raw = match[0].trim();
    const amountPart = raw.replace(/(?:FCFA|XAF)$/iu, "");

    return {
      raw,
      amount: normalizeMoney(amountPart),
      currency: "XAF"
    };
  });
}

/**
 * @param {Node|object} node
 * @returns {Element|object|null}
 */
function nearestElement(node) {
  let current = node?.parentNode ?? null;
  while (current && current.nodeType !== ELEMENT_NODE) {
    current = current.parentNode ?? null;
  }
  return current;
}

/**
 * @param {Node|object} node
 * @returns {boolean}
 */
function hasInteractiveAncestor(node) {
  let current = nearestElement(node);
  while (current) {
    if (isInteractiveElement(current)) return true;
    current = current.parentNode ?? null;
  }
  return false;
}

/**
 * Create a deterministic structural path without adding attributes to the page.
 *
 * @param {Node|object} node
 * @returns {string}
 */
export function createNodePath(node) {
  const parts = [];
  let current = node;

  while (current?.parentNode) {
    const siblings = Array.from(current.parentNode.childNodes ?? []);
    const index = siblings.indexOf(current);
    const label = current.nodeType === TEXT_NODE
      ? "#text"
      : String(current.tagName ?? "node").toLowerCase();
    parts.unshift(`${label}[${Math.max(index, 0)}]`);
    current = current.parentNode;
  }

  return parts.join("/");
}

/**
 * Read visible text nodes without changing the DOM.
 *
 * Returned `node` references are intentionally kept for the future adapter,
 * but no attribute, text value, style, input or event is modified here.
 *
 * @param {Node|object} root
 * @returns {Array<{
 *   id: string,
 *   text: string,
 *   interactive: boolean,
 *   financialTokens: Array<{raw: string, amount: string, currency: "XAF"}>,
 *   node: Node|object
 * }>}
 */
export function extractVisibleText(root) {
  if (!root || ![ELEMENT_NODE, 9, 11].includes(root.nodeType)) {
    throw new TypeError("A DOM-like root node is required.");
  }

  const records = [];

  function visit(node) {
    if (node.nodeType === ELEMENT_NODE) {
      const tagName = String(node.tagName ?? "").toUpperCase();
      if (SKIPPED_TAGS.has(tagName) || isElementHidden(node)) return;
    }

    if (node.nodeType === TEXT_NODE) {
      const text = normalizeText(String(node.nodeValue ?? ""));
      if (!text) return;

      records.push({
        id: createNodePath(node),
        text,
        interactive: hasInteractiveAncestor(node),
        financialTokens: extractFinancialTokens(text),
        node
      });
      return;
    }

    for (const child of Array.from(node.childNodes ?? [])) {
      visit(child);
    }
  }

  visit(root);
  return records;
}
