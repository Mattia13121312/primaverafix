import {listReports} from "@/lib/reports";
import {json} from "@/lib/admin-auth";
export async function GET(){try{return json(await listReports());}catch{return json({error:"Segnalazioni non disponibili. Riprova."},503);}}
