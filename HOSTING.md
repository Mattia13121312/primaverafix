# Hosting gratuito su Cloudflare Workers

Il repository include `wrangler.jsonc` e un Worker autonomo che riutilizza le API e l’accesso ADMIN. Per questo percorso non serve compilare Vinext né importare la configurazione privata di Sites.

## Pubblicazione da GitHub

1. Accedi a Cloudflare e mantieni il piano Workers Free.
2. In Workers & Pages crea un Worker importando `Mattia13121312/primaverafix`, ramo `main`.
3. Nome Worker: `primaverafix`. Lascia vuoto il comando di build. Comando di deploy: `npx wrangler deploy`.
4. La configurazione richiede un database D1 denominato `primaverafix-db`, binding `DB`. Wrangler può crearlo automaticamente durante il primo deploy.
5. Applica gli schemi prima di usare le API: `npx wrangler d1 migrations apply DB --remote`. In alternativa esegui, in ordine, i due file `.sql` della cartella `drizzle` dalla console D1 di Cloudflare. Non caricare i file JSON di `drizzle/meta` nella console SQL.
6. Nelle impostazioni del Worker aggiungi come Secret `ADMIN_USERNAME`, `ADMIN_PASSWORD_SALT`, `ADMIN_PASSWORD_HASH`, `ADMIN_RATE_KEY`. Usa i valori di produzione: non le credenziali locali di prova. Nessuna password va inserita in GitHub.
7. Verifica la home all’indirizzo `workers.dev` restituito e il percorso `/admin`.

Dopo il primo deploy e le migrazioni, i push su `main` pubblicheranno gli aggiornamenti tramite Workers Builds. Il database rimane sul tuo account. Non attivare un piano a pagamento.

Il progetto parte senza segnalazioni. L’invio di nuovi moduli e allegati non è ancora attivo.
