import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';

test('Audio natif WE : une inscription, stéréo, pause, silence, fermeture et aucun relais audio',()=>{
  let callback,registrations=0,connections=0,now=1000;
  const scope={Float32Array,performance:{now:()=>now},wallpaperRegisterAudioListener(fn){callback=fn;registrations++;},EventSource:class{constructor(){connections++;}}};scope.globalThis=scope;
  vm.runInNewContext(readFileSync(new URL('../public/audio.js',import.meta.url),'utf8'),scope);
  const audio=scope.TransitAudio.createSpectrum();audio.setSource('wallpaper-engine');audio.setEnabled(true);audio.setVisible(true);
  assert.equal(registrations,1);assert.equal(connections,0);assert.equal(audio.sourceKind,'wallpaper-engine');
  const samples=Array(128).fill(0);samples[127]=2;callback(samples);assert.equal(audio.level,1);
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');now+=200;audio.draw(ctx,1920,1080,35);
  const pixels=ctx.getImageData(640,990,38,65).data;assert.ok(pixels.some((v,i)=>i%4===0&&v>80),'right-channel high frequencies rendered');
  audio.setVisible(false);callback(samples);assert.equal(audio.status,'paused');assert.equal(audio.level,null);
  audio.setVisible(true);assert.equal(registrations,1);callback(Array(128).fill(0));assert.equal(audio.level,0);
  const invalid=Array(128).fill(NaN);invalid[0]=-4;callback(invalid);assert.equal(audio.level,0);
  audio.setEnabled(false);callback(samples);assert.equal(audio.status,'disabled');
  audio.setEnabled(true);callback(samples);assert.equal(audio.level,1);now+=4000;assert.equal(audio.status,'unavailable');
  audio.close();callback(samples);assert.equal(audio.level,null);assert.equal(connections,0);
});

