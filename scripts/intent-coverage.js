/**
 * Measured coverage of the independent test set (local, deterministic).
 * Usage: npm run coverage:intents
 * Prints aggregate counts only; it reads no page and sends nothing.
 */
import { UNSEEN_PHRASES } from "../tests/fixtures/unseen-phrases.js";
import { analyzeTextRecord } from "../core/text-analyzer.js";

const rows = {};
let falsePositives = 0;
for (const phrase of UNSEEN_PHRASES) {
  const result = analyzeTextRecord({ text: phrase.text });
  const row = (rows[phrase.category] ??= { total: 0, intent: 0, fallback: 0, untouched: 0, asExpected: 0 });
  row.total += 1;
  if (result.kind === "intent") row.intent += 1;
  else if (result.kind === "fallback") row.fallback += 1;
  else row.untouched += 1;
  const expected = result.kind === phrase.kind && (!phrase.intentId || result.intentId === phrase.intentId);
  if (expected) row.asExpected += 1;
  if (result.kind === "intent" && result.intentId !== phrase.intentId) falsePositives += 1;
}
console.table(rows);
console.log(`Phrases: ${UNSEEN_PHRASES.length} | wrong intent displayed (false positives): ${falsePositives}`);
console.log("Ce jeu a été écrit par l'équipe technique : il mesure le comportement, pas la couverture réelle des messages Safinum.");
