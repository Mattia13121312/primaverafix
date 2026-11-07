# Primavera Fix

Portale di UDU–Primavera Sapienza per le segnalazioni degli spazi universitari.

- Sito: https://primaverafix.primavera-sapienza.workers.dev
- Admin: https://primaverafix.primavera-sapienza.workers.dev/admin

Invio, moderazione, allegati, aggiornamento degli stati, voti e statistiche usano Cloudflare Workers e D1. I contatti facoltativi sono riservati all'admin. Gli invii diventano pubblici solo dopo l'approvazione.

Gli allegati usano D1, senza R2: massimo 3 file da 2 MiB e 150 MiB complessivi. Foto e brevi video sono supportati nei formati indicati nel modulo. I limiti del piano gratuito restano applicabili.

Per configurazione, sviluppo, test e pubblicazione leggere [HOSTING.md](HOSTING.md). Nessuna password, token o configurazione locale privata deve essere commessa nel repository.
