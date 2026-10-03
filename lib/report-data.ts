export type Report={id:string;code:string;building:string;place:string;category:string;title:string;description:string;status:string;urgency:string;votes:number;time:string;age:number;crop:number[];point:number[];shape:string};
export const reportData:Report[]=[];
export const statuses=["Da prendere in carico","Inviata all’Ateneo","In lavorazione","Risolta"];
