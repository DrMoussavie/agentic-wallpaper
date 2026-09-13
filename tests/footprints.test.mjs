import test from 'node:test';
import assert from 'node:assert/strict';
import '../public/visitors.js';
test('Empreintes : mouvement réel, pattes distinctes, pause, expiration et plafond',()=>{
  const f=new TransitVisitors.Footprints();
  const walkers=[{id:'bot',x:10,y:50,walking:true},{id:'dog',x:10,y:70,walking:true,dog:true}];
  f.update(0,walkers,1000,500);assert.equal(f.marks.length,0);
  walkers.forEach(w=>w.x+=8);f.update(.1,walkers,1000,500);
  assert.equal(f.marks.length,2);assert.equal(f.marks.filter(m=>m.dog).length,1);
  f.update(.1,walkers,1000,500);f.update(.2,walkers,1000,500);assert.equal(f.marks.length,2);
  const many=Array.from({length:20},(_,i)=>({id:String(i),x:10,y:90+i*10,walking:true}));
  for(let frame=0;frame<30;frame++){many.forEach(w=>w.x+=8);f.update(1+frame*.1,many,1000,500);}
  assert.equal(f.marks.length,128);assert.equal(f.last.size,20);
  f.update(20,[],1000,500);assert.equal(f.marks.length,0);assert.equal(f.last.size,0);
  f.update(21,walkers,1000,500);walkers.forEach(w=>w.x+=100);f.update(22,walkers,1000,500);assert.equal(f.marks.length,0);
  walkers.forEach(w=>w.x+=8);f.update(23,walkers,1000,500);assert.equal(f.marks.length,2);
  f.update(24,walkers,300,800);assert.equal(f.marks.length,0);
});
