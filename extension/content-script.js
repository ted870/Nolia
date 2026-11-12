(async () => {
  if (globalThis.__noliaContentScriptLoaded) return;
  globalThis.__noliaContentScriptLoaded = true;

  const [
    { createDomObserver },
    { extractVisibleText },
    { analyzeTextRecord },
    { createDomTextAdapter },
    { createDisplayRenderer },
    { TEST_PACK }
  ] = await Promise.all([
    import(chrome.runtime.getURL("core/dom-observer.js")),
    import(chrome.runtime.getURL("core/dom-extractor.js")),
    import(chrome.runtime.getURL("core/text-analyzer.js")),
    import(chrome.runtime.getURL("core/dom-text-adapter.js")),
    import(chrome.runtime.getURL("core/display-renderer.js")),
    import(chrome.runtime.getURL("core/locale-test-pack.js"))
  ]);

  const status = {
    state: "starting",
    visibleTextCount: 0,
    financialTokenCount: 0,
    recognizedMessageCount: 0,
    protectedTextCount: 0,
    ignoredTextCount: 0,
    unknownTextCount: 0,
    intentMatchCount: 0,
    fallbackCount: 0,
    fallbackReasons: {},
    recognizedMessageIds: [],
    recognizedIntentIds: [],
    testDisplayEnabled: false,
    translatedTextCount: 0,
    displayErrorCount: 0,
    lastObservationAt: null,
    errorCode: null
  };

  // Only aggregate counters are kept for diagnostics. Extracted financial text
  // is neither logged nor transmitted.
  globalThis.__noliaStatus = Object.seal(status);

  try {
    // v0.5.0: only the artificial TEST pack is loaded. No real language is
    // displayed until a pack is validated by two independent speakers.
    const adapter = createDomTextAdapter({
      renderText: createDisplayRenderer(TEST_PACK, { mode: "test" })
    });
    let testDisplayEnabled = false;

    function displayRecord(record, classification) {
      if (!testDisplayEnabled) return;
      if (!["message", "intent", "fallback"].includes(classification.kind)) return;
      try {
        adapter.applyRecord(record, classification);
        status.translatedTextCount = adapter.size;
      } catch (error) {
        status.displayErrorCount += 1;
        console.error("Nolia refused an unsafe test display.", error);
      }
    }

    const observer = createDomObserver({
      root: document.documentElement,
      onRecords(records) {
        const knownIds = new Set(status.recognizedMessageIds);
        const knownIntentIds = new Set(status.recognizedIntentIds);
        status.visibleTextCount += records.length;
        status.financialTokenCount += records.reduce(
          (total, record) => total + record.financialTokens.length,
          0
        );
        for (const record of records) {
          if (adapter.isManagedRecord(record)) continue;
          const classification = analyzeTextRecord(record);
          if (classification.kind === "message") {
            status.recognizedMessageCount += 1;
            knownIds.add(classification.messageId);
          } else if (classification.kind === "intent") {
            status.intentMatchCount += 1;
            knownIntentIds.add(classification.intentId);
          } else if (classification.kind === "fallback") {
            status.fallbackCount += 1;
            status.fallbackReasons[classification.reason] =
              (status.fallbackReasons[classification.reason] ?? 0) + 1;
          } else if (classification.kind === "protected") {
            status.protectedTextCount += 1;
          } else if (classification.kind === "ignored") {
            status.ignoredTextCount += 1;
          } else {
            status.unknownTextCount += 1;
          }
          displayRecord(record, classification);
        }
        status.recognizedMessageIds = [...knownIds].sort();
        status.recognizedIntentIds = [...knownIntentIds].sort();
        status.lastObservationAt = new Date().toISOString();
        status.state = "observing";
      }
    });

    observer.start();
    globalThis.__noliaObserver = observer;

    globalThis.__noliaTestMode = Object.freeze({
      enable() {
        if (testDisplayEnabled) {
          return Object.freeze({ enabled: true, translatedTextCount: adapter.size });
        }
        testDisplayEnabled = true;
        status.testDisplayEnabled = true;

        for (const record of extractVisibleText(document.documentElement)) {
          displayRecord(record, analyzeTextRecord(record));
        }

        return Object.freeze({ enabled: true, translatedTextCount: adapter.size });
      },
      disable() {
        testDisplayEnabled = false;
        status.testDisplayEnabled = false;
        const result = adapter.restore();
        status.translatedTextCount = adapter.size;
        return Object.freeze({ enabled: false, ...result });
      },
      get enabled() {
        return testDisplayEnabled;
      }
    });
  } catch (error) {
    status.state = "error";
    status.errorCode = "OBSERVER_START_FAILED";
    console.error("Nolia could not start its local observer.", error);
  }
})();
