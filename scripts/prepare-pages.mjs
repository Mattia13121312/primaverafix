import {cp, mkdir, readFile, writeFile, rm, readdir} from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve('.pages');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp('public',output,{recursive:true});
for(const filename of await readdir(output)){
 if(!/\.(html|js)$/.test(filename))continue;
 const file=path.join(output,filename);
 let source=await readFile(file,'utf8');
 if(filename.endsWith('.html')){
  source=source.replace('</head>','<script>window.PRIMAVERA_STATIC=true;</script></head>');
  source=source.replaceAll('src="mappa.js"','src="mappa.js?v=20261107-outdoor"');
  source=source.replaceAll('src="geographic.js"','src="geographic.js?v=20261107-sciarra-volsci"').replaceAll('src="campus-data.js"','src="campus-data.js?v=20261107-sciarra-volsci"');
  source=source.replaceAll('href="/admin"','href="admin.html"');
  source=source.replace(/href="\/#([^\"]*)"/g,'href="./#$1"');
  source=source.replaceAll('href="/"','href="./"');
 }
 source=source.replaceAll("fetch('/api/reports')","fetch('reports.json')");
 if(filename.endsWith('.html'))source=source.replace('</body>','<script src="language.js?v=20261107-outdoor"></script></body>');
 await writeFile(file,source);
}
await writeFile(path.join(output,'reports.json'),'[]\n');
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'admin.html'),`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accesso ADMIN — Primavera Fix</title><link rel="icon" type="image/png" href="udu-primavera-sapienza.png"><style>body{margin:0;background:#101114;color:#f7f7f8;font:16px system-ui;display:grid;min-height:100vh;place-items:center}main{max-width:540px;margin:24px;padding:32px;background:#1b1d23;border:1px solid #373c47;border-radius:18px}img{width:64px;border-radius:50%}h1{font-size:30px}p{color:#b8c2cf;line-height:1.6}a{color:#ff751f}</style></head><body><main><img src="udu-primavera-sapienza.png" alt="UDU – Primavera Sapienza"><h1>Area ADMIN</h1><p>Questa versione su GitHub Pages ospita le pagine e le mappe. L’accesso ADMIN e la gestione delle segnalazioni richiedono il server e il database, non disponibili su Pages.</p><a href="./">← Torna alla home</a></main></body></html>`);
const adminPath=path.join(output,'admin.html');await writeFile(adminPath,(await readFile(adminPath,'utf8')).replace('</body>','<script src="language.js?v=20261107-outdoor"></script></body>'));
console.log('GitHub Pages: pagine, stili, immagini, mappe e dati vuoti preparati in .pages');

// Preserve existing bookmarks while serving the functional site from Cloudflare.
for(const filename of ['index.html','mappa.html','segnalazioni.html','admin.html']){
 const destination='https://primaverafix.primavera-sapienza.workers.dev/'+(filename==='index.html'?'':filename==='admin.html'?'admin':filename);
 const title=filename==='admin.html'?'Area ADMIN':'Primavera Fix';
 const html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${destination}"><title>${title}</title><link rel="canonical" href="${destination}"><style>body{background:#101114;color:white;font:18px system-ui;padding:10vh 8vw}a{color:#ffad70}</style></head><body><p>Primavera Fix è online al nuovo indirizzo.</p><a href="${destination}">Apri il sito</a><script>location.replace(${JSON.stringify(destination)}+location.search+location.hash);</script></body></html>`;
 await writeFile(path.join(output,filename),html);
}
