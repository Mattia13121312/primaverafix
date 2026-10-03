import {GET as admin} from '../app/admin/route';
import {POST as login} from '../app/api/admin/login/route';
import {POST as logout} from '../app/api/admin/logout/route';
import {GET as session} from '../app/api/admin/session/route';
import {GET as reports} from '../app/api/reports/route';
import {GET as manage, PATCH, DELETE} from '../app/api/admin/reports/route';
const routes:Record<string,Record<string,(request:Request)=>Promise<Response>>>={
 '/admin':{GET:admin},'/api/admin/login':{POST:login},'/api/admin/logout':{POST:logout},
 '/api/admin/session':{GET:session},'/api/reports':{GET:reports},
 '/api/admin/reports':{GET:manage,PATCH,DELETE}
};
export default {async fetch(request:Request,env:{ASSETS:Fetcher}){
 const path=new URL(request.url).pathname.replace(/\/$/,'')||'/';
 const route=routes[path];
 if(route){const handler=route[request.method];return handler?handler(request):new Response('Metodo non consentito',{status:405,headers:{Allow:Object.keys(route).join(', '),'Cache-Control':'no-store'}});}
 if(path.startsWith('/api/'))return new Response('Non trovato',{status:404});
 return env.ASSETS.fetch(request);
}};
