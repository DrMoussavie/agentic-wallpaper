import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';

const code=readFileSync(new URL('../public/audio.js',import.meta.url),'utf8');
function environment(native=false){
  let now=1000,callback;const streams=[];
  const scope={Float32Array,performance:{now:()=>now},location:{protocol:native?'file:':'http:'},EventSource:class{constructor(url){this.url=url;streams.push(this);}close(){this.closed=true;}}};
  if(native)scope.wallpaperRegisterAudioListener=fn=>{callback=fn;};scope.globalThis=scope;
  vm.runInNewContext(code,scope);const audio=scope.TransitAudio.createSpectrum();audio.setEnabled(true);
  return{audio,streams,tick(){now+=200;},get registered(){return callback!==undefined;},native(values){callback?.(values);}};
}

test('WE et navigateur : mêmes 48 bandes, mêmes pixels et graduations Hz, aucun mélange avec le natif',()=>{
  const browser=environment(),wallpaper=environment(true),bands=Array(48).fill(0);bands[8]=.64;bands[21]=.45;bands[42]=.12;
  const frame=JSON.stringify({status:'live',bands});
  const images=[];
  for(const env of [browser,wallpaper]){
    assert.equal(env.audio.sourceKind,'relay');env.streams[0].onmessage({data:frame});env.tick();
    const c=createCanvas(1920,1080),ctx=c.getContext('2d'),labels=[];
    const fill=ctx.fillText.bind(ctx);ctx.fillText=(text,...args)=>{labels.push(text);fill(text,...args);};
    env.audio.draw(ctx,1920,1080,35);images.push(c.toBuffer('image/png'));
    assert.ok(labels.includes('40 Hz')&&labels.includes('100')&&labels.includes('1k')&&labels.includes('5k')&&labels.includes('20k Hz'));
    assert.ok(!labels.includes('GRAVES'));assert.ok(Math.abs(env.audio.level-.64)<1e-6);
  }
  assert.equal(wallpaper.streams[0].url,'http://127.0.0.1:49157/audio/stream');assert.equal(browser.streams[0].url,'/audio/stream');
  assert.deepEqual(images[0],images[1],'identical data must produce identical spectrum');
  assert.equal(wallpaper.registered,false,'relay source never registers the native WE listener');assert.equal(wallpaper.audio.nativeRegistered,false);
  wallpaper.native(Array(128).fill(1));assert.ok(Math.abs(wallpaper.audio.level-.64)<1e-6,'native activity cannot amplify precise spectrum');
  wallpaper.streams[0].onerror();wallpaper.native(Array(128).fill(1));assert.equal(wallpaper.audio.status,'unavailable');assert.equal(wallpaper.audio.level,null);
  wallpaper.streams[0].onmessage({data:JSON.stringify({status:'live',bands:Array(48).fill(0)})});assert.equal(wallpaper.audio.level,0);
});

test('Changement explicite de source, pause et fermeture : pas de flux doublé ni de trame périmée',()=>{
  const env=environment(true),first=env.streams[0];
  assert.equal(env.registered,false);env.audio.setSource('wallpaper-engine');assert.equal(first.closed,true);assert.equal(env.registered,true,'native listener registered on explicit selection only');
  env.native(Array(128).fill(.2));assert.ok(Math.abs(env.audio.level-.2)<1e-6);
  first.onmessage({data:JSON.stringify({status:'live',bands:Array(48).fill(1)})});assert.ok(Math.abs(env.audio.level-.2)<1e-6);
  env.audio.setSource('relay');const second=env.streams[1];assert.equal(env.audio.status,'connecting');
  env.audio.setSource('relay');env.audio.setEnabled(true);assert.equal(env.streams.length,2);
  env.audio.setVisible(false);assert.equal(second.closed,true);env.native(Array(128).fill(1));assert.equal(env.audio.level,null);
  env.audio.setVisible(true);assert.equal(env.streams.length,3);env.audio.close();assert.equal(env.streams[2].closed,true);
  env.streams[2].onmessage({data:JSON.stringify({status:'live',bands:Array(48).fill(1)})});assert.equal(env.audio.level,null);
});
