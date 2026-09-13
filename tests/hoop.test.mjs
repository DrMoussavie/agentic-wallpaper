import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';import '../public/world.js';import '../public/life.js';import '../public/pet-guide.js';import '../public/toy.js';import '../public/visitors.js';import '../public/free-renderer.js';

function garden(width=640,height=900,seed=7){
  const life=new TransitLife.Life(seed);life.resize(width,height,0,100);
  const ball=new TransitToy.Ball(),hoop=new TransitToy.Hoop(seed);ball.layout(life);
  return{life,ball,hoop};
}

test('Le panier roule entre deux positions, sans collision active pendant le déplacement',()=>{
  const {life,ball,hoop}=garden();hoop.update(.1,life,true,ball);
  const before={x:hoop.x,y:hoop.y};hoop.spawn(life,ball);
  const destination={...hoop.travel.to};assert.equal(hoop.active,false);
  hoop.update(.2,life,true,ball);
  assert.ok(Math.hypot(hoop.x-before.x,hoop.y-before.y)>0);
  assert.ok(Math.hypot(hoop.x-destination.x,hoop.y-destination.y)>0);
  for(let i=0;i<6;i++)hoop.update(.2,life,true,ball);
  assert.equal(hoop.active,true);assert.equal(hoop.travel,null);
  assert.deepEqual({x:hoop.x,y:hoop.y},destination);
});

test('Un contact sur le bout de l’anneau déclenche une vibration, sans célébration de panier',()=>{
  const {ball,hoop}=garden();hoop.x=300;hoop.y=500;hoop.facing=1;hoop.state='up';hoop.time=2;
  const rim=hoop.rim();ball.x=rim.x+rim.half+4;ball.y=rim.y;ball.vx=-40;ball.vy=0;
  hoop.collide(ball,ball.x+2,ball.y);
  assert.ok(hoop.rimUntil>hoop.time);assert.equal(hoop.score,0);
  assert.ok(hoop.flashUntil<hoop.time);assert.ok(ball.vx>0);
  hoop.scored(ball);assert.equal(hoop.score,1);assert.ok(hoop.netUntil>hoop.time);
  assert.ok(hoop.rimUntil<hoop.time);
});

test('Le panier est toujours là, sur un emplacement libre, et change de place à chaque panier marqué',()=>{
  for(const [width,height] of [[1080,1920],[2560,1080],[640,900]]){
    const {life,ball,hoop}=garden(width,height,3);const spots=new Set();
    for(let i=0;i<3000;i++){hoop.update(.1,life,true,ball);if(i>20)assert.equal(hoop.active,true,`toujours présent ${width}`);if(hoop.active)spots.add(`${hoop.x}:${hoop.y}`);}
    assert.equal(spots.size,1,'pas de déplacement sans panier marqué');
    const check=()=>{const b=life.bounds,s=life.scene,{x,y}=hoop;
      assert.ok(x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom);
      assert.ok(!(x<s.house.x+s.house.width/2+46&&y<s.gate.y+56),'pas sur la maison');
      assert.ok(Math.hypot(x-ball.basket.x,y-ball.basket.y)>=40,'pas sur le coffre à jouets');
      assert.ok(s.plants.every(p=>Math.abs(x-p.x)>p.width+16||Math.abs(y-p.y)>p.width+14),'pas sur les props');
      assert.equal(hoop.facing,x>life.width/2?-1:1,'ouvert vers le centre de l’écran');};
    check();
    for(let n=0;n<4;n++){const before={x:hoop.x,y:hoop.y};ball.state='free';ball.take('you');ball.x=hoop.rim().x;ball.y=hoop.rim().y-14;ball.throwAt({x:hoop.rim().x,y:hoop.rim().y-1},.4,0);
      for(let i=0;i<40;i++){ball.update(.1,life,true,false,hoop);hoop.update(.1,life,true,ball);}
      assert.equal(hoop.score,n+1);assert.equal(hoop.active,true);assert.ok(Math.hypot(hoop.x-before.x,hoop.y-before.y)>60,`déplacé après le panier ${n+1} (${width})`);check();}
    hoop.update(.1,life,false,ball);assert.equal(hoop.active,false);for(let i=0;i<12;i++)hoop.update(.1,life,true,ball);assert.equal(hoop.active,true,'revient dès la réactivation');
  }
});

