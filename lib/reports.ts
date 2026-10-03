import {db} from "./admin-auth";
import {reportData} from "./report-data";
export async function listReports(){const result=await db().prepare("SELECT report_id,status,deleted FROM report_overrides").all<{report_id:string,status:string|null,deleted:number}>();const overrides=new Map(result.results.map(r=>[r.report_id,r]));return reportData.filter(r=>!overrides.get(r.id)?.deleted).map(r=>({...r,status:overrides.get(r.id)?.status||r.status}));}
