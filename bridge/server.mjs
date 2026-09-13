import http from 'node:http';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { validateEvent } from './normalize.mjs';
import {createLineageResolver} from './lineage.mjs';
import {createStatusReader} from './reconcile.mjs';
import {createAudioHub} from './audio.mjs';
import '../public/animations.js';
import '../public/world.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=path.join(root,'public');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.json':'application/json; charset=utf-8'};
export async function createBridge({port=49157,writeConfig=true,lineageResolver=null,initialSnapshot=null,statusReader=null,audioHub=null,reconcileInterval=60000}={}){
  const token=randomBytes(32).toString('hex');const clients=new Set();const world=new globalThis.TransitWorld.World();world.mode='live';let started=Date.now(),counts={codex:0,claude:0},recent=[];
  if(initialSnapshot){
    world.restore(initialSnapshot);
    for(const a of world.agents.values())a.observedAt=Number(a.observedAt)||Date.now()-Math.max(0,-a.last)*1000;
    if(initialSnapshot.providers)for(const provider of ['codex','claude'])counts[provider]=Math.max(0,Number(initialSnapshot.providers[provider])||0);
    if(lineageResolver)for(const a of world.agents.values()){
      const e=await lineageResolver.enrich({provider:a.provider,sessionId:a.id.slice(a.provider.length+1)});
      if(e.parentId){a.parent=a.provider+':'+e.parentId;if(e.label)a.name=e.label;}
    }
  }
  function tick(){world.time=(Date.now()-started)/1000;world.update(0);}
  let revision=0,checking=null;const verification={lastCheckAt:null,checked:0,corrected:0,unknown:0,intervalSeconds:60};
  function snapshot(){tick();return {kind:'snapshot',revision,verification:{...verification},eventsCount:world.events,providers:{...counts},agents:[...world.agents.values()].map(a=>({...a,pending:[...a.pending],sinceAgo:world.time-a.since,lastAgo:world.time-a.last,since:undefined,last:undefined})),connection:'open'};}
  const encode=data=>`data: ${JSON.stringify(data)}\n\n`;
  function broadcast(data){for(const c of clients){if(c.writableLength>256*1024){c.end();clients.delete(c);}else c.write(encode(data));}}
  async function reconcile(reset=false){
    if(checking){if(!reset)return checking;await checking;}
    checking=(async()=>{
      tick();const before=[...world.agents.values()],observed=new Map(before.map(a=>[a.id,a.observedAt]));
      let results=[];try{results=await statusReader?.(before)||[];}catch{}
      const statuses=new Map(results.map(r=>[r.id,r]));let corrected=0;
      tick();
      if(reset){
        // Events that arrive during verification always win over an older disk status.
        const keep=[...world.agents.values()].filter(a=>a.observedAt!==observed.get(a.id)||statuses.get(a.id)?.status==='inProgress');
        const time=world.time,seen=world.seen;world.reset('live');world.time=time;world.seen=seen;counts={codex:0,claude:0};revision++;
        for(const a of keep){world.agents.set(a.id,a);if(a.observedAt===observed.get(a.id)){a.pending.clear();a.retired=false;a.resting=false;world.setAction(a,'think');}}
        corrected=before.length-keep.length;
      }else for(const a of before){
        const status=statuses.get(a.id);
        if(a.observedAt!==observed.get(a.id))continue;
        if(status&&['completed','interrupted','failed'].includes(status.status)&&status.completedAt>=(a.observedAt||Infinity)-(['rollout','claude-log'].includes(status.source)?0:2000)&&!a.resting&&!a.retired){
          a.pending.clear();a.resting=true;world.setAction(a,'pause','idle');corrected++;
        }
      }
      Object.assign(verification,{lastCheckAt:Date.now(),checked:results.length,corrected,unknown:before.filter(a=>!statuses.has(a.id)).length});
      broadcast(snapshot());return {...verification,population:world.population()};
    })().finally(()=>{checking=null;});
    return checking;
  }
  const server=http.createServer(async(req,res)=>{
    const address=server.address();const allowedHosts=[`127.0.0.1:${address.port}`,`localhost:${address.port}`];
    if(!allowedHosts.includes(req.headers.host)){res.writeHead(403);res.end();return;}
    const origin=req.headers.origin;
    if(origin&&!['null',...allowedHosts.map(h=>`http://${h}`)].includes(origin)){res.writeHead(403);res.end();return;}
    if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
    res.setHeader('X-Content-Type-Options','nosniff');
    let url;try{url=new URL(req.url,`http://${req.headers.host}`);}catch{res.writeHead(400);res.end();return;}
    if(req.method==='GET'&&url.pathname==='/health'){
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,service:'agent-transit',version:'1.0.0',events:world.events,providers:counts,population:world.population(),verification,audio:audioHub?.status()||{status:'disabled'},clients:clients.size}));return;
    }
    if(req.method==='GET'&&url.pathname==='/audio/stream'){
      if(audioHub)audioHub.add(req,res);else{res.writeHead(503);res.end();}return;
    }
    if(req.method==='POST'&&url.pathname==='/agents/reset'){
      // Only the local studio can mutate visual state; ordinary cross-site forms cannot.
      if(origin==='null'||req.headers['x-transit-action']!=='reset'){res.writeHead(403);res.end();return;}
      if(checking){res.writeHead(409);res.end();return;}
      const result=await reconcile(true);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));return;
    }
    if(req.method==='GET'&&url.pathname==='/stream'){
      if(clients.size>=20){res.writeHead(503);res.end();return;}
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'});res.write('retry: 2500\n\n');res.write(encode(snapshot()));clients.add(res);req.on('close',()=>clients.delete(res));return;
    }
    if(req.method==='POST'&&url.pathname==='/ingest'){
      const supplied=String(req.headers['x-transit-token']||'');
      if(supplied.length!==token.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(token))){res.writeHead(401);res.end();return;}
      if(!String(req.headers['content-type']||'').startsWith('application/json')){res.writeHead(415);res.end();return;}
      const now=Date.now();recent=recent.filter(t=>now-t<1000);if(recent.length>=150){res.writeHead(429);res.end();return;}recent.push(now);
      let body='',size=0;try{for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return;}body+=chunk;}}catch{return;}
      let e;try{e=validateEvent(JSON.parse(body));}catch{}
      if(!e){res.writeHead(400);res.end();return;}
      if(lineageResolver)try{e=await lineageResolver.enrich(e);}catch{/* Metadata failure never interrupts live events. */}
      if(!world.seen.has(e.id)){tick();world.apply(e);const a=world.agents.get(e.provider+':'+(e.agentId||e.sessionId));if(a)a.observedAt=Date.now();counts[e.provider]++;broadcast({kind:'event',event:e});}
      res.writeHead(204);res.end();return;
    }
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    try{
      let pathname=decodeURIComponent(url.pathname);if(pathname==='/')pathname='/index.html';
      const candidate=path.resolve(publicRoot,'.'+pathname);const relative=path.relative(publicRoot,candidate);
      if(relative.startsWith('..')||path.isAbsolute(relative)||pathname.includes('\\')){res.writeHead(403);res.end();return;}
      const resolved=await realpath(candidate);const rel=path.relative(publicRoot,resolved);if(rel.startsWith('..')||path.isAbsolute(rel)){res.writeHead(403);res.end();return;}
      const extension=path.extname(resolved);if(!mime[extension]){res.writeHead(404);res.end();return;}
      const content=await readFile(resolved);res.writeHead(200,{'Content-Type':mime[extension],'Cache-Control':'no-cache','Content-Length':content.length});res.end(req.method==='HEAD'?undefined:content);
    }catch{res.writeHead(404);res.end('Introuvable');}
  });
  server.requestTimeout=5000;server.headersTimeout=5000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  const actualPort=server.address().port;
  if(writeConfig){await mkdir(path.join(root,'.local'),{recursive:true});await writeFile(path.join(root,'.local/connection.json'),JSON.stringify({port:actualPort,token}),{mode:0o600});}
  const heartbeat=setInterval(()=>{tick();for(const c of clients)c.write(': heartbeat\n\n');},15000);heartbeat.unref();
  const verificationTimer=statusReader?setInterval(()=>{if(world.agents.size)void reconcile();},Math.max(1000,reconcileInterval)):null;verificationTimer?.unref();
  return {server,port:actualPort,token,world,snapshot,reconcile,async close(){clearInterval(heartbeat);clearInterval(verificationTimer);audioHub?.close();for(const c of clients)c.end();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const resume=process.argv.indexOf('--resume'),initialSnapshot=resume>=0?JSON.parse(await readFile(process.argv[resume+1],'utf8')):null;
    const lineageResolver=createLineageResolver(),venv=path.join(root,'.local/audio-venv');
    const venvConfig=await readFile(path.join(venv,'pyvenv.cfg'),'utf8').catch(()=>'');
    // Start the base interpreter directly: the Windows venv launcher can orphan a child on kill.
    const python=process.env.TRANSIT_PYTHON||venvConfig.match(/^executable\s*=\s*(.+)$/m)?.[1].trim()||path.join(venv,'Scripts/python.exe');
    const audioHub=createAudioHub({python,pythonPath:path.join(venv,'Lib/site-packages')});
    const bridge=await createBridge({port:Number(process.env.TRANSIT_PORT)||49157,lineageResolver,initialSnapshot,statusReader:createStatusReader({python,lineageResolver}),audioHub});
    await bridge.reconcile();
    process.on('exit',()=>audioHub.close());
    console.log(`Agent Transit prêt : http://127.0.0.1:${bridge.port}`);console.log('Pont local actif. Ctrl+C pour arrêter. Aucun appel à une API de modèle.');
    for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await bridge.close();process.exit(0);});
  }
  catch(error){console.error(error.code==='EADDRINUSE'?'Le port est occupé. Un pont est peut-être déjà lancé.':`Démarrage impossible : ${error.code||error.message}`);process.exitCode=1;}
}
