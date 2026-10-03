# Primavera Fix

Portale per le segnalazioni degli spazi Sapienza. Interfaccia scura, mappa delle sedi, elenco segnalazioni e accesso ADMIN.

## Stato

Il progetto parte senza segnalazioni e con statistiche azzerate. Non contiene dati dimostrativi. Il pannello ADMIN gestisce stato e rimozione delle segnalazioni disponibili; l’invio pubblico di nuove segnalazioni e allegati non è ancora attivo.

## Avvio

Node.js e npm: `npm install`, `npm run build`, `npm run dev`. Il runtime utilizza Cloudflare Workers e D1. Applicare le migrazioni in `drizzle/` al database associato.

## Configurazione

Configurare le variabili elencate in `.env.example` nel servizio di hosting. Le credenziali ADMIN non sono incluse nel repository: la password si verifica tramite hash PBKDF2 con salt. Non caricare `.dev.vars`, file `.env`, token, database locali o `node_modules`.
