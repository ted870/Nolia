/**
 * Nolia panel (v0.5.1): small, isolated control box on the Safinum page.
 *
 * - The host element carries data-nolia-ignore, so the extractor skips it, and
 *   its content lives in a closed Shadow DOM, out of the page's light DOM.
 * - Styles are declared inside the shadow root only: nothing leaks to the page.
 * - Text is set with textContent only (no innerHTML).
 * - It can be collapsed to a small "Nolia" pill so it never hides Safinum buttons.
 * - It shows counters only, never page content.
 */

import { TARGET_LANGUAGE } from "./target-language.js";

const STYLE = `
:host { all: initial; position: fixed; left: 12px; bottom: 12px; z-index: 2147483000;
  font: 13px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: #1f2933; }
.box { box-sizing: border-box; width: min(280px, calc(100vw - 24px)); max-height: calc(100vh - 24px);
  overflow: auto; background: #ffffff; border: 1px solid #c5ccd3; border-radius: 10px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, .18); padding: 10px 12px; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 6px; }
.title { font-weight: 700; font-size: 14px; margin: 0; }
.mode { display: inline-block; border-radius: 999px; padding: 1px 8px; font-size: 12px; font-weight: 600;
  background: #e4e7eb; color: #1f2933; }
.mode[data-mode="test"] { background: #fff3c4; color: #5c4400; }
.mode[data-mode="langue"] { background: #d1f2df; color: #0b4d2c; }
.mode[data-mode="provisoire"] { background: #ffe1c7; color: #7a2e0e; }
.notice { margin: 6px 0 0; font-size: 12px; color: #5c3200; background: #fff1dc; border: 1px solid #f0b37e; border-radius: 6px; padding: 6px 8px; }
dl { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; margin: 6px 0 8px; }
dt { margin: 0; } dd { margin: 0; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }
.actions { display: grid; gap: 6px; }
button { all: unset; box-sizing: border-box; cursor: pointer; text-align: center; border-radius: 6px;
  padding: 7px 10px; font: inherit; font-weight: 600; border: 1px solid #52606d; background: #f5f7fa; color: #1f2933; }
button:hover:not([disabled]):not([aria-pressed="true"]) { background: #e4e7eb; }
button[aria-pressed="true"]:hover { background: #323f4b; }
button:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
button[disabled] { cursor: not-allowed; opacity: .55; }
button[aria-pressed="true"] { background: #1f2933; color: #ffffff; }
.reason { margin: 6px 0 0; font-size: 12px; color: #7a2e0e; background: #fff4ec; border-radius: 6px; padding: 6px 8px; }
.note { margin: 8px 0 0; font-size: 11px; color: #52606d; }
.toggle { all: unset; cursor: pointer; font-size: 12px; padding: 2px 6px; border-radius: 4px; color: #1f2933; }
.toggle:focus-visible { outline: 3px solid #2563eb; }
.pill { display: none; }
:host([data-collapsed]) .box { display: none; }
:host([data-collapsed]) .pill { display: inline-block; border-radius: 999px; padding: 6px 12px;
  background: #1f2933; color: #ffffff; font-weight: 700; box-shadow: 0 2px 8px rgba(15, 23, 42, .25); }
@media (max-width: 480px) { :host { left: 8px; bottom: 8px; } }
`;

const MODE_LABELS = Object.freeze({
  observation: "Observation",
  test: "Mode TEST",
  langue: `Mode ${TARGET_LANGUAGE.name}`,
  provisoire: `Mode ${TARGET_LANGUAGE.name} — traduction automatique, à vérifier`
});

function make(document, tag, attributes = {}, text = null) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  if (text !== null) element.textContent = text;
  return element;
}

/**
 * @param {object} options
 * @param {Document} options.document
 * @param {ReturnType<import("./nolia-controller.js").createNoliaController>} options.controller
 * @param {boolean} [options.collapsed] Start collapsed (default on narrow screens).
 */
