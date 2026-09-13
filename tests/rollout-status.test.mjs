import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,appendFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';
import {createRolloutStatusReader,latestStatus} from '../bridge/rollout-status.mjs';

test('Une fin explicite plus récente corrige la base périmée ; une reprise reprend la priorité',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'transit-status-'));
  try{
    const file=path.join(dir,'fixture.jsonl'),read=createRolloutStatusReader(),now=Date.now()-10000;
    const event=(type,at)=>JSON.stringify({type:'event_msg',timestamp:new Date(at).toISOString(),payload:{type,turn_id:'fixture',last_agent_message:'PRIVATE-FIXTURE'}})+'\n';
    await writeFile(file,JSON.stringify({type:'response_item',payload:{content:'task_complete PRIVATE-FIXTURE '+'.'.repeat(300000)}})+'\n'+event('task_complete',now));
    const terminal=await read(file);assert.equal(terminal.status,'completed');assert.equal(terminal.completedAt,now);assert.equal(JSON.stringify(terminal).includes('PRIVATE'),false);
    assert.deepEqual(await read(file),terminal);
    assert.equal(latestStatus({status:'inProgress',startedAt:now-3600000},terminal).status,'completed');
    assert.equal(latestStatus({status:'inProgress',startedAt:now+1000},terminal).status,'inProgress');
    await appendFile(file,event('task_started',now+2000));assert.equal((await read(file)).status,'inProgress');
    await appendFile(file,event('turn_aborted',now+3000));assert.equal((await read(file)).status,'interrupted');
    await writeFile(file,JSON.stringify({type:'response_item',payload:{content:'task_complete'}})+'\n');assert.equal(await read(file),null);
    assert.equal((latestStatus({status:'inProgress'},await read(file))).status,'inProgress');
  }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep+'transit-status-'));await rm(dir,{recursive:true,force:true});}
});
