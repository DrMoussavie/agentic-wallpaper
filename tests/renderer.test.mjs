import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';import '../public/world.js';import '../public/life.js';import '../public/free-renderer.js';
function setup(size=[1080,1920],count=20){const w=new TransitWorld.World();w.mode='demo';w.demoPopulation=count;w.demo();const c=createCanvas(300,150);c.getBoundingClientRect=()=>({width:size[0],height:size[1]});const r=TransitRenderer.createRenderer(c,w);r.resize();r.draw();return{w,r,c};}
test('Le vrai rendu ne déborde pas pour 2 et 20 agents sur quatre formats',()=>{
  for(const size of [[1080,1920],[1920,1080],[1024,1024],[3440,1440]])for(const count of [2,20]){
    const {w,r,c}=setup(size,count);for(let i=0;i<140;i++){w.update(.1);r.draw();}assert.equal(r.positions.size,count);assert.equal(r.scene.stations.length,0);assert.ok(c.width<=size[0]&&c.height<=size[1]);assert.ok([...r.positions.values()].every(a=>a.x>=30&&a.x<c.width-25&&a.y>=60&&a.y<c.height-20));
  }
});
test('Clics et rendu progressent réellement ; un rafraîchissement immobile reste identique',()=>{
  const {w,r,c}=setup([1103,743],2);w.mode='live';w.connection='open';w.idleDelay=Infinity;for(const a of w.agents.values())w.setAction(a,'idle');for(let i=0;i<300;i++){w.update(.1);r.draw();}const a=[...r.positions.values()][0],b=c.getBoundingClientRect();const x=a.x*b.width/c.width,y=(a.y-12)*b.height/c.height;
  assert.equal(r.hit(x,y),a.id);r.interact(x,y);assert.ok(a.waveUntil>0);
  const hash=()=>createHash('sha256').update(c.toBuffer('image/png')).digest('hex');r.draw();const still=hash();r.draw();assert.equal(hash(),still);for(let i=0;i<100;i++){w.update(.1);r.draw();}assert.notEqual(hash(),still);assert.ok(r.life.stats.walked>1);
});
