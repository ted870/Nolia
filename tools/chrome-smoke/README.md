# Vérification Chrome sur page simulée

Outil de développement, **non chargé par l'extension**. Il ne remplace pas un
test sur le vrai https://safinum.cm/hackathon-test.

- `mock-safinum.html` reprend des textes du catalogue (pas le code de Safinum).
- `chrome-smoke.mjs` lance Chrome avec l'extension non empaquetée, fait pointer
  `safinum.cm` vers un serveur HTTPS local (certificat autosigné) et vérifie :
  panneau, mode TEST, notification ajoutée après chargement, restauration
  exacte nœud par nœud, boutons du site, absence de requêtes externes.

```bash
cd tools/chrome-smoke
npm install
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 2 \
  -subj "/CN=safinum.cm" -addext "subjectAltName=DNS:safinum.cm"
CHROME_PATH=/usr/bin/google-chrome node chrome-smoke.mjs "$(cd ../.. && pwd)" ./out --provisional
```

L'option `--provisional` vérifie le bouton éwondo automatique, les marqueurs
`[AUTO]`, les valeurs protégées et la restauration du français. Adaptez
`CHROME_PATH` si Chrome ou Chromium se trouve ailleurs.
