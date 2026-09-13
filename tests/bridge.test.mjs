import test from 'node:test';
import assert from 'node:assert/strict';
import { createBridge } from '../bridge/server.mjs';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
test('Pont isolé : authentification, nettoyage, déduplication, snapshot et protection des fichiers',async()=>{
  const b=await createBridge({port:0,writeConfig:false});const base=`http://127.0.0.1:${b.port}`;
  try{
    assert.equal((await fetch(base+'/health')).status,200);
    const event={id:'fixture-1',provider:'codex',sessionId:'fixture-parent',type:'prompt',label:'Fictif',privateContent:'secret-fixture'};
    assert.equal((await fetch(base+'/ingest',{method:'POST',body:JSON.stringify(event)})).status,401);
    const send=()=>fetch(base+'/ingest',{method:'POST',headers:{'content-type':'application/json','x-transit-token':b.token},body:JSON.stringify(event)});
    assert.equal((await send()).status,204);assert.equal((await send()).status,204);assert.equal(b.world.events,1);
    const health=await (await fetch(base+'/health')).text();assert.equal(health.includes(b.token),false);assert.equal(health.includes('secret-fixture'),false);
    const stream=await fetch(base+'/stream');const reader=stream.body.getReader();const text=new TextDecoder().decode((await reader.read()).value);assert.ok(text.includes('snapshot'));assert.ok(text.includes('Fictif'));assert.equal(text.includes('privateContent'),false);await reader.cancel();
    assert.equal((await fetch(base+'/health',{headers:{Origin:'https://example.com'}})).status,403);
    assert.notEqual((await fetch(base+'/.local/connection.json')).status,200);assert.notEqual((await fetch(base+'/..%2f.local%2fconnection.json')).status,200);
  }finally{await b.close();}
});
test('Vrai processus de hook → pont isolé, pour les deux familles ; sortie toujours neutre',async()=>{
  const b=await createBridge({port:0,writeConfig:false}),temp=await mkdtemp(path.join(os.tmpdir(),'transit-hook-')),config=path.join(temp,'connection.json');await writeFile(config,JSON.stringify({port:b.port,token:b.token}));
  const run=(provider,body)=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,[fileURLToPath(new URL('../bridge/hook.mjs',import.meta.url)),provider],{env:{...process.env,TRANSIT_CONNECTION_FILE:config},windowsHide:true});let out='',err='';child.stdout.on('data',v=>out+=v);child.stderr.on('data',v=>err+=v);child.on('error',reject);child.on('exit',code=>resolve({code,out,err}));child.stdin.end(body);});
  try{for(const provider of ['codex','claude']){const result=await run(provider,JSON.stringify({session_id:`fixture-${provider}`,hook_event_name:'SubagentStart',agent_id:'fake-child',agent_type:'Explore',prompt:'NO-CONTENT'}));assert.deepEqual(result,{code:0,out:'{}\n',err:''});}assert.equal(b.world.events,2);assert.equal(b.world.agents.size,4);assert.equal(JSON.stringify(b.snapshot()).includes('NO-CONTENT'),false);assert.equal((await run('codex','not-json')).out,'{}\n');}finally{await b.close();}
  const offline=await run('codex',JSON.stringify({session_id:'offline-fixture',hook_event_name:'Stop'}));assert.deepEqual(offline,{code:0,out:'{}\n',err:''});
});
