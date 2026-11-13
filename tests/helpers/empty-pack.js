/**
 * The empty target-language model (locales/template.json), used to test the
 * "no pack" state now that the shipped module carries a provisional draft.
 */
import { readFileSync } from "node:fs";

export function emptyTargetPack() {
  return JSON.parse(readFileSync(new URL("../../locales/template.json", import.meta.url), "utf8"));
}
