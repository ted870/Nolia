(async () => {
  if (globalThis.__noliaContentScriptLoaded) return;
  globalThis.__noliaContentScriptLoaded = true;

  const [{ createDomObserver }, { classifyTextRecord }] = await Promise.all([
    import(chrome.runtime.getURL("core/dom-observer.js")),
    import(chrome.runtime.getURL("core/message-classifier.js"))
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
        const knownIds = new Set(status.recognizedMessageIds);
        status.visibleTextCount += records.length;
        status.financialTokenCount += records.reduce(
          (total, record) => total + record.financialTokens.length,
          0
        );
        for (const record of records) {
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
        }
        status.recognizedMessageIds = [...knownIds].sort();
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
