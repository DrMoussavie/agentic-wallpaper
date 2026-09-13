import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/animations.js';
import '../public/world.js';
import '../public/life.js';
const {World}=globalThis.TransitWorld,{Life}=globalThis.TransitLife;
function setup(n=6,seed=42,size=[360,640]){const w=new World();w.mode='live';w.connection='open';w.idleDelay=w.archiveDelay=Infinity;for(let i=0;i<n;i++)w.apply({provider:i%2?'claude':'codex',sessionId:String(i),type:'idle'});const l=new Life(seed);l.resize(...size);l.update(0,w);return{w,l};}
function run(w,l,seconds,settings={}){for(let i=0;i<Math.ceil(seconds*10);i++){w.update(.1);l.update(.1,w,settings);}}
test('La porte est commune ; les destinations du jardin sont procédurales et reproductibles',()=>{
  const a=setup(20),b=setup(20),c=setup(20,73),spots=l=>[...l.actors.values()].map(a=>a.homeSpot);assert.deepEqual(spots(a.l),spots(b.l));assert.notDeepEqual(spots(a.l),spots(c.l));
  const positions=spots(a.l);assert.ok(new Set(positions.map(p=>Math.round(p.x))).size>12);assert.ok(new Set(positions.map(p=>Math.round(p.y))).size>12);assert.ok([...a.l.actors.values()].every(actor=>actor.phase==='queued'&&actor.x===a.l.scene.door.x));
});
test('Les agents restent dans les limites en formats arbitraires, sans grille de postes',()=>{
  for(const size of [[360,640],[640,360],[500,500],[1280,360],[220,900],[320,180]])for(const n of [2,20,64]){
    const {w,l}=setup(n,91,size);run(w,l,18);const b=l.bounds;assert.equal(l.actors.size,n);assert.ok([...l.actors.values()].every(a=>Number.isFinite(a.x)&&a.x>0&&a.x<l.width&&a.y>0&&a.y<l.height&&(a.phase!=='outside'||a.x>=b.left&&a.x<=b.right&&a.y>=b.top&&a.y<=b.bottom)),`${size}/${n}`);
  }
});
test('Promenades et rencontres sont réelles, sans modifier les événements des deux fournisseurs',()=>{
  const {w,l}=setup(2,28,[640,360]),initial=w.events,original=[...w.agents.values()].map(a=>[a.id,a.action,a.pending.size]);run(w,l,120);
  assert.ok(l.stats.walked>200);assert.ok(l.stats.meetings>=1,JSON.stringify(l.snapshot()));assert.equal(w.events,initial);assert.deepEqual([...w.agents.values()].map(a=>[a.id,a.action,a.pending.size]),original);assert.equal(w.packets.length,0);
});
test('Travail, attente et erreur interrompent les rencontres ; le clic ne les détourne pas',()=>{
  const {w,l}=setup(6);run(w,l,9);for(let i=0;i<3;i++)w.apply({provider:i%2?'claude':'codex',sessionId:String(i),type:i===0?'tool_start':i===1?'wait':'error',action:'read',toolId:'long'});l.update(0,w);
  for(let i=0;i<3;i++){const a=l.actors.get(`${i%2?'claude':'codex'}:${i}`);assert.equal(a.meeting,null);l.invite(100,100,a.id,w);assert.equal(a.waveUntil,0);}
  run(w,l,20);assert.equal(w.agents.get('codex:0').action,'read');assert.equal(w.agents.get('codex:0').pending.size,1);assert.equal(w.agents.get('claude:1').action,'wait');
});
test('Resize conserve les identités et la position relative ; déconnexion et pause figent les déplacements',()=>{
  const {w,l}=setup();run(w,l,6);const ids=[...l.actors.keys()],before=l.snapshot().actors.map(a=>({x:(a.x-l.bounds.left)/(l.bounds.right-l.bounds.left),y:(a.y-l.bounds.top)/(l.bounds.bottom-l.bounds.top)}));l.resize(1000,300);assert.deepEqual([...l.actors.keys()],ids);
  [...l.actors.values()].forEach((a,i)=>{assert.ok(Math.abs((a.x-l.bounds.left)/(l.bounds.right-l.bounds.left)-before[i].x)<.12);assert.ok(Math.abs((a.y-l.bounds.top)/(l.bounds.bottom-l.bounds.top)-before[i].y)<.12);});
  w.connection='offline';const still=l.snapshot().actors.map(a=>[a.x,a.y]);run(w,l,5);assert.deepEqual(l.snapshot().actors.map(a=>[a.x,a.y]),still);w.connection='open';for(let i=0;i<10;i++)l.update(0,w);assert.deepEqual(l.snapshot().actors.map(a=>[a.x,a.y]),still);
});
test('Un sous-agent sort de la maison pour rejoindre le secteur du parent, sans duplication',()=>{
  const {w,l}=setup(0);w.apply({provider:'claude',sessionId:'parent',agentId:'child',type:'subagent_start'});l.update(0,w);const parent=l.actors.get('claude:parent'),child=l.actors.get('claude:child');assert.ok(Math.hypot(parent.homeSpot.x-child.homeSpot.x,parent.homeSpot.y-child.homeSpot.y)<90);const pos=[child.x,child.y];w.apply({provider:'claude',sessionId:'parent',agentId:'child',type:'subagent_start'});l.update(0,w);assert.equal(l.actors.size,2);assert.deepEqual([child.x,child.y],pos);
});
test('Désactiver les promenades arrête les trajets libres et supprime les rencontres',()=>{const {w,l}=setup();run(w,l,35);run(w,l,2,{roam:false});assert.equal(l.encounters.length,0);assert.ok([...l.actors.values()].filter(a=>a.phase==='outside').every(a=>!a.walking&&!a.target));});
test('Un changement de format écarte immédiatement les silhouettes dehors, même en pause',()=>{const {w,l}=setup(20,42,[360,640]);run(w,l,45);l.resize(1200,500);const a=[...l.actors.values()].filter(a=>a.phase==='outside');assert.ok(a.length>10);for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)assert.ok(Math.hypot((a[i].x-a[j].x)/34,(a[i].y-a[j].y)/42)>.88);});
test('Codex et Claude : sortie, fin de réponse, retour réel à la porte, repos et reprise du même agent',()=>{
  for(const provider of ['codex','claude']){const {w,l}=setup(0);w.apply({provider,sessionId:'a',type:'session_start'});l.update(0,w);const a=l.actors.get(`${provider}:a`);assert.equal(a.phase,'queued');run(w,l,25);assert.equal(a.phase,'outside');w.apply({provider,sessionId:'a',type:'stop'});run(w,l,7);assert.ok(['returning','entering','home'].includes(a.phase));run(w,l,40);assert.equal(a.phase,'home');assert.equal(l.outside().length,0);assert.equal(l.stats.returned,1);assert.equal(w.agents.size,1);w.apply({provider,sessionId:'a',type:'prompt'});l.update(0,w);assert.equal(a.phase,'queued');assert.equal(a.x,l.scene.door.x);run(w,l,25);assert.equal(a.phase,'outside');assert.equal(w.agents.size,1);assert.equal(l.stats.departed,2);}
});
test('Une session close finit son trajet, une nouvelle conversation reçoit sa propre identité',()=>{const {w,l}=setup(0);w.apply({provider:'codex',sessionId:'old',type:'prompt'});run(w,l,25);const old=l.actors.get('codex:old');w.apply({provider:'codex',sessionId:'old',type:'session_end'});run(w,l,40);assert.equal(old.phase,'home');assert.equal(w.agents.get('codex:old').retired,true);w.apply({provider:'codex',sessionId:'new',type:'session_start'});l.update(0,w);assert.equal(l.actors.get('codex:new').phase,'queued');assert.equal(old.phase,'home');assert.equal(l.actors.size,2);});
test('Un nouveau prompt interrompt le retour sans téléporter le robot',()=>{const {w,l}=setup(0);w.apply({provider:'claude',sessionId:'one',type:'prompt'});run(w,l,25);const a=l.actors.get('claude:one');w.apply({provider:'claude',sessionId:'one',type:'stop'});run(w,l,5);const p={x:a.x,y:a.y};w.apply({provider:'claude',sessionId:'one',type:'prompt'});l.update(0,w);assert.ok(['leaving','outside'].includes(a.phase));assert.ok(Math.hypot(a.x-p.x,a.y-p.y)<1);});
