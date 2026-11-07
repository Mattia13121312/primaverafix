import {readFile,writeFile,mkdir,cp,rm,rename} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const context={window:{}};vm.createContext(context);
for(const file of ['campus-data.js','campus-grass.js'])vm.runInContext(await readFile('public/'+file,'utf8'),context);
const features=[...context.window.CAMPUS_DATA.features,...context.window.CAMPUS_PLACES.features];
const mapSource=await readFile('public/mappa.js','utf8');
const categories=JSON.parse(mapSource.match(/const problemProfiles=(\{[^\n]+\});/)[1]);
await mkdir('worker/generated',{recursive:true});
const catalog=JSON.stringify({places:features.map(f=>f.properties),profiles:categories});if(await readFile('worker/generated/catalog.json','utf8').catch(()=>null)!==catalog)await writeFile('worker/generated/catalog.json',catalog);
await rm('.worker-assets',{recursive:true,force:true});await cp('public','.worker-assets',{recursive:true});
await cp('worker/admin.html','.worker-assets/admin.html');
for(const file of ['index.html','mappa.html','segnalazioni.html','admin.html']){
 let html=await readFile('.worker-assets/'+file,'utf8');
 if(!html.includes('src="language.js'))html=html.replace('</body>','<script src="language.js"></script></body>');
 for(const asset of ['language.js','mappa.js','segnalazioni.js','home.js','geographic.js','admin.js']){
  const version=createHash('sha256').update(await readFile('public/'+asset)).digest('hex').slice(0,10);
  html=html.replaceAll('src="'+asset+'"','src="'+asset+'?v='+version+'"');
 }
 await writeFile('.worker-assets/'+file,html);
}
console.log('Asset e catalogo Cloudflare pronti.');

await rename('.worker-assets/admin.html','.worker-assets/admin-panel');
