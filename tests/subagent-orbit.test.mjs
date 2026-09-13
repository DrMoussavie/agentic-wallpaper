import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeHook} from '../bridge/normalize.mjs';
import '../public/animations.js';import '../public/world.js';import '../public/life.js';

test('Codex et Claude : hooks réels normalisés, mini-bots en orbite, activité conservée et retour au repos',()=>{
  for(const provider of ['codex','claude']){
    const world=new TransitWorld.World();world.mode='live';world.connection='open';
    const start=normalizeHook(provider,{hook_event_name:'SessionStart',session_id:'fixture-root'});world.apply(start);
    for(let i=0;i<3;i++){
      world.apply(normalizeHook(provider,{hook_event_name:'SubagentStart',session_id:'fixture-root',agent_id:'fixture-child-'+i}));
      world.apply(normalizeHook(provider,{hook_event_name:'PreToolUse',session_id:'fixture-root',agent_id:'fixture-child-'+i,tool_use_id:'read-'+i,tool_name:'Read'}));
    }
    world.apply({...start,id:'work-parent',type:'tool_start',action:'read',toolId:'long'});
    const life=new TransitLife.Life(7);life.resize(640,900);
    const run=seconds=>{for(let i=0;i<seconds*10;i++){world.update(.1);life.update(.1,world,{social:true,roam:true});}};
    run(60);
    const parent=life.actors.get(provider+':'+start.sessionId),children=[...life.actors.values()].filter(a=>a.agent.parent===parent.id),events=world.events;
    assert.equal(children.length,3);assert.deepEqual(world.population(),{conversations:1,subagents:3,resting:0});
    const before=children.map(a=>[a.x,a.y]);run(8);
    for(const [i,a] of children.entries()){
      assert.equal(a.orbiting,true);assert.ok(Math.hypot(a.x-parent.x,a.y-parent.y)<130);
      assert.ok(Math.hypot(a.x-before[i][0],a.y-before[i][1])>12);
      assert.equal(a.agent.action,'read');assert.equal(life.visual(a,world).action,'read');assert.equal(a.agent.pending.size,1);
    }
    assert.equal(world.events,events);
    const positions=children.map(a=>[a.x,a.y]);world.connection='offline';run(4);assert.deepEqual(children.map(a=>[a.x,a.y]),positions);
    world.connection='open';
    world.apply(normalizeHook(provider,{hook_event_name:'SubagentStop',session_id:'fixture-root',agent_id:'fixture-child-0'}));run(60);
    assert.equal(children[0].phase,'home');assert.equal(parent.agent.pending.size,1);
  }
});