export function createNoliaPanel({ document, controller, collapsed = false }) {
  const host = make(document, "div", { "data-nolia-ignore": "", "data-nolia-panel": "" });
  const shadow = host.attachShadow({ mode: "closed" });

  const style = make(document, "style", {}, STYLE);
  const pill = make(document, "button", { class: "pill", type: "button", "aria-label": "Ouvrir le panneau Nolia" }, "Nolia");
  const box = make(document, "section", { class: "box", role: "region", "aria-label": "Nolia, assistance linguistique" });

  const head = make(document, "div", { class: "head" });
  const title = make(document, "p", { class: "title" }, "Nolia");
  const collapse = make(document, "button", { class: "toggle", type: "button", "aria-label": "Réduire le panneau Nolia" }, "Réduire");
  head.append(title, collapse);

  const mode = make(document, "span", { class: "mode", role: "status", "aria-live": "polite" }, "Observation");

  const list = make(document, "dl");
  const counters = {};
  for (const [key, label] of [
    ["recognizedCount", "Messages reconnus"],
    ["protectedCount", "Textes protégés"],
    ["unknownCount", "Messages inconnus"]
  ]) {
    const value = make(document, "dd", {}, "0");
    list.append(make(document, "dt", {}, label), value);
    counters[key] = value;
  }

  const testButton = make(document, "button", { type: "button", "aria-pressed": "false" }, "Activer le mode TEST");
  const restoreButton = make(document, "button", { type: "button" }, "Restaurer le français");
  const targetButton = make(document, "button", { type: "button", "aria-pressed": "false", "aria-describedby": "nolia-target-reason" }, `Activer ${TARGET_LANGUAGE.withArticle}`);
  const actions = make(document, "div", { class: "actions" });
  actions.append(testButton, restoreButton, targetButton);

  const reason = make(document, "p", { class: "reason", id: "nolia-target-reason" });
  const note = make(document, "p", { class: "note" },
    "Nolia aide à comprendre le texte. Elle ne bloque ni ne protège aucune transaction. Le mode TEST n'est pas une langue.");

  box.append(head, mode, list, actions, reason, note);
  shadow.append(style, pill, box);

  function setCollapsed(value) {
    if (value) host.setAttribute("data-collapsed", "");
    else host.removeAttribute("data-collapsed");
  }

  function render(status) {
    title.textContent = `${status.name} ${status.version}`;
    mode.textContent = MODE_LABELS[status.mode] ?? status.mode;
    mode.setAttribute("data-mode", status.mode);
    for (const [key, element] of Object.entries(counters)) element.textContent = String(status[key]);
    testButton.setAttribute("aria-pressed", String(status.mode === "test"));
    targetButton.setAttribute("aria-pressed", String(status.mode === "langue" || status.mode === "provisoire"));
    restoreButton.disabled = status.mode === "observation";
    testButton.disabled = !status.testAvailable;
    targetButton.disabled = !status.targetAvailable && !status.provisionalAvailable;
    targetButton.textContent = status.targetAvailable || !status.provisionalAvailable
      ? `Activer ${TARGET_LANGUAGE.withArticle}`
      : `Activer ${TARGET_LANGUAGE.withArticle} (automatique)`;
    if (status.targetAvailable) {
      reason.textContent = "";
      reason.hidden = true;
    } else if (status.provisionalAvailable) {
      const { present, total } = status.provisionalCoverage;
      reason.setAttribute("class", "notice");
      reason.textContent =
        `Traduction automatique (${status.provisionalSource}), non validée par des humains : ` +
        `${present}/${total} textes, chacun précédé de [AUTO] ; les autres restent en français.`;
      reason.hidden = false;
    } else {
      reason.setAttribute("class", "reason");
      reason.textContent = `${TARGET_LANGUAGE.label} indisponible : aucun pack validé. ${status.targetRefusal}`;
      reason.hidden = false;
    }
  }

  testButton.addEventListener("click", () => controller.enableTest());
  restoreButton.addEventListener("click", () => controller.restoreFrench());
  targetButton.addEventListener("click", () => controller.enableTargetLanguage());
  collapse.addEventListener("click", () => setCollapsed(true));
  pill.addEventListener("click", () => setCollapsed(false));

  setCollapsed(collapsed);
  render(controller.status);

  return Object.freeze({
    host,
    render,
    mount(parent) {
      parent.append(host);
    },
    setCollapsed,
    /** Test hook: the shadow root is closed to the page, not to Nolia. */
    get shadowRoot() {
      return shadow;
    },
    elements: Object.freeze({ testButton, restoreButton, targetButton, reason, mode, counters, title })
  });
}
