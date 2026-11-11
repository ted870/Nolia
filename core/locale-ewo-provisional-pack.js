/**
 * Provisional Ewondo pack generated locally with Flagship/Lingo.
 * Machine output: not validated by human speakers.
 * Generated file: do not edit by hand.
 */
export const PROVISIONAL_EWO_PACK = Object.freeze({
  "meta": {
    "languageCode": "ewo",
    "languageName": "Ewondo — traduction automatique provisoire",
    "version": 4,
    "status": "provisional",
    "humanValidated": false,
    "validatedBy": [],
    "validatedAt": null,
    "generatedAt": "2026-11-11",
    "generatedBy": "Flagship/Lingo cameroon-int8",
    "modelPair": "francais-ewondo + ewondo-francais",
    "modelLicense": "CC BY-NC 4.0 (licence prudente du dépôt parent)"
  },
  "directionLabels": {
    "send": "Mòni mëngakui asu daan",
    "receive": "Mòni mënganyian asu daan",
    "neutral": "Ndò mbëmbë foe osu"
  },
  "templates": {
    "transfer.summary": {
      "status": "provisional",
      "text": "{direction}: {amount} {currency}. Dzoe nyè: {beneficiary}. E mam mësòman: {fees}.",
      "requiredSlots": [
        "direction",
        "amount",
        "currency",
        "beneficiary",
        "fees"
      ],
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transfer.insufficient_balance": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "E mòni esëki soe asu die.",
      "source": "Vous ne disposez pas d'assez de fonds.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transfer.sent_success": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "send",
      "text": "Ndò mvulna woe ongabë eyòṅ dzaban.",
      "source": "Votre virement a bien été effectué.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transfer.received": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "receive",
      "text": "Mingabi mòni.",
      "source": "Paul Ndzana vous a envoyé 15 000 FCFA.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transfer.failed": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Ndò mvulna angabë fufulu.",
      "source": "Le virement a échoué.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.verify_before_confirm": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Vòṅan efaè nyi, osusua yë na alom mòni.",
      "source": "Contrôlez le numéro du destinataire avant l'envoi.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.new_unknown": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Efaè nyi enë mkpamaṅ.",
      "source": "Vous n'avez encore jamais utilisé ce destinataire.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.verify_before_confirm": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Ndò hm, yë na: Biayi bi mvulna osu.",
      "source": "Relisez les détails avant de valider l'opération.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "environment.test_data": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Ndò hm fë anë ntud ai dzom ziṅ.",
      "source": "Ceci est une simulation : les opérations sont fictives.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.no_personal_data": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Dzam da, të miakòbò ndzoe woe.",
      "source": "Ne communiquez jamais votre code secret.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.free_transfer": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Ndò fë efaè esye te.",
      "source": "Aucun frais ne sera appliqué à ce transfert.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.amount_info": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Asu te mam mësòman nyè.",
      "source": "Les frais de cette opération s'élèvent à 500 FCFA.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transfer.total_debit": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "send",
      "text": "Bayi komëzan asu daan.",
      "source": "Somme prélevée sur votre compte : 25 500 FCFA.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.available_info": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "E mam mënë e nyòlò dzama.",
      "source": "Votre solde actuel est de 125 000 FCFA.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.after_operation": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "E nyi enë e mam mòni a mvus hala.",
      "source": "Nouveau solde après le transfert : 99 500 FCFA.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "action.confirm_transfer": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "send",
      "text": "E mam mëte, ndò e dzi engatsig mòni.",
      "source": "Valider le virement",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "error.generic": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Mod nkòbò adzo te.",
      "source": "Un problème technique s'est produit.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fallback.unrecognized": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Nolia andzëki yen e dzi nyi. E mvende engakòbò esye te, akòn bibug biaban.",
      "source": "fallback.unrecognized",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fallback.unrecognized_warning": {
      "status": "provisional",
      "requiredSlots": [],
      "direction": "neutral",
      "text": "Boan okala, Nolia andzëki yen e dzam di. Tòbògò na akada kui osu.",
      "source": "fallback.unrecognized_warning",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "environment.testBanner": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "A mvòm-biyëman, tègè ai e dzi engakomban.",
      "source": "Environnement de test — données fictives, aucune transaction réelle.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "environment.protocol": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mvende ndò mbëmbë foe",
      "source": "Protocole de test",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "environment.backToHackathon": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm adugan abë ekakatan",
      "source": "Retour au hackathon",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "app.bankOnline": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "E nyi e dzom ziṅ enë mbòg, asu yë na",
      "source": "Banque en ligne",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "step.balance": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Yë mvòm esye",
      "source": "Solde",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "common.fees": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Fufulu hm fë asu daan",
      "source": "Frais",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "common.beneficiary": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Beneficiò na:",
      "source": "Bénéficiaire",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "common.summary": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm, akëlë kui anë dzam sosoo.",
      "source": "Récapitulatif",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "step.confirmation": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Bendëgan e mam mëte",
      "source": "Confirmation",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.accountHeading": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò fë mbëmbë foe, asu yë na b",
      "source": "VOTRE COMPTE",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.intro": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm, yëmanan e mam mian ai ngogëlan a saaṅ.",
      "source": "Consultez votre solde et lancez un transfert en toute sécurité.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.available": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Dzam da, eyòṅ esëki bod asu yë na mvulna mbëmbë foe.",
      "source": "SOLDE DISPONIBLE",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.currentAccount": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò mbëmbë foe",
      "source": "Compte courant",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.startTransfer": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò fë mvulna ṅnyè angatyeban a nda-Zamba.",
      "source": "Effectuer un transfert",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.checkFees": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò fë ṅnyè ayen e mam mësë, nala waty",
      "source": "Consulter les frais",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.recentTransactions": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Dzam da, asu yë na eyòṅ mimbog mbëmbë foe.",
      "source": "TRANSACTIONS RÉCENTES",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transaction.merchantPayment": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mbëmbë mvende.",
      "source": "Paiement marchand",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transaction.salaryReceived": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "E mvòṅ ya maan bëngayi nyè, asu y",
      "source": "Salaire reçu",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transaction.transferReceived": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò mvulna mbëmbë foe asu yë na",
      "source": "Transfert reçu",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "transaction.electricityBill": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Foe ngòn ziṅ asu yë na bod mbëmbë foe",
      "source": "Facture électricité",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.title": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Asu te, akëlë kòm esë",
      "source": "Sécurité",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.verifyBeneficiary": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Tòbëgan hm dzoe ai e nyi esya, osusua yakpèè soan.",
      "source": "Vérifiez toujours le nom et le numéro du bénéficiaire avant de confirmer un transfert.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.secureConnection": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Secured nnëm",
      "source": "Connexion sécurisée",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.demoWarning": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Safinum Pay — Engënòṅ mbil. Tègè ai e dzi enyiṅ ya abëlë.",
      "source": "Safinum Pay — environnement de démonstration. Ne saisissez aucune donnée personnelle réelle.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.title": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Tègè ai nda-Zamba, asu yë na mibò esye dzom ziṅ.",
      "source": "FRAIS DE TRANSFERT",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.intro": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm, dzam bò na: Këlëg mvulna ai efaè.",
      "source": "Choisissez le type de transfert et le montant. Les frais sont calculés automatiquement.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.operationType": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mod ziṅ asu yë na:",
      "source": "TYPE D'OPÉRATION",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.safinumAccount": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mbëmbë foe Safinum",
      "source": "Compte Safinum",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.mobileMoney": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mobile Money",
      "source": "Mobile Money",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.otherBank": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mbòg bëvòg mfufub, asu yë na",
      "source": "Autre banque",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.freeInstant": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ntud, fili-nnëm esye asu daan",
      "source": "Transfert instantané et gratuit",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.amountToSend": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Amu abog asëki dzam bò na:",
      "source": "MONTANT À ENVOYER",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.free": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Bibëlë fufulu, asu yë na b",
      "source": "Gratuit",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.totalDebit": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò mbëmbë asu yë na:",
      "source": "Total à débiter",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "fees.balanceAfter": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "E mvòm esë a nsëṅ,",
      "source": "Solde après opération",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.intro": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm, mikëlë e kalara enyiṅ. Tsogan tsig nda-bob asu die osusua yadzèè.",
      "source": "Renseignez les informations du destinataire. Vérifiez toujours le numéro avant de valider.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.newWarning": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò efaè nyi, bandzëki dzam bò asu te. Tsogan tsig ntol osusua kui.",
      "source": "Ce bénéficiaire n'a jamais été utilisé sur ce compte. Vérifiez le numéro avant de continuer.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.name": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Dzoe bënefini nyè a mvus hala,",
      "source": "NOM DU BÉNÉFICIAIRE",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.phone": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm tëlekoan na:",
      "source": "NUMÉRO DE TÉLÉPHONE",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.reason": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Asu te mod ziṅan akëlë kòm esye",
      "source": "MOTIF DU TRANSFERT",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.note": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "NOTES",
      "source": "NOTE (OPTIONNEL)",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "beneficiary.checked": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò mëngayen dzoe ai e nyi esye.",
      "source": "J'ai vérifié le nom et le numéro du bénéficiaire.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.intro": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Biayëm e mam mëte, ndò fë badugan dzom ziṅ.",
      "source": "Vérifiez les informations avant de confirmer le transfert.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.amount": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Amount",
      "source": "Montant",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.totalDebited": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò mbëmbë asu yë na:",
      "source": "Total débité",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.phone": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Tele nkòbò woe",
      "source": "Téléphone",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.reference": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò fë nkukuma a mvus hala,",
      "source": "Référence",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.operation": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Operation",
      "source": "Opération",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.confirmCorrect": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mayi kòm na e mam mëte binë asu yë nala.",
      "source": "Je confirme que les informations ci-dessus sont correctes.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.edit": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mod ziṅan yadzëki dzoe na:",
      "source": "Modifier",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "summary.confirmTransfer": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Adzoe mëkpamaṅ, asu yë na bakòbò e dzom ziṅ.",
      "source": "Confirmer le transfert",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "receipt.title": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm, akëlë kui mbëṅ.",
      "source": "Transfert effectué",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "receipt.successMessage": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò bëngalom mvulna a nsëṅ.",
      "source": "Votre transfert a été envoyé avec succès.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "receipt.status": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Status",
      "source": "Statut",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "receipt.success": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "A mvus yë na akòbògò eyòṅ bod bëng",
      "source": "Succès",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "receipt.newTransfer": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò mkpamaṅ mbëmbë foe asu yë n",
      "source": "Nouveau transfert",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "error.title": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Mis mëngabò na: Mvulna",
      "source": "Une erreur est survenue",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "error.insufficientBalance": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò fë mbil esye asu yë na mam mvulna.",
      "source": "Solde insuffisant pour effectuer ce transfert.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "error.close": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò fë nkukuma a mvus hala,",
      "source": "Fermer",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "common.back": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm, akëlë kui.",
      "source": "Retour",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "common.continue": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Këlë kui asu yë na bakòb",
      "source": "Continuer",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.greeting": {
      "status": "provisional",
      "requiredSlots": [
        "name"
      ],
      "text": "Mina, {name}",
      "source": "Bonjour, {name}",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "balance.accountNumber": {
      "status": "provisional",
      "requiredSlots": [
        "account"
      ],
      "text": "Ndò mbëmbë na: {account}",
      "source": "Numéro de compte : {account}",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.alertTitle": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Dzam da, asu yë na bakòbò mam mëte.",
      "source": "Alerte de sécurité",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "security.verifyBeneficiaryBeforeContinue": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Ndò hm asu yë na: Biayi tsig efaè waan, oyab.",
      "source": "Alerte de sécurité : vérifiez le numéro du bénéficiaire avant de continuer.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    },
    "confirmation.requiredBeforeSubmit": {
      "status": "provisional",
      "requiredSlots": [],
      "text": "Miayi bò na mibëlë kad eyòṅ mam mëte, asu yë na minnalan fufulu we.",
      "source": "Vous devez confirmer les informations avant de valider le transfert.",
      "machineSource": "Flagship/Lingo cameroon-int8",
      "humanValidated": false,
      "qualityFlags": []
    }
  }
});
