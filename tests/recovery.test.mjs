import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {createLineageResolver,readLineageHeader} from '../bridge/lineage.mjs';
import {createBridge} from '../bridge/server.mjs';
import '../public/life.js';
const hash=id=>createHash('sha256').update(id).digest('hex').slice(0,20);

test('Un hook tardif retrouve le parent dans le seul en-tête sans changer de robot',async()=>{
  const home=await mkdtemp(path.join(os.tmpdir(),'transit-lineage-'));
  const child='00000000-0000-4000-8000-000000000001',parent='00000000-0000-4000-8000-000000000002';
  try{
    await mkdir(path.join(home,'sessions'));const file=path.join(home,'sessions',child+'.jsonl');
    await writeFile(file,JSON.stringify({type:'session_meta',payload:{id:child,parent_thread_id:parent,agent_nickname:'Écho'}})+'\nPRIVATE MESSAGE NOT JSON');
    assert.equal(await readLineageHeader(file,parent),null);
    const resolver=createLineageResolver({codexHome:home}),event=await resolver.enrich({provider:'codex',sessionId:hash(child),type:'tool_start',toolId:'a'});
    assert.equal(event.parentId,hash(parent));assert.equal(event.label,'Écho');
    const world=new TransitWorld.World();world.mode='live';world.apply({...event,parentId:undefined});const identity=world.visible()[0];world.apply(event);
    assert.equal(world.agents.size,1);assert.equal(world.visible()[0],identity);assert.equal(identity.parent,'codex:'+hash(parent));
    assert.deepEqual(world.population(),{conversations:0,subagents:1,resting:0});
  }finally{await rm(home,{recursive:true,force:true});}
});

test('Premier sous-agent : arrivée ; reprise : réveil du même agent',()=>{
  for(const provider of ['codex','claude']){
    const world=new TransitWorld.World();world.mode='live';
    const event={provider,sessionId:'parent',agentId:'child',type:'subagent_start'};
    world.apply(event);assert.equal(world.agents.get(provider+':child').action,'arrive');assert.equal(world.packets.length,1);
    world.apply(event);assert.equal(world.agents.get(provider+':child').action,'wake');assert.equal(world.agents.size,2);assert.equal(world.packets.length,1);
  }
});

test('Contrôle et reset : fins prouvées, calcul silencieux conservé, hooks concurrents prioritaires',async()=>{
  let release;let rows=[];
  const b=await createBridge({port:0,writeConfig:false,statusReader:async()=>rows});
  const base='http://127.0.0.1:'+b.port;
  const send=async(sessionId,provider='codex')=>{const r=await fetch(base+'/ingest',{method:'POST',headers:{'Content-Type':'application/json','X-Transit-Token':b.token},body:JSON.stringify({id:sessionId+String(Math.random()).slice(2),provider,sessionId,type:'tool_start',toolId:'long',action:'test'})});assert.equal(r.status,204);return r;};
  try{
    await send('finished');await send('working');await send('old-completion');await send('unknown','claude');
    rows=[{id:'codex:finished',status:'completed',completedAt:Date.now()+1000},{id:'codex:working',status:'inProgress'},{id:'codex:old-completion',status:'completed',completedAt:Date.now()-60000}];
    await b.reconcile();
    assert.equal(b.world.agents.get('codex:finished').resting,true);
    assert.equal(b.world.agents.get('codex:working').pending.size,1);
    assert.equal(b.world.agents.get('codex:old-completion').pending.size,1);
    assert.equal(b.world.agents.get('claude:unknown').pending.size,1);
    assert.equal((await fetch(base+'/agents/reset',{method:'POST'})).status,403);
    assert.equal((await fetch(base+'/agents/reset',{method:'POST',headers:{Origin:'https://example.com','X-Transit-Action':'reset'}})).status,403);
    const response=await fetch(base+'/agents/reset',{method:'POST',headers:{'X-Transit-Action':'reset'}});
    assert.equal(response.status,200);assert.deepEqual([...b.world.agents.keys()],['codex:working']);assert.equal(b.snapshot().revision,1);
    await send('unknown','claude');assert.ok(b.world.agents.has('claude:unknown'));
  }finally{await b.close();}
  const concurrent=await createBridge({port:0,writeConfig:false,statusReader:()=>new Promise(resolve=>release=resolve)});
  try{
    concurrent.world.apply({provider:'codex',sessionId:'race',type:'prompt'});const a=concurrent.world.visible()[0];a.observedAt=1;
    const reset=concurrent.reconcile(true);a.observedAt=2;release([{id:a.id,status:'completed',completedAt:1}]);await reset;
    assert.equal(concurrent.world.agents.get(a.id),a);
  }finally{await concurrent.close();}
});

test('Clic en bas : losange au pointeur et destination dans le bas de l’écran',()=>{
  const world=new TransitWorld.World();world.mode='live';world.connection='open';world.idleDelay=Infinity;
  world.apply({provider:'codex',sessionId:'click',type:'idle'});
  const life=new TransitLife.Life(42);life.resize(1080,1920);
  for(let i=0;i<500;i++){world.update(.1);life.update(.1,world,{roam:false,social:true});}
  life.invite(700,1780,null,world);
  assert.equal(life.ripples.at(-1).y,1780);
  assert.ok(life.actors.values().next().value.target.y>1700);
  assert.ok(life.bounds.bottom>1800);
});
