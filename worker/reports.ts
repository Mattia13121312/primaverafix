import catalog from './generated/catalog.json';
import {Buffer} from 'node:buffer';
import {db,json,sameOrigin,authenticated,digest} from '../lib/admin-auth';
import {env} from 'cloudflare:workers';
const settings=env as unknown as {ADMIN_RATE_KEY:string};
const states=['Da prendere in carico','Inviata all’Ateneo','In lavorazione','Risolta'];
const roles=['Studente / studentessa','Docente','Dottorando / dottoranda','Ricercatore / ricercatrice','Personale tecnico-amministrativo','Altro'];

type Row=Record<string,any>;
const text=(form:FormData,key:string,max:number)=>{const value=form.get(key);if(typeof value!=='string'||value.length>max)throw Error('Campo non valido: '+key);return value.trim();};
async function limited(request:Request,action:string,count:number,seconds:number){
 if(!settings.ADMIN_RATE_KEY)throw Error('Servizio non configurato');
 const ip=request.headers.get('cf-connecting-ip')||'local';
 const key=await digest(settings.ADMIN_RATE_KEY+action+ip),window=Math.floor(Date.now()/(seconds*1000));
 const row=await db().prepare('INSERT INTO request_limits (key,window,count) VALUES (?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN request_limits.window=excluded.window THEN request_limits.count+1 ELSE 1 END,window=excluded.window RETURNING count').bind(key,window).first<{count:number}>();
 return !!row&&row.count<=count;
}
async function mediaType(file:File){
 const b=new Uint8Array(await file.slice(0,32).arrayBuffer()),s=new TextDecoder().decode(b);
 if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';
 if(b[0]===137&&s.slice(1,4)==='PNG')return 'image/png';
 if(s.startsWith('GIF87a')||s.startsWith('GIF89a'))return 'image/gif';
 if(s.startsWith('RIFF')&&s.slice(8,12)==='WEBP')return 'image/webp';
 if(b[0]===26&&b[1]===69&&b[2]===223&&b[3]===163)return 'video/webm';
 if(s.slice(4,8)==='ftyp'&&/^(isom|iso[2-9]|mp4[12]|avc1|M4V |qt  )/.test(s.slice(8,12)))return s.slice(8,12)==='qt  '?'video/quicktime':'video/mp4';
 throw Error('Formato allegato non supportato. Usa JPG, PNG, GIF, WebP, MP4, MOV o WebM.');
}
export async function submit(request:Request){
 if(!sameOrigin(request))return json({error:'Richiesta non consentita.'},403);
 if(!/multipart\/form-data/i.test(request.headers.get('content-type')||''))return json({error:'Formato richiesta non valido.'},415);
 if(Number(request.headers.get('content-length'))>7*1024*1024)return json({error:'Allegati troppo grandi.'},413);
 if(!await limited(request,'submit',5,3600))return json({error:'Hai raggiunto il limite di invii. Riprova tra un’ora.'},429);
 let form:FormData;try{form=await request.formData();}catch{return json({error:'Impossibile leggere il modulo.'},400);}
 
 try{
  if(form.get('website'))return json({error:'Invio non consentito.'},400);
  const submission=text(form,'submissionKey',80);if(!/^[a-f0-9-]{36}$/.test(submission))throw Error('Identificativo invio non valido. Ricarica la pagina.');
  const existing=await db().prepare('SELECT id FROM reports WHERE submission_key=?').bind(submission).first<{id:string}>();if(existing)return json({ok:true,id:existing.id,pending:true});
  const code=text(form,'code',50),place=catalog.places.find((p:any)=>p.code===code);if(!place)throw Error('Scegli un luogo valido.');
  const kind=('kind' in place?place.kind:'building') as keyof typeof catalog.profiles;
  const category=text(form,'category',150);if(!catalog.profiles[kind].categories.includes(category))throw Error('Scegli una categoria valida per il luogo.');
  const description=text(form,'description',2500);if(description.length<10)throw Error('Descrivi il problema con almeno 10 caratteri.');
  const urgency=text(form,'urgency',10),role=text(form,'role',100),contact=text(form,'contact',150),floor=text(form,'floor',60),location=text(form,'location',200);
  if(!['Bassa','Media','Alta'].includes(urgency)||!roles.includes(role))throw Error('Controlla urgenza e ruolo.');
  if(kind==='building'&&(!floor||!location))throw Error('Indica piano e aula o luogo specifico.');
  if(contact&&!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)||(/^[+\d\s().-]+$/.test(contact)&&contact.replace(/\D/g,'').length>=6&&contact.replace(/\D/g,'').length<=15)))throw Error('Contatto non valido. Puoi lasciare il campo vuoto.');
  const incoming=form.getAll('attachments');if(incoming.length>3)throw Error('Puoi allegare al massimo 3 file.');
  const checked: {file:File;mime:string}[]=[];
  for(const item of incoming){if(typeof item==='string'||!item.size||item.size>2*1024*1024)throw Error('Ogni allegato deve essere un file di massimo 2 MB.');checked.push({file:item,mime:await mediaType(item)});}
  const id='PF-'+crypto.randomUUID().slice(0,8).toUpperCase(),now=Date.now(),attachmentRows=[];
  for(const {file,mime}of checked){const aid=crypto.randomUUID(),key=id+'/'+aid,data=Buffer.from(await file.arrayBuffer()).toString('base64');attachmentRows.push({id:aid,key,name:file.name.slice(0,180),mime,size:file.size,data});}
  const stmts=[db().prepare('INSERT INTO reports (id,submission_key,code,building,faculty,site,floor,location,category,title,description,urgency,role,contact,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,submission,code,place.name,place.faculty,place.site,kind==='building'?floor:'Spazio esterno',location,category,description.replace(/\s+/g,' ').slice(0,85),description,urgency,role,contact,now,now)];
  for(const a of attachmentRows){stmts.push(db().prepare('INSERT INTO attachments (id,report_id,object_key,name,mime,size) VALUES (?,?,?,?,?,?)').bind(a.id,id,a.key,a.name,a.mime,a.size));for(let offset=0,seq=0;offset<a.data.length;offset+=524288,seq++)stmts.push(db().prepare('INSERT INTO attachment_chunks (attachment_id,seq,data) VALUES (?,?,?)').bind(a.id,seq,a.data.slice(offset,offset+524288)));}
  await db().batch(stmts);return json({ok:true,id,pending:true},201);
 }catch(error){const message=error instanceof Error?error.message:'';if(message.includes('STORAGE_FULL'))return json({error:'Spazio allegati esaurito. Invia la segnalazione senza allegati.'},507);if(/D1|SQLITE|database|constraint/i.test(message))return json({error:'Invio non riuscito. Riprova.'},503);return json({error:message||'Invio non riuscito.'},400);}
}
function display(row:Row,attachments:Row[],admin=false){
 const created=Number(row.created_at),age=Math.max(0,Math.floor((Date.now()-created)/60000));
 return {id:row.id,code:row.code,building:row.building,place:[row.floor,row.location].filter(Boolean).join(' · '),category:row.category,title:row.title,description:row.description,status:row.status,urgency:row.urgency,votes:row.votes||0,supported:!!row.supported,time:new Date(created).toLocaleDateString('it-IT',{timeZone:'Europe/Rome'}),age,createdAt:created,updatedAt:row.updated_at,publicNote:row.public_note,attachments:attachments.filter(a=>a.report_id===row.id).map(a=>({id:a.id,name:a.name,mime:a.mime,size:a.size,url:'/api/media/'+a.id})),...(admin?{contact:row.contact,role:row.role,published:!!row.published,deleted:!!row.deleted,faculty:row.faculty}:{} )};
}
export async function list(request:Request,admin=false){
 if(admin&&!await authenticated(request))return json({error:'Accedi per continuare.'},401);
 const rawVoter=request.headers.get('cookie')?.match(/(?:^|;\s*)pf_voter=([a-f0-9-]{36})(?:;|$)/)?.[1];const voter=rawVoter?await digest(settings.ADMIN_RATE_KEY+rawVoter):'';
 const rows=await db().prepare(`SELECT r.*, EXISTS(SELECT 1 FROM report_votes v WHERE v.report_id=r.id AND v.voter=?) AS supported, (SELECT COUNT(*) FROM report_votes v WHERE v.report_id=r.id) AS votes FROM reports r ${admin?'':'WHERE r.published=1 AND r.deleted=0'} ORDER BY r.created_at DESC LIMIT 500`).bind(voter).all<Row>();
 const a=await db().prepare(`SELECT a.* FROM attachments a JOIN reports r ON a.report_id=r.id ${admin?'':'WHERE r.published=1 AND r.deleted=0'}`).all<Row>();
 return json(rows.results.map(r=>display(r,a.results,admin)));
}
export async function manage(request:Request){
 if(!sameOrigin(request))return json({error:'Richiesta non consentita.'},403);
 if(!await authenticated(request))return json({error:'Sessione scaduta.'},401);
 if(Number(request.headers.get('content-length'))>8192)return json({error:'Richiesta troppo grande.'},413);
 const body=await request.json().catch(()=>null) as any;
 if(!body||typeof body.id!=='string')return json({error:'Segnalazione non valida.'},400);
 const row=await db().prepare('SELECT * FROM reports WHERE id=?').bind(body.id).first<Row>();if(!row)return json({error:'Segnalazione non trovata.'},404);
 if(request.method==='DELETE'){await db().prepare('UPDATE reports SET deleted=1,published=0,updated_at=? WHERE id=?').bind(Date.now(),body.id).run();return json({ok:true});}
 if(body.status!==undefined&&!states.includes(body.status)||body.published!==undefined&&typeof body.published!=='boolean'||body.deleted!==undefined&&typeof body.deleted!=='boolean'||body.publicNote!==undefined&&(typeof body.publicNote!=='string'||body.publicNote.length>1500))return json({error:'Modifica non valida.'},400);
 const deleted=body.deleted===undefined?row.deleted:Number(body.deleted),published=deleted?0:body.published===undefined?row.published:Number(body.published),status=body.status||row.status;
 await db().prepare('UPDATE reports SET status=?,published=?,deleted=?,public_note=?,updated_at=?,resolved_at=?,first_response_at=? WHERE id=?').bind(status,published,deleted,body.publicNote??row.public_note,Date.now(),status==='Risolta'?(row.resolved_at||Date.now()):null,row.first_response_at||(status!==row.status?Date.now():null),body.id).run();return json({ok:true});
}
export async function media(request:Request,id:string){
 const row=await db().prepare('SELECT a.*,r.published,r.deleted FROM attachments a JOIN reports r ON r.id=a.report_id WHERE a.id=?').bind(id).first<Row>();
 if(!row||(!(row.published&&!row.deleted)&&!await authenticated(request)))return new Response('Non trovato',{status:404});
 const parts=await db().prepare('SELECT data FROM attachment_chunks WHERE attachment_id=? ORDER BY seq').bind(id).all<{data:string}>();
 const bytes=Buffer.from(parts.results.map(p=>p.data).join(''),'base64');
 const headers=new Headers({'Content-Type':row.mime,'Content-Disposition':'inline; filename="allegato"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Content-Security-Policy':"default-src 'none'; sandbox"});
 const range=request.headers.get('range');if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+bytes.length}});let start=m[1]?Number(m[1]):Math.max(0,bytes.length-Number(m[2])),end=m[1]?(m[2]?Math.min(Number(m[2]),bytes.length-1):bytes.length-1):bytes.length-1;if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=bytes.length)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+bytes.length}});headers.set('Content-Range',`bytes ${start}-${end}/${bytes.length}`);headers.set('Content-Length',String(end-start+1));return new Response(request.method==='HEAD'?null:bytes.subarray(start,end+1),{status:206,headers});}
 headers.set('Content-Length',String(bytes.length));return new Response(request.method==='HEAD'?null:bytes,{headers});
}
export async function vote(request:Request,id:string){
 if(!sameOrigin(request))return json({error:'Richiesta non consentita.'},403);
 if(!await limited(request,'vote',120,3600))return json({error:'Troppi tentativi.'},429);
 const row=await db().prepare('SELECT id FROM reports WHERE id=? AND published=1 AND deleted=0').bind(id).first();if(!row)return json({error:'Segnalazione non trovata.'},404);
 let raw=request.headers.get('cookie')?.match(/(?:^|;\s*)pf_voter=([a-f0-9-]{36})(?:;|$)/)?.[1];const fresh=!raw;if(!raw)raw=crypto.randomUUID();
 const voter=await digest(settings.ADMIN_RATE_KEY+raw);
 if(request.method==='DELETE')await db().prepare('DELETE FROM report_votes WHERE report_id=? AND voter=?').bind(id,voter).run();else await db().prepare('INSERT OR IGNORE INTO report_votes (report_id,voter) VALUES (?,?)').bind(id,voter).run();
 const total=await db().prepare('SELECT COUNT(*) AS count FROM report_votes WHERE report_id=?').bind(id).first<{count:number}>();
 return json({votes:total?.count||0,supported:request.method==='POST'},200,fresh?{'Set-Cookie':`pf_voter=${raw}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`}:{ });
}
export async function stats(){
 const row=await db().prepare("SELECT COUNT(*) AS total,COALESCE(SUM(status='Risolta'),0) AS solved,COALESCE(SUM(status='Inviata all’Ateneo'),0) AS ateneo,COALESCE(SUM(created_at>=?),0) AS month,AVG(CASE WHEN first_response_at IS NOT NULL THEN (first_response_at-created_at)/86400000.0 END) AS responseDays FROM reports WHERE published=1 AND deleted=0").bind(Date.now()-30*86400000).first();return json(row);
}
