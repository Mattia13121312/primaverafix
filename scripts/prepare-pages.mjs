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
  source=source.replaceAll('href="/admin"','href="admin.html"');
  source=source.replace(/href="\/#([^\"]*)"/g,'href="./#$1"');
  source=source.replaceAll('href="/"','href="./"');
 }
 source=source.replaceAll("fetch('/api/reports')","fetch('reports.json')");
 await writeFile(file,source);
}
await writeFile(path.join(output,'reports.json'),'[]\n');
await writeFile(path.join(output,'.nojekyll'),'');
await writeFile(path.join(output,'admin.html'),`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accesso ADMIN — Primavera Fix</title><style>body{margin:0;background:#101114;color:#f7f7f8;font:16px system-ui;display:grid;min-height:100vh;place-items:center}main{max-width:540px;margin:24px;padding:32px;background:#1b1d23;border:1px solid #373c47;border-radius:18px}img{width:64px;border-radius:50%}h1{font-size:30px}p{color:#b8c2cf;line-height:1.6}a{color:#ff751f}</style></head><body><main><img src="primavera-sapienza.jpeg" alt="Primavera Sapienza"><h1>Area ADMIN</h1><p>Questa versione su GitHub Pages ospita le pagine e le mappe. L’accesso ADMIN e la gestione delle segnalazioni richiedono il server e il database, non disponibili su Pages.</p><a href="./">← Torna alla home</a></main></body></html>`);
console.log('GitHub Pages: pagine, stili, immagini, mappe e dati vuoti preparati in .pages');
