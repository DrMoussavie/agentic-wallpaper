import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHook,classifyTool,hasError,hasSuccess,validateEvent } from '../bridge/normalize.mjs';
import '../public/animations.js';
import '../public/world.js';
const World=globalThis.TransitWorld.World;
const fixture=(hook,extra={})=>({session_id:'fake-session',hook_event_name:hook,cwd:'C:\\fictif\\atelier',...extra});
const fresh=()=>{const w=new World();w.mode='live';return w;};
test('Les deux familles conservent la relation parent/enfant et une reprise ne clone pas',()=>{
  for(const provider of ['codex','claude']){const w=fresh(),start=normalizeHook(provider,fixture('SubagentStart',{agent_id:'child-1',agent_type:'Explore'}));w.apply(start);const child=w.agents.get(`${provider}:${start.agentId}`);assert.equal(child.parent,`${provider}:${start.sessionId}`);w.apply(normalizeHook(provider,fixture('SubagentStop',{agent_id:'child-1'})));assert.equal(child.action,'celebrate');w.apply(normalizeHook(provider,fixture('SubagentStart',{agent_id:'child-1'})));assert.equal(w.agents.size,2);assert.equal(child.action,'wake');}
});
test('Les mots imprimés et les sous-chaînes ne sont pas des outils reconnus',()=>{
  assert.equal(classifyTool('credit_balance'),'tool');for(const command of ['echo test','echo type','Write-Output "pytest"','echo "rg secret"'])assert.equal(classifyTool('Bash',{command}),'tool');
  for(const command of ['npm test','npm run test:unit','python -m pytest tests','node --test tests'])assert.equal(classifyTool('Bash',{command}),'test');assert.equal(classifyTool('Read'),'read');assert.equal(classifyTool('mcp__fs__read_file'),'read');assert.equal(classifyTool('apply_patch'),'type');assert.equal(classifyTool('Bash',{command:'rg TODO .'}),'search');
});
test('Pas de contenu de conversation, de commande ou de chemin transmis',()=>{
  const e=normalizeHook('codex',fixture('PreToolUse',{prompt:'NE-PAS-TRANSMETTRE',tool_name:'Bash',tool_input:{command:'cat PRIVATE-CONTENT'},transcript_path:'SECRET-PATH'}));const raw=JSON.stringify(e);for(const forbidden of ['NE-PAS','PRIVATE','SECRET','C:\\','fake-session'])assert.equal(raw.includes(forbidden),false);assert.equal(e.label,'atelier');
});
test('Notification de repos distincte du besoin d’aide ; coéquipier inconnu ignoré',()=>{
  assert.equal(normalizeHook('claude',fixture('Notification',{notification_type:'idle_prompt'})).type,'idle');assert.equal(normalizeHook('claude',fixture('Notification',{notification_type:'permission_prompt'})).type,'wait');assert.equal(normalizeHook('claude',fixture('TeammateIdle',{teammate_name:'inconnu'})),null);
});
test('Une tentative de délégation ne crée pas de personnage',()=>{const w=fresh();w.apply({provider:'codex',sessionId:'p',type:'tool_start',action:'spawn',toolId:'t'});assert.equal(w.agents.size,1);assert.equal(w.agents.get('codex:p').action,'tool');});
test('Envoi : pas de capsule avant le succès ; pas de faux destinataire',()=>{
  const w=fresh();w.apply({provider:'codex',sessionId:'r',type:'prompt'});w.apply({provider:'codex',sessionId:'p',type:'tool_start',action:'send',target:'r',toolId:'m'});assert.equal(w.packets.filter(p=>p.kind==='mail').length,0);w.apply({provider:'codex',sessionId:'p',type:'tool_end',action:'send',target:'r',toolId:'m',success:true});assert.equal(w.packets.filter(p=>p.kind==='mail').length,1);w.apply({provider:'codex',sessionId:'p',type:'tool_end',action:'send',target:'inconnu',toolId:'other',success:true});assert.equal(w.packets.filter(p=>p.kind==='mail').length,1);
});
test('Retour opaque ≠ réussite ; échec explicite reconnu',()=>{assert.equal(hasSuccess({output:'fine'}),false);assert.equal(hasSuccess({exit_code:0}),true);assert.equal(hasError({exit_code:2}),true);assert.equal(hasSuccess({success:true,isError:true}),false);assert.equal(hasError('Exit code: 1'),true);assert.equal(hasSuccess('aucune information'),false);});
test('Outils concurrents : un retour ne termine pas le travail restant',()=>{const w=fresh();for(const toolId of ['a','b'])w.apply({provider:'claude',sessionId:'p',type:'tool_start',action:'read',toolId});w.apply({provider:'claude',sessionId:'p',type:'tool_end',toolId:'a'});assert.equal(w.agents.get('claude:p').pending.size,1);assert.equal(w.agents.get('claude:p').action,'read');w.time=600;w.update(0);assert.equal(w.agents.get('claude:p').action,'read');});
test('Événements dupliqués ignorés et snapshots conservent les attentes',()=>{const w=fresh();const e={id:'one',provider:'codex',sessionId:'p',type:'wait'};w.apply(e);w.apply(e);assert.equal(w.events,1);const a=w.agents.get('codex:p'),n=fresh();n.restore({eventsCount:1,agents:[{...a,pending:[],sinceAgo:15,lastAgo:15}]});assert.equal(n.agents.get('codex:p').action,'wait');n.time=300;n.update(0);assert.equal(n.agents.get('codex:p').action,'wait');});
test('Validation de frontière supprime les champs inconnus',()=>{const e=validateEvent({id:'x',provider:'claude',sessionId:'fake',type:'prompt',secret:'NO'});assert.equal('secret'in e,false);assert.equal(validateEvent({provider:'unknown'}),null);});
test('2, 20 et 64 agents produisent autant de modules, sans limitation à 12',()=>{
  for(const n of [0,2,20,64]){const w=fresh();for(let i=0;i<n;i++)w.apply({provider:i%2?'claude':'codex',sessionId:String(i),type:'prompt'});assert.equal(w.visible().length,n);for(const [W,H] of [[360,640],[640,360]]){const l=globalThis.TransitWorld.layout(W,H,n);assert.equal(l.stations.length,n);assert.ok(l.stations.every(p=>Number.isFinite(p.x)&&p.x>0&&p.x<W&&p.y>0&&p.y<H));}}
});
