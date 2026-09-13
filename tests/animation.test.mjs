import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import {createHash} from 'node:crypto';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';
test('Toutes les séquences changent réellement de pixels, dans les deux familles',()=>{
  for(const family of ['codex','claude'])for(const a of Object.values(globalThis.TransitAnimations.ACTIONS)){
    const hashes=new Set();for(let frame=0;frame<24;frame++){const c=createCanvas(128,96),ctx=c.getContext('2d');globalThis.TransitSprites.robot(ctx,48,70,family,a.id,a.duration*frame/24);hashes.add(createHash('sha256').update(c.toBuffer('image/png')).digest('hex'));}
    assert.ok(hashes.size>=5,`${family}/${a.id}: seulement ${hashes.size} images différentes`);
  }
});
test('Modèle commun immuable et seules variantes autorisées',()=>{const m=globalThis.TransitSprites.MODEL;assert.ok(Object.isFrozen(m));assert.ok(Object.isFrozen(m.codex));assert.ok(Object.isFrozen(m.claude));assert.equal(m.codex.antennae,1);assert.equal(m.claude.antennae,2);assert.equal(m.headWidth,18);assert.notEqual(m.codex.shell,m.claude.shell);});
