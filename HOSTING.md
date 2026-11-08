# Primavera Fix su Cloudflare Workers Free

Sito: https://primaverafix.primavera-sapienza.workers.dev
Admin: https://primaverafix.primavera-sapienza.workers.dev/admin

## Componenti

- Worker `primaverafix`, con asset statici preparati da `scripts/prepare-worker.mjs`.
- Database D1 `primaverafix-db`, binding `DB` e migrazioni SQL in `drizzle/`.
- Nessuna sottoscrizione R2 e nessun servizio a pagamento richiesto. Gli allegati sono conservati in D1 in blocchi base64, privati fino alla pubblicazione del relativo report.
- Limiti applicativi: 3 file per invio, 2 MiB ciascuno, 300 MiB complessivi di file originali (circa 400 MiB codificati, oltre a metadati e indici). I file nel cestino occupano ancora spazio. A quota esaurita il server rifiuta nuovi allegati e invita a inviare senza file.
- Formati ammessi: JPG, PNG, GIF, WebP, MP4, MOV e WebM; firma iniziale controllata sul server. Non è un servizio di elaborazione o transcodifica video.

## Flusso

Ogni nuovo invio riceve un ID e resta da moderare. L'admin può pubblicare o nascondere, aggiornare lo stato, aggiungere un aggiornamento pubblico, spostare nel cestino e ripristinare. La pubblicazione rende visibili anche gli allegati: controllarli prima di approvare. Email/telefono e ruolo non sono restituiti dall'API pubblica. Le descrizioni non vengono tradotte automaticamente.

I voti sono persistenti e collegati a un identificativo pseudonimo nel browser; non equivalgono a una verifica dell'identità. Il limite degli invii è 5 per IP ogni ora. Il cambio di browser può consentire un nuovo voto. L'invio usa un identificativo per evitare duplicati durante i tentativi di ripetizione.

## Accesso e segreti

I segreti di produzione sono memorizzati in Cloudflare: `ADMIN_USERNAME`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`, `ADMIN_RATE_KEY`. La password non va inserita nel repository. Le sessioni admin durano due ore, usano cookie HttpOnly/Secure e sono controllate dal server. Le modifiche richiedono la stessa origine. I tentativi di login sono limitati.

`.dev.vars` e `tests/.artifacts/` sono esclusi dal repository e contengono soltanto configurazione o dati di test locali. `scripts/cloudflare-secrets.mjs` riceve via stdin nascosto i quattro valori verificati e li trasferisce a Wrangler. Non usare credenziali locali di test per la produzione.

## Sviluppo e pubblicazione

Richiede Node.js 22.13 o superiore e le dipendenze del repository.

```sh
npm ci
npm run check:cloudflare
npx wrangler d1 migrations apply DB --local
npm run dev:cloudflare
```

Per aggiornare il sito sul proprio account autorizzato:

```sh
npx wrangler login
npx wrangler d1 migrations apply DB --remote
npm run deploy:cloudflare
```

Non usare la build Vinext per questo percorso. `wrangler.jsonc` configura il Worker autonomo, gli asset e il database. I push GitHub da soli non aggiornano il Worker: la pubblicazione richiede il comando sopra o un'integrazione Workers Builds autorizzata dal proprietario. Il vecchio GitHub Pages reindirizza al Worker.

## Verifiche

`tests/backend.mjs` verifica il flusso completo contro il server locale sulla porta 5181, con credenziali di test in `tests/.artifacts/credentials.json`. Il database locale deve essere isolato. `tests/production-smoke.mjs` riceve il login via stdin nascosto, verifica un file al limite di 2 MiB e rimuove in `finally` esclusivamente i dati del proprio UUID di test, controllandone l'assenza.

D1 Free ha limiti di spazio e operazioni giornaliere. Se vengono raggiunti, il servizio può rifiutare operazioni: non promette capacità illimitata. Usare le metriche D1 e il ripristino Time Travel dal proprio account. I backup D1 contengono anche contatti e allegati e vanno conservati in modo riservato.
