import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,appendFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {createClaudeStatusReader} from '../bridge/claude-status.mjs';import {createStatusReader} from '../bridge/reconcile.mjs';import {createBridge} from '../bridge/server.mjs';
const hash=id=>createHash('sha256').update(id).digest('hex').slice(0,20),sessionId='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',agentId='test-child';
async function fixture(t){
  const home=await mkdtemp(path.join(os.tmpdir(),'transit-claude-'));t.after(()=>rm(home,{recursive:true,force:true}));
  const folder=path.join(home,'projects','test-project',sessionId,'subagents');await mkdir(folder,{recursive:true});
  const file=path.join(folder,'agent-'+agentId+'.jsonl'),id='claude:'+hash(agentId),parent='claude:'+hash(sessionId);
  const row=(type,time,extra={})=>JSON.stringify({type,timestamp:new Date(time).toISOString(),isSidechain:true,agentId,sessionId,userType:'external',message:{role:type,content:[{type:'text',text:'[Request interrupted by user]'}]},...extra})+'\n';
  return{home,file,id,parent,row,agent:{id,parent,provider:'claude'}};
}
test('Claude : interruption explicite, cache invalidé, reprise et fin ; aucun dialogue retourné',async t=>{
  const f=await fixture(t),now=Date.now()-10000,read=createClaudeStatusReader({claudeHome:f.home});
  await writeFile(f.file,f.row('user',now));let result=await read([f.agent]);assert.equal(result[0].status,'interrupted');assert.equal(result[0].completedAt,now);assert.ok(!JSON.stringify(result).includes('Request interrupted'));
  assert.deepEqual(await read([f.agent]),result);
  await appendFile(f.file,f.row('user',now+1000,{message:{role:'user',content:[{type:'text',text:'Resume work'}]}}));assert.equal((await read([f.agent]))[0].status,'inProgress');
  await appendFile(f.file,f.row('assistant',now+2000,{message:{role:'assistant',stop_reason:'end_turn',content:[{type:'text',text:'Private result'}]}}));result=await read([f.agent]);assert.equal(result[0].status,'completed');assert.ok(!JSON.stringify(result).includes('Private result'));
  await appendFile(f.file,f.row('assistant',now+3000,{message:{role:'assistant',stop_reason:'tool_use',content:[]}}));assert.equal((await read([f.agent]))[0].status,'inProgress');
});
test('Claude : aucun arrêt déduit d’un silence, d’une citation du marqueur ou d’un autre identifiant',async t=>{
  const f=await fixture(t),read=createClaudeStatusReader({claudeHome:f.home}),now=Date.now()-900000;
  await writeFile(f.file,f.row('user',now,{message:{role:'user',content:[{type:'text',text:'Explain [Request interrupted by user]'}]}}));assert.equal((await read([f.agent]))[0].status,'inProgress');
  await appendFile(f.file,f.row('user',now+1000,{agentId:'another-agent'}));assert.equal((await read([f.agent]))[0].status,'inProgress');
  await appendFile(f.file,'{"type":"user"');assert.equal((await read([f.agent]))[0].status,'inProgress');
  assert.deepEqual(await read([{...f.agent,id:'claude:unknown'}]),[]);
});
test('Le contrôle réel fait rentrer le mini-bot interrompu, sans arrêter son parent ou une reprise récente',async t=>{
  const f=await fixture(t),interruptedAt=Date.now()-5000;
  await writeFile(f.file,f.row('user',interruptedAt));
  const statusReader=createStatusReader({claudeHome:f.home,lineageResolver:{lookup:async()=>null}});
  const bridge=await createBridge({port:0,writeConfig:false,statusReader,reconcileInterval:3600000});t.after(()=>bridge.close());
  bridge.world.apply({provider:'claude',sessionId:hash(sessionId),agentId:hash(agentId),type:'subagent_start'});
  const child=bridge.world.agents.get(f.id),parent=bridge.world.agents.get(f.parent);child.observedAt=interruptedAt-1000;parent.observedAt=child.observedAt;
  await bridge.reconcile();assert.equal(child.resting,true);assert.equal(child.action,'pause');assert.notEqual(parent.resting,true);
  bridge.world.apply({provider:'claude',sessionId:hash(sessionId),agentId:hash(agentId),type:'subagent_start'});child.observedAt=interruptedAt+1000;
  await bridge.reconcile();assert.equal(child.resting,false,'a new start must beat the older cancellation');
});
