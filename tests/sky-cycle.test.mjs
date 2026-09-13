import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';
import '../public/world.js';import '../public/life.js';import '../public/visitors.js';import '../public/free-renderer.js';

test('Cycle local : jour bleu doux, nuit sombre et transition continue à minuit',()=>{
  const {skyTone}=TransitVisitors;
  assert.equal(skyTone(12).light,1);assert.equal(skyTone(0).light,0);
  assert.equal(skyTone(7).light,.5);assert.equal(skyTone(20).light,.5);
  assert.deepEqual(skyTone(0),skyTone(24));assert.deepEqual(skyTone(-1),skyTone(23));
  assert.notEqual(skyTone(12).sky,skyTone(12).ground);
});

test('Le vrai rendu sépare le ciel du sol sur trois formats et fonctionne sans visiteurs',()=>{
  for(const [width,height] of [[1080,1920],[1920,1080],[3440,1440]]){
    const world=new TransitWorld.World();world.mode='live';world.connection='open';
    const c=createCanvas(width,height);c.getBoundingClientRect=()=>({width,height});
    const r=TransitRenderer.createRenderer(c,world);r.settings.background='cycle';r.settings.visitors=false;
    const pixel=(x,y)=>[...c.getContext('2d').getImageData(x,y,1,1).data].slice(0,3);
    r.clockHour=12;r.resize();r.draw();
    const day=pixel(0,0),ground=pixel(0,height-1);
    assert.ok(day[2]>day[0]);assert.ok(day.every(v=>v<130));assert.ok(ground.every(v=>v<35));
    r.clockHour=0;world.update(.1);r.draw();
    const night=pixel(0,0);assert.ok(night.every((v,i)=>v<day[i]));
    r.settings.background='black';r.draw();assert.deepEqual(pixel(0,height-1),[0,0,0]);
  }
});