test('Le lancer garde la vitesse du geste même si le dernier mouvement précède le relâchement de 200 ms',()=>{
  const {life,ball}=garden();
  ball.press(200,400,1000);ball.move(210,395,1030);ball.move(240,375,1070);ball.move(280,350,1110);ball.release(1300);
  assert.equal(ball.state,'free');assert.ok(ball.vx>200&&ball.vy<-150,`vitesse du geste ${ball.vx},${ball.vy}`);
  ball.press(ball.x,ball.y,2000);ball.move(ball.x+3,ball.y,2020);ball.release(2400);
  assert.ok(Math.abs(ball.vx)<5&&ball.vy>-70,'curseur arrêté : simple lâcher');
});

test('Un tir précis marque, un tir large rate, la série se remet à zéro et le record persiste',()=>{
  const {life,ball,hoop}=garden();hoop.x=300;hoop.y=500;hoop.facing=1;hoop.state='up';hoop.relocate=false;hoop.time=1;
  const shoot=error=>{ball.state='free';ball.take('robot');const rim=hoop.rim();ball.x=rim.x+44;ball.y=hoop.y-9;ball.throwAt({x:rim.x,y:rim.y-1},.85,error);for(let i=0;i<600&&!(ball.vx===0&&ball.vy===0);i++)ball.update(1/60,life,true,false,hoop);};
  shoot(0);shoot(1);assert.equal(hoop.score,2);assert.equal(hoop.streak,2);assert.equal(hoop.best,2);
  shoot(11);assert.equal(hoop.score,2);assert.equal(hoop.streak,0);assert.equal(hoop.best,2);assert.equal(hoop.lastShot.scored,false);
  shoot(-1);assert.equal(hoop.streak,1);assert.equal(hoop.best,2);
  assert.ok(ball.y<=life.bounds.bottom&&ball.x>=9,'la balle retombe dans le jardin');
});

test('Un robot disponible sort la balle du coffre, tire au panier et réagit, sans toucher aux événements',()=>{
  const world=new TransitWorld.World();world.mode='live';world.connection='open';world.idleDelay=world.archiveDelay=Infinity;
  world.apply({provider:'claude',sessionId:'a',type:'idle'});world.apply({provider:'codex',sessionId:'b',type:'tool_start',action:'read',toolId:'busy'});
  const {life,ball,hoop}=garden();const settings={roam:true,social:true,toy:true,hoop:true},stages=new Set();const before=JSON.stringify([...world.agents.values()].map(a=>[a.id,a.action]));
  for(let i=0;i<2400&&!life.stats.shots;i++){world.update(.1);life.update(.1,world,settings,{ball,hoop});ball.update(.1,life,true,false,hoop);hoop.update(.1,life,true,ball);const a=life.actors.get('claude:a');if(a.play)stages.add(a.play.stage);if(ball.state==='robot')assert.equal(ball.carrier,'claude:a');}
  assert.deepEqual([...stages].sort(),['aim','toBall','toSpot','watch']);assert.equal(life.stats.shots,1);assert.ok(!life.actors.get('codex:b').play);
  assert.equal(JSON.stringify([...world.agents.values()].map(a=>[a.id,a.action])),before);assert.equal(world.events,2);
  for(let i=0;i<80;i++){world.update(.1);life.update(.1,world,settings,{ball,hoop});ball.update(.1,life,true,false,hoop);hoop.update(.1,life,true,ball);}
  const a=life.actors.get('claude:a');assert.equal(a.play,null);assert.ok(['swish','miss'].includes(a.cheer));
  // Real work interrupts a game immediately and the ball is dropped, never teleported.
  world.apply({provider:'claude',sessionId:'a',type:'idle',id:'again'});a.nextPlay=0;life.nextPlay=0;life.player=null;
  for(let i=0;i<600&&ball.state!=='robot';i++){world.update(.1);life.update(.1,world,settings,{ball,hoop});ball.update(.1,life,true,false,hoop);hoop.update(.1,life,true,ball);}
  assert.equal(ball.state,'robot');const held=[ball.x,ball.y];
  world.apply({provider:'claude',sessionId:'a',type:'tool_start',action:'type',toolId:'work'});life.update(.1,world,settings,{ball,hoop});
  assert.equal(a.play,null);assert.equal(ball.state,'free');assert.ok(Math.hypot(ball.x-held[0],ball.y-held[1])<20);
});

