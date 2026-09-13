// Bounded, read-only status envelopes; conversation text never leaves this reader.
import {open,stat} from 'node:fs/promises';

export function createRolloutStatusReader(){
  const cache=new Map();
  return async function readStatus(file){
    let handle;
    try{
      const info=await stat(file),stamp=info.size+':'+info.mtimeMs,old=cache.get(file);
      if(old?.stamp===stamp)return old.status;
      handle=await open(file,'r');const offset=Math.max(0,info.size-256*1024),buffer=Buffer.alloc(info.size-offset);
      const {bytesRead}=await handle.read(buffer,0,buffer.length,offset),lines=buffer.subarray(0,bytesRead).toString('utf8').split('\n');
      if(offset)lines.shift();lines.pop(); // ignore truncated first / unfinished last lines
      let status=null;
      for(let i=lines.length-1;i>=0;i--){
        let entry;try{entry=JSON.parse(lines[i]);}catch{continue;}
        if(entry.type!=='event_msg')continue;
        const type=entry.payload?.type,time=Date.parse(entry.timestamp);
        if(!Number.isFinite(time)||time>Date.now()+5000)continue;
        if(type==='task_complete'||type==='turn_aborted'){
          status={status:type==='task_complete'?'completed':'interrupted',startedAt:0,completedAt:time,source:'rollout'};break;
        }
        if(type==='task_started'){
          status={status:'inProgress',startedAt:time,completedAt:0,source:'rollout'};break;
        }
      }
      cache.set(file,{stamp,status});if(cache.size>128)cache.delete(cache.keys().next().value);
      return status;
    }catch{return null;}finally{await handle?.close();}
  };
}

export function latestStatus(database,rollout){
  if(!rollout)return database;
  if(!database)return rollout;
  const diskTime=Math.max(database.startedAt||0,database.completedAt||0),logTime=Math.max(rollout.startedAt||0,rollout.completedAt||0);
  return logTime>=diskTime?rollout:database;
}
