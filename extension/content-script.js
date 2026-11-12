(async () => {
  if (globalThis.__noliaContentScriptLoaded) return;
  globalThis.__noliaContentScriptLoaded = true;

  const [
    { createDomObserver },
    { extractVisibleText },
    { classifyTextRecord },
    { createDomTextAdapter, renderTestDisplay }
  ] = await Promise.all([
    import(chrome.runtime.getURL("core/dom-observer.js")),
    import(chrome.runtime.getURL("core/dom-extractor.js")),
    import(chrome.runtime.getURL("core/message-classifier.js")),
    import(chrome.runtime.getURL("core/dom-text-adapter.js"))
  ]);

  const status = {
    state: "starting",
    visibleTextCount: 0,
    financialTokenCount: 0,
    recognizedMessageCount: 0,
    protectedTextCount: 0,
    ignoredTextCount: 0,
    unknownTextCount: 0,
    recognizedMessageIds: [],
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
    const adapter = createDomTextAdapter({ renderText: renderTestDisplay });
    let testDisplayEnabled = false;

    function displayRecord(record, classification) {
      if (!testDisplayEnabled || classification.kind !== "message") return;
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
        status.visibleTextCount += records.length;
        status.financialTokenCount += records.reduce(
          (total, record) => total + record.financialTokens.length,
          0
        );
        for (const record of records) {
          if (adapter.isManagedRecord(record)) continue;
          const classification = classifyTextRecord(record);
          if (classification.kind === "message") {
            status.recognizedMessageCount += 1;
            knownIds.add(classification.messageId);
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
          displayRecord(record, classifyTextRecord(record));
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
