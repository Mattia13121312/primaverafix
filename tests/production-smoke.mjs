import assert from 'node:assert/strict';
import {createInterface} from 'node:readline';
import {execFileSync,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
import {writeFile} from 'node:fs/promises';
if(process.stdin.isTTY)execFileSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']});
process.on('exit',()=>{if(process.stdin.isTTY)try{execFileSync('stty',['echo'],{stdio:['inherit','ignore','ignore']});}catch{}});
console.log('Ready for admin login JSON on stdin (input hidden).');
const rl=createInterface({input:process.stdin,terminal:false});
const credentials=await new Promise(resolve=>rl.once('line',line=>{rl.close();process.stdin.pause();resolve(JSON.parse(line));}));
const base='https://primaverafix.primavera-sapienza.workers.dev';
const login=await fetch(base+'/api/admin/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(credentials)});assert.equal(login.status,200,'Login produzione');
const cookie=login.headers.get('set-cookie').split(';')[0];
assert.equal((await fetch(base+'/api/admin/reports')).status,401);
const submissionKey=crypto.randomUUID();
try{
const form=new FormData();for(const [k,v]of Object.entries({submissionKey,code:'CU001',floor:'terra',location:'test tecnico temporaneo',category:'Elettrico / illuminazione',description:'TEST TECNICO TEMPORANEO: verifica del servizio. Da rimuovere prima del rilascio.',urgency:'Bassa',role:'Altro',contact:'test@example.invalid',website:''}))form.set(k,v);
const bytes=Buffer.alloc(2*1024*1024);Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=','base64').copy(bytes);form.append('attachments',new File([bytes],'test-tecnico.png',{type:'image/png'}));
const submitted=await fetch(base+'/api/reports',{method:'POST',headers:{Origin:base},body:form});const result=await submitted.json();assert.equal(submitted.status,201,JSON.stringify(result));
await writeFile('tests/.artifacts/production-smoke.json',JSON.stringify({id:result.id}));
const all=await(await fetch(base+'/api/admin/reports',{headers:{Cookie:cookie}})).json(),r=all.find(r=>r.id===result.id);assert.ok(r);assert.equal(r.contact,'test@example.invalid');assert.equal(r.attachments[0].size,bytes.length);
assert.equal((await fetch(base+r.attachments[0].url)).status,404);
const media=await fetch(base+r.attachments[0].url,{headers:{Cookie:cookie}});assert.equal(media.status,200);assert.equal(Buffer.compare(Buffer.from(await media.arrayBuffer()),bytes),0);
const range=await fetch(base+r.attachments[0].url,{headers:{Cookie:cookie,Range:'bytes=0-7'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,8);
assert.equal((await(await fetch(base+'/api/reports')).json()).some(r=>r.id===result.id),false);
await fetch(base+'/api/admin/logout',{method:'POST',headers:{Origin:base,Cookie:cookie}});
console.log('OK: produzione, login, invio, file da 2 MB integro, lettura parziale video, moderazione privata e contatto riservato. Test id: '+result.id);

}finally{
 assert.match(submissionKey,/^[a-f0-9-]{36}$/);
 const selection="SELECT id FROM reports WHERE submission_key='"+submissionKey+"'";
 const sql="DELETE FROM attachment_chunks WHERE attachment_id IN (SELECT id FROM attachments WHERE report_id IN ("+selection+")); DELETE FROM report_votes WHERE report_id IN ("+selection+"); DELETE FROM attachments WHERE report_id IN ("+selection+"); DELETE FROM reports WHERE submission_key='"+submissionKey+"'; SELECT COUNT(*) AS remaining FROM reports WHERE submission_key='"+submissionKey+"';";
 const result=await promisify(execFile)(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--remote','--json','--command',sql],{env:{...process.env,PATH:path.dirname(process.execPath)+':'+process.env.PATH,WRANGLER_LOG_PATH:'/private/tmp/pf-smoke-cleanup.log'},maxBuffer:2*1024*1024});
 const results=JSON.parse(result.stdout);assert.equal(results.at(-1).results[0].remaining,0);console.log('Cleanup verificato: nessuna segnalazione tecnica rimasta online.');
}
