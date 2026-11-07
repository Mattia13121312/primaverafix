import {spawn,execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline';
if(process.stdin.isTTY)execFileSync('stty',['-echo'],{stdio:['inherit','ignore','ignore']});
process.on('exit',()=>{if(process.stdin.isTTY)try{execFileSync('stty',['echo'],{stdio:['inherit','ignore','ignore']});}catch{}});
console.log('Ready for verified admin secrets JSON on stdin (input hidden).');
const rl=createInterface({input:process.stdin,terminal:false});
rl.once('line',line=>{rl.close();process.stdin.pause();const values=JSON.parse(line);const expected=['ADMIN_USERNAME','ADMIN_PASSWORD_SALT','ADMIN_PASSWORD_HASH','ADMIN_RATE_KEY'];if(Object.keys(values).length!==4||expected.some(k=>typeof values[k]!=='string'||!values[k]))throw Error('Secret payload non valido');const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','bulk'],{stdio:['pipe','inherit','inherit'],env:process.env});child.stdin.end(JSON.stringify(values));child.on('exit',code=>process.exit(code??1));});
