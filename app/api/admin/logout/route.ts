import {db,digest,token,cookie,sameOrigin,json} from "@/lib/admin-auth";
export async function POST(request:Request){if(!sameOrigin(request))return json({error:"Richiesta non consentita."},403);const raw=token(request);if(raw)await db().prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await digest(raw)).run();return json({ok:true},200,{"Set-Cookie":cookie(request,"",0)});}
