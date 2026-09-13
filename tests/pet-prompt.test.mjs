import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {normalizeHook} from '../bridge/normalize.mjs';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';import '../public/world.js';import '../public/life.js';import '../public/pet-guide.js';import '../public/free-renderer.js';

test('Le chien patrouille tout le jardin même si tous les agents travaillent',()=>{
  const guide=new TransitPet.Guide(),life=new TransitLife.Life(1),world=new TransitWorld.World();
  world.mode='live';world.connection='open';life.resize(1080,1920);
  const points=[];for(let i=0;i<2400;i++){guide.update(.1,life,world,true);if(i%10===0)points.push([guide.x,guide.y]);}
  assert.ok(Math.max(...points.map(p=>p[1]))>1300);assert.ok(Math.min(...points.map(p=>p[0]))<400);assert.ok(Math.max(...points.map(p=>p[0]))>750);
  assert.equal(world.events,0);assert.equal(world.agents.size,0);
});

test('Le chien repère les attentes et erreurs des deux familles ; clic, résolution et déconnexion',()=>{
  const world=new TransitWorld.World();world.mode='live';world.connection='open';
  world.apply({provider:'codex',sessionId:'approval',type:'wait',label:'Besoin de toi'});
  world.apply({provider:'claude',sessionId:'failure',type:'error',label:'Incident'});
  const actors=world.visible().map((agent,i)=>({id:agent.id,agent,x:150+i*200,y:500,phase:'outside'}));
  const life=new TransitLife.Life(1);life.resize(640,900);life.outside=()=>actors;
  const guide=new TransitPet.Guide(),before=JSON.stringify([...world.agents.values()]);
  for(let i=0;i<100;i++)guide.update(.1,life,world,true);
  assert.equal(guide.targetId,'codex:approval');assert.ok(guide.hit(guide.x,guide.y-5));assert.equal(guide.point(),'codex:approval');assert.equal(guide.snapshot().focused,true);
  assert.equal(JSON.stringify([...world.agents.values()]),before);
  world.apply({provider:'codex',sessionId:'approval',type:'tool_start',toolId:'resume'});
  guide.update(.1,life,world,true);assert.equal(guide.targetId,'claude:failure');
  world.connection='offline';guide.update(.1,life,world,true);assert.equal(guide.targetId,null);assert.equal(guide.snapshot().focused,false);
});

test('Nouveaux prompts Codex et Claude : l’enveloppe attend au terminal, part quand le robot est placé et finit dans ses mains',()=>{
  for(const provider of ['codex','claude']){
    const world=new TransitWorld.World();world.mode='live';world.connection='open';
    const canvas=createCanvas(640,900);canvas.getBoundingClientRect=()=>({width:640,height:900});
    const renderer=TransitRenderer.createRenderer(canvas,world);renderer.settings.hoop=false;renderer.resize();
    const e=normalizeHook(provider,{session_id:'fixture-prompt',hook_event_name:'UserPromptSubmit',prompt:'PRIVATE-FIXTURE'});
    world.apply(e);renderer.draw();assert.equal(world.agents.size,1);assert.equal(renderer.snapshot().promptFlights.length,1);
    const first=renderer.snapshot().promptFlights[0];assert.equal(first.x,renderer.scene.terminal.x);assert.equal(first.progress,0);
    world.apply({...e,id:e.id+'tool',type:'tool_start',action:'read',toolId:'working'});
    const agent=world.visible()[0],actor=()=>renderer.life.actors.get(agent.id);
    // The world packet expires while the robot still walks out; the garden keeps the letter waiting.
    for(let i=0;i<50&&actor().phase!=='outside';i++){world.update(.1);renderer.draw();}
    if(actor().phase!=='outside'){for(let i=0;i<400&&actor().phase!=='outside';i++){world.update(.1);renderer.draw();}}
    assert.equal(actor().phase,'outside');assert.equal(world.packets.filter(p=>p.kind==='prompt').length,0);
    const waiting=renderer.snapshot().promptFlights[0];assert.equal(waiting.progress,0);assert.equal(waiting.x,renderer.scene.terminal.x);
    assert.ok(renderer.life.snapshot().actors[0].expecting===false||renderer.life.visual(actor(),world).action!=='walk');
    for(let i=0;i<12;i++){world.update(.1);renderer.draw();}
    const mid=renderer.snapshot().promptFlights[0];assert.ok(mid.progress>0&&mid.progress<1);assert.notDeepEqual([mid.x,mid.y],[waiting.x,waiting.y]);
    assert.equal(renderer.life.visual(actor(),world).expecting,true);assert.equal(actor().walking,false);
    const snapshot={eventsCount:world.events,agents:[...world.agents.values()].map(a=>({...a,pending:[...a.pending],sinceAgo:world.time-a.since,lastAgo:world.time-a.last}))};
    world.restore(snapshot,true);renderer.draw();assert.equal(renderer.snapshot().promptFlights.length,1);assert.equal(renderer.snapshot().promptFlights[0].progress,mid.progress);
    for(let i=0;i<24;i++){world.update(.1);renderer.draw();}
    assert.equal(renderer.snapshot().promptFlights.length,0);
    const catching=renderer.life.visual(actor(),world);assert.equal(catching.action,'receive');assert.equal(catching.caught,true);assert.ok(catching.age>=1.5);
    assert.equal(world.agents.get(agent.id).action,'read');assert.equal(world.agents.get(agent.id).pending.size,1);
    for(let i=0;i<40;i++){world.update(.1);renderer.draw();}
    assert.equal(renderer.life.visual(actor(),world).action,'read');
    assert.equal(JSON.stringify(world.log).includes('PRIVATE-FIXTURE'),false);
    world.apply(e);assert.equal(world.agents.size,1);assert.equal(world.packets.filter(p=>p.kind==='prompt').length,0);
    world.idleDelay=20;world.apply({provider,sessionId:e.sessionId,type:'stop'});renderer.draw();
    assert.equal(renderer.snapshot().promptFlights[0].kind,'result');assert.equal(world.agents.get(agent.id).resting,true);
    for(let i=0;i<100;i++){world.update(.1);renderer.draw();}
    assert.equal(renderer.life.snapshot().actors[0].lingering,true);
    for(let i=0;i<550;i++){world.update(.1);renderer.draw();}
    assert.equal(actor().phase,'home');
    // A prompt reaching a robot at home: splash at the door when it steps out, letter still waiting.
    world.apply({...e,id:'fresh-prompt'});assert.equal(world.packets.length,1);renderer.draw();
    for(let i=0;i<30&&!renderer.life.bursts.length;i++){world.update(.1);renderer.draw();}
    assert.equal(renderer.life.bursts.length,1);assert.equal(renderer.snapshot().promptFlights[0].progress,0);
    world.restore(snapshot);assert.equal(world.packets.length,0);
  }
});
