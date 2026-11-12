/**
 * Copy of locales/test.json as an ES module, so the content script can load it
 * through the existing web_accessible_resources entry (core/*.js) without
 * widening the manifest. tests/locale-test-pack.test.js keeps both identical.
 * This pack is artificial: every text starts with [TEST]. It is not a language.
 */
export const TEST_PACK = Object.freeze({
  "meta": {
    "languageCode": "TEST",
    "languageName": "[TEST] Langue artificielle",
    "version": 2,
    "status": "test",
    "validatedBy": [],
    "validatedAt": null
  },
  "directionLabels": {
    "send": "[TEST] ENVOI",
    "receive": "[TEST] RECEPTION",
    "neutral": "[TEST] NEUTRE"
  },
  "templates": {
    "transfer.summary": {
      "status": "test",
      "text": "[TEST] {beneficiary} | {fees} {currency} | {direction} | {amount} {currency}",
      "requiredSlots": [
        "direction",
        "amount",
        "currency",
        "beneficiary",
        "fees"
      ]
    },
    "transfer.insufficient_balance": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION TRANSFER INSUFFICIENT BALANCE",
      "requiredSlots": []
    },
    "transfer.sent_success": {
      "status": "test",
      "direction": "send",
      "text": "[TEST] INTENTION TRANSFER SENT SUCCESS",
      "requiredSlots": []
    },
    "transfer.received": {
      "status": "test",
      "direction": "receive",
      "text": "[TEST] INTENTION TRANSFER RECEIVED",
      "requiredSlots": []
    },
    "transfer.failed": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION TRANSFER FAILED",
      "requiredSlots": []
    },
    "beneficiary.verify_before_confirm": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION BENEFICIARY VERIFY BEFORE CONFIRM",
      "requiredSlots": []
    },
    "beneficiary.new_unknown": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION BENEFICIARY NEW UNKNOWN",
      "requiredSlots": []
    },
    "summary.verify_before_confirm": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION SUMMARY VERIFY BEFORE CONFIRM",
      "requiredSlots": []
    },
    "environment.test_data": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION ENVIRONMENT TEST DATA",
      "requiredSlots": []
    },
    "security.no_personal_data": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION SECURITY NO PERSONAL DATA",
      "requiredSlots": []
    },
    "fees.free_transfer": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION FEES FREE TRANSFER",
      "requiredSlots": []
    },
    "fees.amount_info": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION FEES AMOUNT INFO",
      "requiredSlots": []
    },
    "transfer.total_debit": {
      "status": "test",
      "direction": "send",
      "text": "[TEST] INTENTION TRANSFER TOTAL DEBIT",
      "requiredSlots": []
    },
    "balance.available_info": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION BALANCE AVAILABLE INFO",
      "requiredSlots": []
    },
    "balance.after_operation": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION BALANCE AFTER OPERATION",
      "requiredSlots": []
    },
    "action.confirm_transfer": {
      "status": "test",
      "direction": "send",
      "text": "[TEST] INTENTION ACTION CONFIRM TRANSFER",
      "requiredSlots": []
    },
    "error.generic": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] INTENTION ERROR GENERIC",
      "requiredSlots": []
    },
    "fallback.unrecognized": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] MESSAGE NON RECONNU, LE TEXTE FRANÇAIS EST CONSERVÉ",
      "requiredSlots": []
    },
    "fallback.unrecognized_warning": {
      "status": "test",
      "direction": "neutral",
      "text": "[TEST] ATTENTION, MESSAGE NON RECONNU : VÉRIFIEZ AVANT DE CONTINUER",
      "requiredSlots": []
    }
  }
});
