import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';

export const HOOKS = {
  codex: ['SessionStart','SessionEnd','UserPromptSubmit','PreToolUse','PostToolUse','PermissionRequest','SubagentStart','SubagentStop','Stop','Interrupt','PreCompact','PostCompact'],
  claude: ['SessionStart','SessionEnd','UserPromptSubmit','PreToolUse','PostToolUse','PostToolUseFailure','PermissionRequest','Notification','SubagentStart','SubagentStop','Stop','StopFailure','PreCompact','PostCompact','TeammateIdle','TaskCompleted']
};
const opaque = value => createHash('sha256').update(String(value)).digest('hex').slice(0,20);
const safeLabel = value => String(value||'').replace(/[\x00-\x1f\x7f<>]/g,'').slice(0,30);
export function classifyTool(name, input={}) {
  const n=String(name||'').toLowerCase().replace(/^functions\./,'');
  if(/(?:^|[_.])(?:send_?message|send_message_to_thread|followup_task|queue_message)(?:$|_)/.test(n))return 'send';
  if(/(?:^|[_.])(?:request_user_input|request_user_input_async|askuserquestion)$/.test(n))return 'wait';
  if(['spawn_agent','agent','task'].includes(n))return 'spawn';
  if(/(?:^|[_.])(?:apply_patch|edit|write|write_file|edit_file)(?:$|_)/.test(n))return 'type';
  if(/(?:^|[_.])(?:grep|glob|search|find)(?:$|_)/.test(n))return 'search';
  if(/(?:^|[_.])(?:read|fetch|get_resource)(?:$|_)/.test(n))return 'read';
  if(['bash','exec_command','shell','shell_command'].includes(n)){
    // Inspect commands locally to select a gesture; never put the command in an event.
    const command=String(input?.command||input?.cmd||'').trim();
    // Conservative: a recognizable executable at the start, never arbitrary words in strings.
    if(/^(?:(?:npm|pnpm|yarn|bun)(?:\.cmd)?\s+(?:run\s+)?(?:test(?::[\w-]+)?|lint|typecheck)|(?:python(?:3)?\s+-m\s+)?pytest|vitest|jest|ctest|tsc|node\s+--test)(?:\s|$)/i.test(command))return 'test';
    if(/^(?:rg|grep|findstr)(?:\s|$)/i.test(command))return 'search';
    if(/^(?:Get-Content|cat|head|tail|type)(?:\s|$)/i.test(command))return 'read';
    return 'tool';
  }
  return 'tool';
}
export function hasError(response) {
  if(response&&typeof response==='object')return response.is_error===true||response.isError===true||(response.error!=null&&response.error!==false&&response.error!=='')||(typeof response.exit_code==='number'&&response.exit_code!==0)||(typeof response.exitCode==='number'&&response.exitCode!==0);
  if(typeof response==='string'){
    try{return hasError(JSON.parse(response));}catch{}
    const m=response.match(/^(?:Exit code|Process exited with code):?\s*(-?\d+)\s*$/mi);return !!m&&Number(m[1])!==0;
  }
  return false;
}
export function hasSuccess(response){
  if(hasError(response))return false;
  if(typeof response==='string'){try{return hasSuccess(JSON.parse(response));}catch{return /^(?:Exit code|Process exited with code):?\s*0\s*$/mi.test(response);}}
  return !!response&&typeof response==='object'&&(response.success===true||response.ok===true||response.delivered===true||response.isError===false||response.is_error===false||response.exit_code===0||response.exitCode===0);
}
export function normalizeHook(provider, raw, now=Date.now()) {
  if(!HOOKS[provider]||!raw||typeof raw!=='object'||typeof raw.session_id!=='string'||!raw.session_id)return null;
  const hook=raw.hook_event_name;
  if(!HOOKS[provider].includes(hook))return null;
  const types={SessionStart:'session_start',SessionEnd:'session_end',UserPromptSubmit:'prompt',PreToolUse:'tool_start',PostToolUse:'tool_end',PostToolUseFailure:'tool_end',PermissionRequest:'wait',SubagentStart:'subagent_start',SubagentStop:'subagent_stop',Stop:'stop',StopFailure:'error',Interrupt:'interrupt',PreCompact:'compact_start',PostCompact:'compact_end',TeammateIdle:'stop',TaskCompleted:'receive'};
  let type=types[hook];
  if(hook==='Notification'){
    if(['permission_prompt','elicitation_dialog','elicitation_url_dialog','agent_needs_input'].includes(raw.notification_type))type='wait';else if(raw.notification_type==='idle_prompt')type='idle';else return null;
  }
  if(hook==='TaskCompleted')return null; // A task list update does not mean the entire agent has finished.
  if(hook==='TeammateIdle'){if(!raw.agent_id)return null;type='idle';}
  if(['SubagentStart','SubagentStop'].includes(hook)&&!raw.agent_id)return null;
  const label=raw.agent_id?safeLabel(raw.agent_type||'Assistant'):safeLabel(path.win32.basename(String(raw.cwd||'').replace(/\/$/,''))||provider);
  const event={id:randomUUID(),provider,sessionId:opaque(raw.session_id),type,label,timestamp:now};
  if(raw.agent_id)event.agentId=opaque(raw.agent_id);
  if(raw.tool_use_id)event.toolId=opaque(raw.tool_use_id);
  if(type==='tool_start'||type==='tool_end'){
    event.action=classifyTool(raw.tool_name,raw.tool_input);
    if(type==='tool_end'){event.error=hook==='PostToolUseFailure'||hasError(raw.tool_response);event.success=!event.error&&hasSuccess(raw.tool_response);}
    if(event.action==='send'){
      const target=raw.tool_input?.target||raw.tool_input?.recipient||raw.tool_input?.threadId||raw.tool_input?.agent_id;
      if(typeof target==='string')event.target=opaque(target);
    }
  }
  return event;
}
export const EVENT_TYPES=new Set(['session_start','session_end','prompt','tool_start','tool_end','wait','idle','error','stop','interrupt','compact_start','compact_end','subagent_start','subagent_stop','message']);
export function validateEvent(e){
  if(!e||typeof e!=='object'||!['codex','claude'].includes(e.provider)||!EVENT_TYPES.has(e.type))return null;
  const idOk=v=>typeof v==='string'&&/^[\w:-]{1,100}$/.test(v);
  if(!idOk(e.sessionId)||!idOk(e.id))return null;
  if(['subagent_start','subagent_stop'].includes(e.type)&&!idOk(e.agentId))return null;
  const clean={id:e.id,provider:e.provider,sessionId:e.sessionId,type:e.type,label:safeLabel(e.label||e.provider),timestamp:Date.now()};
  for(const name of ['agentId','parentId','toolId','target'])if(idOk(e[name]))clean[name]=e[name];
  if(['read','search','type','tool','test','send','spawn','wait'].includes(e.action))clean.action=e.action;
  if(typeof e.error==='boolean')clean.error=e.error;
  if(typeof e.success==='boolean')clean.success=e.success;
  return clean;
}
