import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRolloutStatusReader,latestStatus} from './rollout-status.mjs';
import {createClaudeStatusReader} from './claude-status.mjs';

export function createStatusReader({python,lineageResolver,claudeHome}){
  const readRollout=createRolloutStatusReader(),readClaude=createClaudeStatusReader({claudeHome});
  return async agents=>{
    const claude=await readClaude(agents);
    const identities=[];
    for(const a of agents.filter(a=>a.provider==='codex').slice(0,64)){
      const entry=await lineageResolver.lookup(a.id.slice(6));
      if(entry)identities.push({id:a.id,threadId:entry.id,file:entry.file});
    }
    if(!identities.length)return claude;
    const rows=await new Promise(resolve=>{
      const child=spawn(python,['-I',fileURLToPath(new URL('./session-status.py',import.meta.url))],{windowsHide:true,stdio:['pipe','pipe','ignore']});
      let output='',settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};
      const timer=setTimeout(()=>{child.kill();finish([]);},2500);
      child.on('error',()=>finish([]));child.stdin.on('error',()=>{});
      child.stdout.on('data',chunk=>{output+=chunk;if(output.length>32768){child.kill();finish([]);}});
      child.on('exit',()=>{try{const rows=JSON.parse(output);finish(Array.isArray(rows)?rows:[]);}catch{finish([]);}});
      child.stdin.end(JSON.stringify(identities.map(({id,threadId})=>({id,threadId}))));
    });
    const byId=new Map(rows.map(r=>[r.id,r])),result=[];
    for(const entry of identities){const status=latestStatus(byId.get(entry.id),await readRollout(entry.file));if(status)result.push({...status,id:entry.id});}
    return [...result,...claude];
  };
}
