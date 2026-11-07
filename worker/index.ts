import {POST as login} from '../app/api/admin/login/route';
import {POST as logout} from '../app/api/admin/logout/route';
import {GET as session} from '../app/api/admin/session/route';
import {submit,list,manage,media,vote,stats} from './reports';
const routes:Record<string,Record<string,(request:Request)=>Promise<Response>>>={
 '/api/admin/login':{POST:login},'/api/admin/logout':{POST:logout},
 '/api/admin/session':{GET:session},'/api/reports':{GET:r=>list(r),POST:submit},
 '/api/stats':{GET:stats},'/api/admin/reports':{GET:r=>list(r,true),PATCH:manage,DELETE:manage}
};
export default {async fetch(request:Request,env:{ASSETS:Fetcher}){
 const path=new URL(request.url).pathname.replace(/\/$/,'')||'/';
 if(path==='/admin'||path==='/admin.html'){const u=new URL(request.url);u.pathname='/admin-panel';const response=await env.ASSETS.fetch(new Request(u,request));const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('Content-Type','text/html; charset=utf-8');headers.set('X-Frame-Options','DENY');return new Response(response.body,{status:response.status,headers});}
 try{
 const match=path.match(/^\/api\/media\/([a-f0-9-]{36})$/);if(match&&['GET','HEAD'].includes(request.method))return await media(request,match[1]);
 const voting=path.match(/^\/api\/reports\/(PF-[A-F0-9]{8})\/vote$/);if(voting&&['POST','DELETE'].includes(request.method))return await vote(request,voting[1]);
 const route=routes[path];
 if(route){const handler=route[request.method];return handler?await handler(request):new Response('Metodo non consentito',{status:405,headers:{Allow:Object.keys(route).join(', '),'Cache-Control':'no-store'}});}
 if(path.startsWith('/api/'))return new Response('Non trovato',{status:404});
 return env.ASSETS.fetch(request);
 }catch(error){console.error('Richiesta non riuscita',error instanceof Error?error.name:'Error');return Response.json({error:'Servizio momentaneamente non disponibile. Riprova.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}};
