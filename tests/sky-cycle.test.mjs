import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';
import '../public/world.js';import '../public/life.js';import '../public/visitors.js';import '../public/free-renderer.js';

test('Cycle local : jour bleu doux, nuit sombre et transition continue à minuit',()=>{
  const {skyTone}=TransitVisitors;
  assert.equal(skyTone(12).light,1);assert.equal(skyTone(0).light,0);
  assert.equal(skyTone(7).light,.5);assert.equal(skyTone(20).light,.5);
  assert.deepEqual(skyTone(0),skyTone(24));assert.deepEqual(skyTone(-1),skyTone(23));
  assert.notEqual(skyTone(12).sky,skyTone(12).ground);
});

test('Ciel vivant : population bornée, scintillements décalés, météo céleste variée et pause',()=>{
  const sky=new TransitVisitors.Sky(17);sky.update(0,640,120,0);
  assert.ok(sky.stars.length>=18&&sky.stars.length<=110);
  assert.ok(new Set(sky.stars.map(s=>s.speed)).size>10);
  assert.notEqual(sky.brightness(sky.stars[0],0),sky.brightness(sky.stars[0],1));
  const initial=JSON.stringify(sky.snapshot());sky.update(0,640,120,0);assert.equal(JSON.stringify(sky.snapshot()),initial);
  const shots=[];let events=0;
  for(let time=0;time<300;time+=.1){sky.update(time,640,120,0);if(sky.events!==events){shots.push({...sky.meteor});events=sky.events;}}
  assert.ok(shots.length>=7);assert.ok(new Set(shots.map(s=>s.duration)).size>5);
  assert.ok(new Set(shots.map(s=>s.x)).size>5);
  for(const m of shots){assert.ok(m.x>=0&&m.x+m.dx>=0&&m.x+m.dx<=640);assert.ok(m.y+m.dy<=120);}
  sky.update(301,640,120,1);assert.equal(sky.meteor,null);
  sky.update(302,300,60,0);assert.ok(sky.stars.every(s=>s.x<300&&s.y<60));
});

test('Le ciel nocturne change réellement de pixels ; le même instant reste identique',()=>{
  const world=new TransitWorld.World();world.mode='live';world.connection='open';
  const canvas=createCanvas(640,480);canvas.getBoundingClientRect=()=>({width:640,height:480});
  const r=TransitRenderer.createRenderer(canvas,world);r.settings.background='cycle';r.clockHour=0;r.resize();r.draw();
  const hash=()=>createHash('sha256').update(canvas.getContext('2d').getImageData(0,0,640,70).data).digest('hex');
  const initial=hash();r.draw();assert.equal(hash(),initial);
  for(let i=0;i<20;i++){world.update(.1);r.draw();}
  assert.notEqual(hash(),initial);
});

test('Le vrai rendu sépare le ciel du sol sur trois formats et fonctionne sans visiteurs',()=>{
  for(const [width,height] of [[1080,1920],[1920,1080],[3440,1440]]){
    const world=new TransitWorld.World();world.mode='live';world.connection='open';
    const c=createCanvas(width,height);c.getBoundingClientRect=()=>({width,height});
    const r=TransitRenderer.createRenderer(c,world);r.settings.background='cycle';r.settings.visitors=false;
    const pixel=(x,y)=>[...c.getContext('2d').getImageData(x,y,1,1).data].slice(0,3);
    r.clockHour=12;r.resize();r.draw();
    const day=pixel(0,0),ground=pixel(0,height-1);
    assert.ok(day[2]>day[0]);assert.ok(day.every(v=>v<160));assert.ok(ground.every(v=>v<35));
    r.clockHour=0;world.update(.1);r.draw();
    const night=pixel(0,0);assert.ok(night.every((v,i)=>v<day[i]));
    r.settings.background='black';r.draw();assert.deepEqual(pixel(0,height-1),[0,0,0]);
  }
});
