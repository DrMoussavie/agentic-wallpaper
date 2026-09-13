import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/animations.js';import '../public/world.js';import '../public/life.js';import '../public/pet-guide.js';import '../public/toy.js';

function garden(width=640,height=900){
  const life=new TransitLife.Life(7);life.resize(width,height,0,100);
  const world=new TransitWorld.World();world.mode='live';world.connection='open';
  const ball=new TransitToy.Ball(),guide=new TransitPet.Guide();ball.layout(life);
  const tick=(seconds,pet=true)=>{for(let t=0;t<seconds;t+=1/30){ball.update(1/30,life,true,pet);guide.update(1/30,life,world,pet,ball);}};
  return{life,world,ball,guide,tick};
}

test('Une seule balle : saisir, lancer, rebondir sur un curseur rapide et annuler la capture',()=>{
  const {ball,life}=garden();
  assert.equal(ball.press(230,300,1000),true);ball.move(250,280,1030);ball.release(1040);
  assert.equal(ball.state,'free');assert.ok(ball.vx>0&&ball.vy<0);
  assert.equal(ball.press(400,500,1100),false); // no second ball
  ball.update(.2,life,true,false);ball.pointer=null;
  const {x,y}=ball;ball.move(x-45,y+2,1200);ball.move(x+45,y+2,1250);
  assert.ok(ball.vy<0);assert.equal(ball.lastPlay,ball.time);
  assert.equal(ball.press(ball.x,ball.y,1300),true);ball.move(300,310,1340);ball.release(1350,true);
  assert.equal(ball.state,'free');assert.equal(ball.pointer,null);assert.equal(ball.vx,0);assert.equal(ball.vy,0);
});

test('Après le jeu le chien récupère, porte puis range la balle, en portrait et ultra-large',()=>{
  for(const [width,height] of [[1080,1920],[2560,1080],[320,568]]){
    const {ball,guide,tick,world}=garden(width,height),seen=new Set();
    ball.press(width*.5,height*.6,0);ball.release(200,true);
    const before=JSON.stringify([...world.agents]);
    for(let i=0;i<1800&&ball.state!=='hidden';i++){tick(1/30);seen.add(ball.state);}
    assert.ok(seen.has('fetch'),`fetch ${width}`);assert.ok(seen.has('carried'),`carry ${width}`);assert.equal(ball.state,'hidden',`stored ${width}`);
    assert.ok(Math.hypot(guide.x-ball.basket.x,guide.y-ball.basket.y)<14);
    assert.equal(JSON.stringify([...world.agents]),before);assert.equal(world.events,0);
  }
});

test('Les alertes passent avant le jeu ; reprise de balle à la main et chien désactivé',()=>{
  const {ball,guide,tick,world,life}=garden();
  ball.press(320,480,0);ball.release(100,true);
  for(let i=0;i<1500&&ball.state!=='carried';i++)tick(1/30);
  assert.equal(ball.state,'carried');
  assert.equal(ball.press(ball.x,ball.y,2000),true);tick(.1);assert.equal(ball.state,'held');assert.equal(guide.job,null);
  ball.release(2200,true);tick(9);
  world.apply({provider:'claude',sessionId:'approval',type:'wait'});
  const agent=world.visible()[0];life.outside=()=>[{id:agent.id,agent,x:140,y:300,phase:'outside'}];
  tick(.1);assert.equal(guide.targetId,agent.id);assert.equal(guide.job,null);assert.equal(ball.state,'free');
  tick(26,false);assert.equal(ball.state,'hidden'); // no orphan toy if the pet is disabled
});

test('Il attend 4 secondes immobiles et abandonne la récupération dès que le joueur reprend',()=>{
  const {ball,guide,tick}=garden(1080,1920);
  ball.press(100,400,0);ball.release(200,true);
  for(let i=0;i<500&&ball.stillSince===null;i++)tick(1/30);
  assert.notEqual(ball.stillSince,null);tick(3.8);assert.equal(ball.state,'free');assert.equal(guide.job,null);
  tick(.25);assert.equal(ball.state,'fetch');assert.equal(guide.job,'fetch');
  // A swipe resumes play before the dog reaches the ball.
  ball.move(ball.x-30,ball.y,1000);ball.move(ball.x+30,ball.y,1040);
  tick(1/30);assert.equal(ball.state,'free');assert.equal(guide.job,null);assert.ok(ball.vy<0);
});

test('Redimensionnement et pause : position bornée, désactivation sans objet bloqué',()=>{
  const {ball,life}=garden(2560,1080);ball.press(2200,800,0);ball.release(200,true);
  life.resize(320,568,0,100);ball.update(.2,life,true,false);
  assert.ok(ball.x<=311&&ball.y<=life.bounds.bottom);
  const before=ball.snapshot();ball.update(0,life,true,false);assert.deepEqual(ball.snapshot(),before);
  ball.press(ball.x,ball.y,300);ball.update(.1,life,false,false);assert.equal(ball.state,'hidden');assert.equal(ball.pointer,null);
});
