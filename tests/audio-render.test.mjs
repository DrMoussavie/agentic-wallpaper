import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCanvas} from '@napi-rs/canvas';

test('Rendu des barres : signal injecté, silence et perte de connexion sans valeurs fantômes',()=>{
  let now=1000;
  const sandbox={performance:{now:()=>now},Float32Array};sandbox.globalThis=sandbox;
  vm.runInNewContext(readFileSync(new URL('../public/audio.js',import.meta.url),'utf8'),sandbox);
  const spectrum=sandbox.TransitAudio.createSpectrum(),c=createCanvas(1080,1920),ctx=c.getContext('2d');
  assert.equal(sandbox.TransitAudio.levelColor(1),'#e9585b');
  assert.equal(sandbox.TransitAudio.levelColor(0),'#5cb593');
  const paint=()=>{ctx.fillStyle='#000';ctx.fillRect(0,0,c.width,c.height);spectrum.draw(ctx,c.width,c.height);};
  const brightBars=()=>{const pixels=ctx.getImageData(20,1825,1040,70).data;let n=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>80)n++;return n;};
  spectrum.receive({status:'live',bands:Array(48).fill(.8)});now+=100;paint();assert.ok(brightBars()>1000);
  spectrum.receive({status:'live',bands:Array(48).fill(0)});
  for(let i=0;i<30;i++){now+=100;paint();}assert.equal(brightBars(),0);
  now+=5000;paint();assert.equal(spectrum.status,'unavailable');
});

test('Largeur réglable : coin inférieur gauche fixe, 20 kHz conservé et aucun débordement',()=>{
  let now=1000;const sandbox={performance:{now:()=>now},Float32Array};sandbox.globalThis=sandbox;
  vm.runInNewContext(readFileSync(new URL('../public/audio.js',import.meta.url),'utf8'),sandbox);
  for(const [width,height] of [[1920,1080],[1080,1920],[320,568]])for(const percent of [20,35,100]){
    const spectrum=sandbox.TransitAudio.createSpectrum(),canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
    const bands=Array(48).fill(0);bands[47]=1;spectrum.receive({status:'live',bands});now+=200;
    ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);spectrum.draw(ctx,width,height,percent);
    const span=Math.floor((width-40)*percent/100),end=20+span;
    assert.deepEqual([...ctx.getImageData(20,height-20,1,1).data],[16,35,30,255]);
    const right=ctx.getImageData(end,height-100,width-end,100).data;
    assert.ok(right.every((v,i)=>i%4===3||v===0),`overflow ${width}/${percent}`);
    const treble=ctx.getImageData(Math.max(20,end-30),height-90,Math.min(30,span),65).data;
    assert.ok(treble.some((v,i)=>i%4===0&&v>80),`20 kHz missing ${width}/${percent}`);
  }
});
