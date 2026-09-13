import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {createCanvas} from '@napi-rs/canvas';

test('Les propriétés Wallpaper Engine commandent le vrai rendu sans réinitialiser les autres réglages',()=>{
  const canvas=createCanvas(1920,1080);canvas.getBoundingClientRect=()=>({width:1920,height:1080,left:0,top:0});canvas.addEventListener=()=>{};canvas.style={};
  const sandbox={URLSearchParams,Float32Array,performance:{now:()=>1000},location:{search:'?mode=demo&agents=20',protocol:'file:'},document:{hidden:false,getElementById:id=>id==='world'?canvas:null,addEventListener(){}},requestAnimationFrame(){},ResizeObserver:class{observe(){}},EventSource:class{close(){}},addEventListener(){}};
  sandbox.globalThis=sandbox;sandbox.window=sandbox;
  const html=readFileSync(new URL('../public/wallpaper.html',import.meta.url),'utf8');
  for(const [,file] of html.matchAll(/<script src="([^"]+)"/g))vm.runInNewContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),sandbox,{filename:file});
  const apply=sandbox.wallpaperPropertyListener.applyUserProperties,settings=sandbox.TransitApp.renderer.settings;
  apply({audioWidth:{value:30},bubbleScale:{value:'1.8'},tubes:{value:false},pet:{value:true},labels:{value:true}});
  assert.equal(settings.audioWidth,30);assert.equal(settings.bubbleScale,1.8);assert.equal(settings.tubes,false);assert.equal(settings.pet,true);assert.equal(settings.labels,undefined);
  apply({bottomMargin:{value:120}});assert.equal(settings.bottomMargin,120);
  apply({bottomMargin:{value:0}});assert.equal(settings.bottomMargin,0);
  apply({bottomMargin:{value:999}});assert.equal(settings.bottomMargin,200);
  apply({bottomMargin:{value:80}});
  apply({audioWidth:{value:75}});assert.equal(settings.audioWidth,75);assert.equal(settings.pet,true);assert.equal(settings.bubbleScale,1.8);
  apply({audioWidth:{value:1000}});assert.equal(settings.audioWidth,100);
  apply({demopopulation:{value:12},demomode:{value:true}});assert.equal(sandbox.TransitApp.world.mode,'live');assert.equal(sandbox.TransitApp.world.agents.size,0);sandbox.TransitApp.advance(120);assert.equal(sandbox.TransitApp.world.agents.size,0);
});