test('Le sous-agent sort du portail ouvert par son parent, avec un éclat, puis rejoint son orbite',()=>{
  const world=new TransitWorld.World();world.mode='live';world.connection='open';world.idleDelay=world.archiveDelay=Infinity;
  world.apply({provider:'claude',sessionId:'root',type:'idle'});
  const life=new TransitLife.Life(7);life.resize(640,900);const run=s=>{for(let i=0;i<s*10;i++){world.update(.1);life.update(.1,world,{roam:true,social:true});}};
  run(30);const parent=life.actors.get('claude:root');assert.equal(parent.phase,'outside');
  world.apply({provider:'claude',sessionId:'root',agentId:'kid',type:'subagent_start'});life.update(0,world,{roam:true,social:true});
  const kid=life.actors.get('claude:kid');assert.equal(kid.phase,'portal');assert.deepEqual([kid.x,kid.y],[parent.x+35,parent.y]);assert.equal(life.outside().includes(kid),false);
  run(2);assert.equal(kid.phase,'portal');run(1.2);assert.equal(kid.phase,'leaving');assert.equal(life.bursts.at(-1)?.kind,'portal');
  run(20);assert.equal(kid.phase,'outside');assert.equal(kid.orbiting,true);
  // A parent still inside the house cannot open a portal: the classic door is used.
  world.apply({provider:'codex',sessionId:'home',type:'session_end'});run(40);
  world.apply({provider:'codex',sessionId:'home',agentId:'late',type:'subagent_start'});life.update(0,world,{roam:true,social:true});
  assert.equal(life.actors.get('codex:late').phase,'queued');
});

test('Papillon le jour, lucioles la nuit, et le chien court après le papillon quand rien ne presse',()=>{
  const life=new TransitLife.Life(7);life.resize(640,900,0,100);const visitors=new TransitVisitors.Visitors(7);
  let seen=false;for(let i=0;i<1500;i++){visitors.update(.1,life,true,14);if(visitors.butterfly)seen=true;}
  assert.equal(seen,true);assert.equal(visitors.fireflies.length,0);
  for(let i=0;i<20;i++)visitors.update(.1,life,true,23);assert.equal(visitors.butterfly,null);assert.ok(visitors.fireflies.length>=3);
  assert.ok(visitors.fireflies.every(f=>f.x>=life.bounds.left&&f.x<=life.bounds.right&&f.y>=life.bounds.top&&f.y<=life.bounds.bottom));
  visitors.update(.1,life,false,23);assert.equal(visitors.fireflies.length,0);
  const world=new TransitWorld.World();world.mode='live';world.connection='open';const guide=new TransitPet.Guide();
  for(let i=0;i<40;i++)guide.update(.1,life,world,true,null,null);
  const before=[guide.x,guide.y];for(let i=0;i<30;i++)guide.update(.1,life,world,true,null,{x:life.bounds.right-40,y:life.bounds.bottom-40});
  assert.equal(guide.job,'chase');assert.ok(Math.hypot(guide.x-before[0],guide.y-before[1])>20);
});

test('Rendu complet : profondeur partagée, panier, papillon et danse ne cassent pas le dessin réel',()=>{
  const world=new TransitWorld.World();world.mode='demo';world.demoPopulation=6;world.demo();
  const canvas=createCanvas(300,150);canvas.getBoundingClientRect=()=>({width:1920,height:1080});
  const renderer=TransitRenderer.createRenderer(canvas,world);renderer.clockHour=14;renderer.resize();
  for(let i=0;i<900;i++){world.update(.1);renderer.draw();}
  const snap=renderer.snapshot();assert.ok(['up','away'].includes(snap.hoop.state));assert.equal(snap.visitors.night,false);
  renderer.clockHour=23;for(let i=0;i<30;i++){world.update(.1);renderer.draw();}assert.equal(renderer.snapshot().visitors.night,true);assert.ok(renderer.snapshot().visitors.fireflies>=3);
  renderer.settings.hoop=false;renderer.settings.visitors=false;for(let i=0;i<30;i++){world.update(.1);renderer.draw();}
  assert.equal(renderer.snapshot().hoop.state,'away');assert.equal(renderer.snapshot().visitors.fireflies,0);assert.equal(renderer.snapshot().visitors.butterfly,null);
});
