// Read only known Claude subagents. Keep paths/status metadata in caches, never conversation text.
import {readdir,open,stat} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
const opaque=value=>createHash('sha256').update(value).digest('hex').slice(0,20);
const interruptions=new Set(['[Request interrupted by user]','[Request interrupted by user for tool use]']);

export function createClaudeStatusReader({claudeHome=path.join(os.homedir(),'.claude')}={}){
  const parents=new Map(),cache=new Map();let nextScan=0;
  async function locate(wanted){
    if(Date.now()<nextScan)return;nextScan=Date.now()+60000;
    const root=path.join(claudeHome,'projects');let projects;
    try{projects=await readdir(root,{withFileTypes:true});}catch{return;}
    let budget=30000;
    for(const project of projects.slice(0,2000)){
      if(!project.isDirectory()||project.isSymbolicLink())continue;
      let entries;try{entries=await readdir(path.join(root,project.name),{withFileTypes:true});}catch{continue;}
      for(const entry of entries){
        if(--budget<0)return;
        if(!entry.isDirectory()||entry.isSymbolicLink()||!/^[a-f0-9-]{36}$/i.test(entry.name))continue;
        const id='claude:'+opaque(entry.name);
        if(wanted.has(id))parents.set(id,{sessionId:entry.name,folder:path.join(root,project.name,entry.name,'subagents')});
      }
    }
  }
  async function read(file,agentId,sessionId){
    let handle;
    try{
      const info=await stat(file),stamp=info.size+':'+info.mtimeMs,old=cache.get(file);
      if(old?.stamp===stamp)return old.status;
      handle=await open(file,'r');const offset=Math.max(0,info.size-256*1024),buffer=Buffer.alloc(info.size-offset);
      const {bytesRead}=await handle.read(buffer,0,buffer.length,offset),lines=buffer.subarray(0,bytesRead).toString('utf8').split('\n');
      if(offset)lines.shift();lines.pop();let status=null;
      for(let i=lines.length-1;i>=0;i--){
        let e;try{e=JSON.parse(lines[i]);}catch{continue;}
        if(e.agentId!==agentId||e.sessionId!==sessionId||e.isSidechain!==true)continue;
        const time=Date.parse(e.timestamp);if(!Number.isFinite(time)||time>Date.now()+5000)continue;
        const m=e.message;if(!m||!['assistant','user'].includes(e.type))continue;
        let state='inProgress';
        if(e.type==='assistant'&&m.role==='assistant'&&['end_turn','stop_sequence'].includes(m.stop_reason))state='completed';
        if(e.type==='user'&&m.role==='user'&&e.userType==='external'&&Array.isArray(m.content)&&m.content.length===1&&m.content[0].type==='text'&&interruptions.has(m.content[0].text))state='interrupted';
        status={status:state,startedAt:state==='inProgress'?time:0,completedAt:state==='inProgress'?0:time,source:'claude-log'};break;
      }
      cache.set(file,{stamp,status});if(cache.size>128)cache.delete(cache.keys().next().value);
      return status;
    }catch{return null;}finally{await handle?.close();}
  }
  return async agents=>{
    const known=agents.filter(a=>a.provider==='claude'&&a.parent?.startsWith('claude:')).slice(0,64);
    if(!known.length)return [];
    await locate(new Set(known.map(a=>a.parent)));const results=[];
    const grouped=new Map();for(const a of known){if(!grouped.has(a.parent))grouped.set(a.parent,[]);grouped.get(a.parent).push(a);}
    for(const [parent,children] of grouped){
      const entry=parents.get(parent);if(!entry)continue;
      let files;try{files=await readdir(entry.folder,{withFileTypes:true});}catch{continue;}
      const wanted=new Set(children.map(a=>a.id));
      for(const file of files.slice(0,4096)){
        if(!file.isFile()||file.isSymbolicLink())continue;
        const rawId=file.name.match(/^agent-([a-zA-Z0-9_-]+)\.jsonl$/)?.[1];if(!rawId)continue;
        const id='claude:'+opaque(rawId);if(!wanted.has(id))continue;
        const status=await read(path.join(entry.folder,file.name),rawId,entry.sessionId);if(status)results.push({...status,id});
      }
    }
    return results;
  };
}
