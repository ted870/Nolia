(async () => {
  if (globalThis.__noliaContentScriptLoaded) return;
  globalThis.__noliaContentScriptLoaded = true;

  const [{ createDomObserver }] = await Promise.all([
    import(chrome.runtime.getURL("core/dom-observer.js"))
  ]);

  const status = {
    state: "starting",
    visibleTextCount: 0,
    financialTokenCount: 0,
    lastObservationAt: null,
    errorCode: null
  };

  // Only aggregate counters are kept for diagnostics. Extracted financial text
  // is neither logged nor transmitted.
  globalThis.__noliaStatus = Object.seal(status);

  try {
    const observer = createDomObserver({
      root: document.documentElement,
      onRecords(records) {
        status.visibleTextCount += records.length;
        status.financialTokenCount += records.reduce(
          (total, record) => total + record.financialTokens.length,
          0
        );
        status.lastObservationAt = new Date().toISOString();
        status.state = "observing";
      }
    });

    observer.start();
    globalThis.__noliaObserver = observer;
  } catch (error) {
    status.state = "error";
    status.errorCode = "OBSERVER_START_FAILED";
    console.error("Nolia could not start its local observer.", error);
  }
})();
