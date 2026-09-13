// Observational hook: always returns neutral JSON, including on timeout or failure.
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { normalizeHook } from './normalize.mjs';
let finished=false;
function done(){if(finished)return;finished=true;process.stdout.write('{}\n',()=>process.exit(0));}
setTimeout(done,1400);
try{
  let body='',size=0;for await(const chunk of process.stdin){size+=chunk.length;if(size>8*1024*1024){done();break;}body+=chunk;}
  if(!finished){
    const event=normalizeHook(process.argv[2],JSON.parse(body));
    if(!event)done();
    else{
      const config=JSON.parse(await readFile(process.env.TRANSIT_CONNECTION_FILE||fileURLToPath(new URL('../.local/connection.json',import.meta.url)),'utf8'));
      const payload=JSON.stringify(event);
      const req=http.request({hostname:'127.0.0.1',port:config.port,path:'/ingest',method:'POST',timeout:500,headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload),'X-Transit-Token':config.token}},res=>{res.resume();res.on('end',done);});
      req.on('error',done);req.on('timeout',()=>{req.destroy();done();});req.end(payload);
    }
  }
}catch{done();}
