// Read only the metadata header of matching local Codex sessions, never their messages.
import {open,readdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';

const opaque=id=>createHash('sha256').update(id).digest('hex').slice(0,20);
const safeLabel=value=>String(value||'').replace(/[\x00-\x1f\x7f<>]/g,'').slice(0,30);
const uuid=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
export async function readLineageHeader(file,expectedId){
  let handle;
  try{
    handle=await open(file,'r');const chunks=[];
    for(let offset=0;offset<256*1024;offset+=4096){
      const buffer=Buffer.alloc(4096),{bytesRead}=await handle.read(buffer,0,buffer.length,offset);
      if(!bytesRead)return null;
      const newline=buffer.indexOf(10,0);
      chunks.push(buffer.subarray(0,newline>=0?newline:bytesRead));if(newline<0)continue;
      const entry=JSON.parse(Buffer.concat(chunks).toString('utf8')),meta=entry.payload;
      if(entry.type!=='session_meta'||meta?.id!==expectedId)return null;
      const spawn=(meta.source?.subagent||meta.source?.subAgent)?.thread_spawn;
      const parent=meta.parent_thread_id||spawn?.parent_thread_id;
      if(typeof parent!=='string'||!new RegExp('^'+uuid.source+'$','i').test(parent)||parent===expectedId)return null;
      return {parentId:opaque(parent),label:safeLabel(meta.agent_nickname||spawn?.agent_nickname||'Sous-agent')};
    }
  }catch{return null;}finally{await handle?.close();}
  return null;
}

export function createLineageResolver({codexHome=process.env.CODEX_HOME||path.join(os.homedir(),'.codex')}={}){
  const roots=['sessions','archived_sessions'].map(name=>path.resolve(codexHome,name));
  let files=new Map(),expires=0,refreshing=null;const cache=new Map();
  async function refresh(){
    if(refreshing)return refreshing;if(Date.now()<expires)return;
    refreshing=(async()=>{
      const found=new Map();
      async function visit(dir,depth=0){
        if(depth>5)return;
        let entries;try{entries=await readdir(dir,{withFileTypes:true});}catch{return;}
        for(const entry of entries){
          const file=path.join(dir,entry.name);
          if(entry.isDirectory())await visit(file,depth+1);
          else if(entry.isFile()&&entry.name.endsWith('.jsonl')){
            const id=entry.name.match(new RegExp('('+uuid.source+')\\.jsonl$','i'))?.[1];
            if(id)found.set(opaque(id),{file,id});
          }
        }
      }
      for(const dir of roots)await visit(dir);
      files=found;expires=Date.now()+15000;
    })().finally(()=>{refreshing=null;});
    return refreshing;
  }
  async function lookup(id){
    if(!files.has(id))await refresh();const entry=files.get(id);if(!entry)return null;
    const resolved=await realpath(entry.file).catch(()=>null);
    if(!resolved||!roots.some(root=>{const rel=path.relative(root,resolved);return rel&&!rel.startsWith('..')&&!path.isAbsolute(rel);}))return null;
    return {...entry,file:resolved};
  }
  return {lookup,async enrich(event){
    if(event.provider!=='codex')return event;
    const id=event.agentId||event.sessionId;let cached=cache.get(id);
    if(!cached||Date.now()>cached.until){
      const entry=await lookup(id);if(!entry)return event;
      cached={lineage:await readLineageHeader(entry.file,entry.id),until:Date.now()+60000};
      cache.set(id,cached);if(cache.size>256)cache.delete(cache.keys().next().value);
    }
    return cached.lineage?{...event,...cached.lineage}:event;
  }};
}
