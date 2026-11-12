#!/usr/bin/env python3
"""Generate Nolia's provisional Ewondo pack with the local Flagship/Lingo models.

This is a build-time tool. The resulting Chrome extension remains fully local:
it embeds only the generated JSON pack, not the translation models and not an
API client. Machine output is deliberately labelled ``provisional`` and can
never pass Nolia's human-validated ``demo`` gate.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from datetime import date
from pathlib import Path

import ctranslate2
from transformers import MarianTokenizer


ROOT = Path(__file__).resolve().parents[1]
TEST_MARKER = "[TEST]"
PLACEHOLDER_RE = re.compile(r"\{([a-z][a-zA-Z0-9]*)\}")

# Intent texts are explanations, not literal copies of the examples. They must
# contain no hard-coded value: Nolia appends values extracted from the page.
INTENT_PROMPTS = {
    "transfer.insufficient_balance": "Le solde ne suffit pas pour ce transfert.",
    "transfer.sent_success": "Votre argent a été envoyé avec succès.",
    "transfer.received": "Vous avez reçu de l'argent.",
    "transfer.failed": "Le transfert a échoué.",
    "beneficiary.verify_before_confirm": "Vérifiez le bénéficiaire avant d'envoyer l'argent.",
    "beneficiary.new_unknown": "Ce bénéficiaire est nouveau.",
    "summary.verify_before_confirm": "Vérifiez les détails avant de confirmer.",
    "environment.test_data": "Ceci est une simulation avec des données fictives.",
    "security.no_personal_data": "Ne communiquez jamais votre code secret.",
    "fees.free_transfer": "Ce transfert est gratuit.",
    "fees.amount_info": "Des frais sont appliqués à cette opération.",
    "transfer.total_debit": "Cette somme sera retirée de votre compte.",
    "balance.available_info": "Ceci est votre solde disponible.",
    "balance.after_operation": "Ceci est le solde restant après l'opération.",
    "action.confirm_transfer": "Cette action confirme l'envoi de l'argent.",
    "error.generic": "Un problème technique s'est produit.",
    "fallback.unrecognized": "Nolia n'a pas reconnu ce message. Le texte français reste visible.",
    "fallback.unrecognized_warning": "Attention, Nolia n'a pas reconnu ce message. Vérifiez avant de continuer.",
}

# Brand names are preserved. Dynamic values are never sent to the model.
CATALOG_OVERRIDES = {
    "fees.safinumAccount": "Mbëmbë foe Safinum",
    "fees.mobileMoney": "Mobile Money",
    "balance.greeting": "Mina, {name}",
    "balance.accountNumber": "Ndò mbëmbë na: {account}",
    "step.confirmation": "Bendëgan e mam mëte",
}

DIRECTION_LABELS = {
    "send": "Mòni mëngakui asu daan",
    "receive": "Mòni mënganyian asu daan",
    "neutral": "Ndò mbëmbë foe osu",
}

TRANSFER_SUMMARY = (
    "{direction}: {amount} {currency}. Dzoe nyè: {beneficiary}. "
    "E mam mësòman: {fees}."
)


class LocalTranslator:
    def __init__(self, model_path: Path):
        self.translator = ctranslate2.Translator(
            str(model_path), device="cpu", compute_type="int8"
        )
        self.tokenizer = MarianTokenizer.from_pretrained(
            str(model_path), local_files_only=True
        )

    def translate(self, text: str) -> str:
        tokens = self.tokenizer.convert_ids_to_tokens(self.tokenizer.encode(text))
        maximum = max(16, min(96, len(tokens) * 4 + 8))
        result = self.translator.translate_batch(
            [tokens],
            beam_size=4,
            max_decoding_length=maximum,
            repetition_penalty=1.3,
            no_repeat_ngram_size=3,
        )[0].hypotheses[0]
        ids = self.tokenizer.convert_tokens_to_ids(result)
        return " ".join(
            self.tokenizer.decode(ids, skip_special_tokens=True).split()
        ).strip()


def quality_flags(source: str, translated: str, *, intent: bool) -> list[str]:
    flags: list[str] = []
    if not translated:
        flags.append("empty")
        return flags
    if translated.casefold() == source.casefold():
        flags.append("unchanged")
    if TEST_MARKER in translated:
        flags.append("test-marker")
    if intent and re.search(r"\d", translated):
        flags.append("digit-in-explanation")
    words = translated.casefold().split()
    if len(words) > max(18, len(source.split()) * 4):
        flags.append("too-long")
    trigrams = [tuple(words[index : index + 3]) for index in range(max(0, len(words) - 2))]
    if len(trigrams) != len(set(trigrams)):
        flags.append("repeated-trigram")
    return flags


def module_source(pack: dict) -> str:
    payload = json.dumps(pack, ensure_ascii=False, indent=2)
    return (
        "/**\n"
        " * Provisional Ewondo pack generated locally with Flagship/Lingo.\n"
        " * Machine output: not validated by human speakers.\n"
        " * Generated file: do not edit by hand.\n"
        " */\n"
        f"export const PROVISIONAL_EWO_PACK = Object.freeze({payload});\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--forward-model", type=Path, required=True)
    parser.add_argument("--reverse-model", type=Path, required=True)
    parser.add_argument("--generated-at", default=date.today().isoformat())
    args = parser.parse_args()

    forward = LocalTranslator(args.forward_model.resolve())
    reverse = LocalTranslator(args.reverse_model.resolve())
    template_path = ROOT / "locales" / "template.json"
    pack = json.loads(template_path.read_text(encoding="utf-8"))
    pack["meta"] = {
        "languageCode": "ewo",
        "languageName": "Ewondo — traduction automatique provisoire",
        "version": 4,
        "status": "provisional",
        "humanValidated": False,
        "validatedBy": [],
        "validatedAt": None,
        "generatedAt": args.generated_at,
        "generatedBy": "Flagship/Lingo cameroon-int8",
        "modelPair": "francais-ewondo + ewondo-francais",
        "modelLicense": "CC BY-NC 4.0 (licence prudente du dépôt parent)",
    }
    pack["directionLabels"] = dict(DIRECTION_LABELS)

    report_rows: list[dict[str, str]] = []
    for message_id, template in pack["templates"].items():
        source = template.get("source") or template.get("text") or ""
        is_intent = message_id in INTENT_PROMPTS

        if message_id == "transfer.summary":
            translated = TRANSFER_SUMMARY
            generation_source = "Résumé structuré avec emplacements protégés"
            round_trip = "Contrôle structurel uniquement"
            flags: list[str] = []
        elif message_id in CATALOG_OVERRIDES:
            translated = CATALOG_OVERRIDES[message_id]
            generation_source = source
            round_trip = reverse.translate(PLACEHOLDER_RE.sub("", translated).strip())
            flags = []
        else:
            generation_source = INTENT_PROMPTS.get(message_id, source)
            if message_id == "security.demoWarning":
                translated = "Safinum Pay — " + forward.translate(
                    "Environnement de démonstration. Ne saisissez aucune donnée personnelle réelle."
                )
            else:
                translated = forward.translate(generation_source)
            round_trip = reverse.translate(translated)
            flags = quality_flags(generation_source, translated, intent=is_intent)

        expected_slots = template.get("requiredSlots", [])
        present_slots = PLACEHOLDER_RE.findall(translated)
        if sorted(expected_slots) != sorted(present_slots):
            flags.append("placeholder-mismatch")

        template["status"] = "provisional"
        template["text"] = translated
        template["machineSource"] = "Flagship/Lingo cameroon-int8"
        template["humanValidated"] = False
        template["qualityFlags"] = sorted(set(flags))

        report_rows.append(
            {
                "id": message_id,
                "francais": generation_source,
                "ewondo_provisoire": translated,
                "retrotraduction_francaise": round_trip,
                "controles_automatiques": ", ".join(sorted(set(flags))) or "structure-ok",
                "validation_humaine": "à faire",
            }
        )

    locale_path = ROOT / "locales" / "ewo-provisional.json"
    locale_path.write_text(
        json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (ROOT / "core" / "locale-ewo-provisional-pack.js").write_text(
        module_source(pack), encoding="utf-8"
    )
    report_path = ROOT / "docs" / "rapport-traduction-automatique-ewondo.csv"
    with report_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(report_rows[0]), delimiter=";")
        writer.writeheader()
        writer.writerows(report_rows)

    flagged = sum(row["controles_automatiques"] != "structure-ok" for row in report_rows)
    print(f"Pack provisoire généré : {len(report_rows)} textes, {flagged} signalés pour révision.")
    print(locale_path)
    print(report_path)


if __name__ == "__main__":
    main()
