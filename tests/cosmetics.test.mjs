import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';
const {SKINS,skinFor,robot,pet}=globalThis.TransitSprites;
test('Ten stable skins per provider, rare weights and distinct rendered appearances',()=>{
  assert.equal(SKINS.length,10);assert.equal(SKINS.reduce((n,s)=>n+s.weight,0),100);
  for(const provider of ['codex','claude']){
    const reached=new Set(),hashes=new Set();
    for(let i=0;i<10000;i++){const id='fixture-'+i;assert.equal(skinFor(id,provider),skinFor(id,provider));reached.add(skinFor(id,provider));}
    assert.equal(reached.size,10);
    for(let skinId=0;skinId<10;skinId++){
      const c=createCanvas(80,80);robot(c.getContext('2d'),40,60,provider,'idle',0,{skinId});
      hashes.add(createHash('sha256').update(c.toBuffer('image/png')).digest('hex'));
    }assert.equal(hashes.size,10);
  }
});
test('Generated dog has alpha, five colors, and every animation changes actual pixels',async()=>{
  const image=await loadImage(await readFile(new URL('../public/assets/pet/puppy-v2.png',import.meta.url)));
  const c=createCanvas(288,160),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,288,160).data,colors=new Set();let transparent=0;
  for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])transparent++;else colors.add([...pixels.slice(i,i+3)].join(','));}
  assert.ok(transparent>288*160*.7);assert.ok(colors.size<=5);
  for(const opts of [{moving:true},{moving:false,alert:'wait'},{moving:false},{moving:false,happy:true}]){
    const hashes=new Set();for(let i=0;i<6;i++){ctx.clearRect(0,0,288,160);pet(ctx,60,60,i/3,{...opts,image});hashes.add(createHash('sha256').update(c.toBuffer('image/png')).digest('hex'));}
    assert.ok(hashes.size>=4,'Animation needs at least four distinct poses');
  }
});
