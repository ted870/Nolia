// Nolia v0.5.1 content script. Thin shell: all logic is in core/*.js and is
// covered by `npm test`. Runs only on https://safinum.cm/hackathon-test(/*).
(async () => {
  if (globalThis.__noliaContentScriptLoaded) return;
  globalThis.__noliaContentScriptLoaded = true;

  const status = { state: "starting", errorCode: null };
  globalThis.__noliaStatus = status;

  try {
    const [
      { createNoliaController },
      { createNoliaPanel },
      { TEST_PACK },
      { EWO_PACK }
    ] = await Promise.all([
      import(chrome.runtime.getURL("core/nolia-controller.js")),
      import(chrome.runtime.getURL("core/nolia-panel.js")),
      import(chrome.runtime.getURL("core/locale-test-pack.js")),
      import(chrome.runtime.getURL("core/locale-ewo-pack.js"))
    ]);

    let panel = null;
    const controller = createNoliaController({
      root: document.documentElement,
      packs: { test: TEST_PACK, ewo: EWO_PACK },
      version: chrome.runtime.getManifest().version,
      onStatus(snapshot) {
        // Counters and ids only: no page text is kept or logged.
        globalThis.__noliaStatus = snapshot;
        panel?.render(snapshot);
      },
      onDisplayError(error) {
        console.warn("Nolia a refusé un affichage non sûr :", error?.code ?? error?.name ?? "erreur");
      }
    });

    panel = createNoliaPanel({
      document,
      controller,
      collapsed: globalThis.matchMedia?.("(max-width: 600px)").matches ?? false
    });
    panel.mount(document.body ?? document.documentElement);
    controller.start();

    globalThis.__noliaController = controller;
    // Console commands kept from v0.4.0 for the team's habits.
    globalThis.__noliaTestMode = Object.freeze({
      enable: () => controller.enableTest(),
      disable: () => controller.restoreFrench(),
      get enabled() {
        return controller.status.mode === "test";
      }
    });
  } catch (error) {
    status.state = "error";
    status.errorCode = "NOLIA_START_FAILED";
    console.error("Nolia n'a pas pu démarrer.", error?.message ?? error);
  }
})();
