import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createCanvas} from '@napi-rs/canvas';

test('Titre/artiste natifs : changement de morceau, pause, arrêt et textes longs bornés',()=>{
  let properties,status,playback;
  const scope={wallpaperRegisterMediaPropertiesListener(fn){properties=fn;},wallpaperRegisterMediaStatusListener(fn){status=fn;},wallpaperRegisterMediaPlaybackListener(fn){playback=fn;},wallpaperMediaIntegration:{PLAYBACK_PLAYING:1,PLAYBACK_PAUSED:2,PLAYBACK_STOPPED:3}};scope.globalThis=scope;
  vm.runInNewContext(readFileSync(new URL('../public/media.js',import.meta.url),'utf8'),scope);
  const media=scope.TransitMedia.createNowPlaying();assert.equal(media.visible,false);
  assert.equal(properties,undefined,'no WE media listener before the option is enabled');assert.equal(media.registered,false);
  media.setEnabled(true);assert.equal(media.registered,true);assert.equal(typeof properties,'function');assert.equal(media.visible,false);
  properties({title:'Galaxy',artist:'Alfa Mist'});playback({state:1});assert.equal(media.visible,true);
  for(const [width,height,percent] of [[1920,1080,35],[1080,1920,20],[320,568,20]]){
    const canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),drawn=[];
    const original=ctx.fillText.bind(ctx);ctx.fillText=(...args)=>{drawn.push(args[0]);original(...args);};
    properties({title:'A very long title '.repeat(50),artist:'Artist '.repeat(60)});media.draw(ctx,width,height,percent,true);
    assert.ok(drawn[0].endsWith('…'));assert.ok(drawn[0].length<512);
    const end=20+Math.floor((width-40)*percent/100);
    assert.ok(ctx.getImageData(end,0,width-end,height).data.every(v=>v===0),'text cannot escape spectrum width');
    properties({title:'Next song',artist:'Another artist'});media.draw(ctx,width,height,percent,false);
    if(width>320)assert.equal(drawn.at(-2),'Next song');
  }
  playback({state:2});assert.equal(media.visible,true);playback({state:3});assert.equal(media.visible,false);
  playback({state:1});assert.equal(media.visible,true);status({enabled:false});assert.equal(media.visible,false);
  properties({title:'Ignored while disabled'});status({enabled:true});assert.equal(media.visible,false);
  properties({title:'',artist:'Artist only'});assert.equal(media.visible,false);
  properties({title:'New track',artist:null});assert.equal(media.visible,true);
  media.setEnabled(false);assert.equal(media.visible,false);properties({title:'Ignored while option off'});assert.equal(media.visible,false);
  media.setEnabled(true);assert.equal(media.visible,false,'metadata cleared while off');properties({title:'Back',artist:'X'});assert.equal(media.visible,true);
  media.close();properties({title:'After closing'});assert.equal(media.visible,false);
});

test('Sans API multimédia, aucune métadonnée factice ni requête réseau',()=>{
  const scope={};scope.globalThis=scope;
  vm.runInNewContext(readFileSync(new URL('../public/media.js',import.meta.url),'utf8'),scope);
  const media=scope.TransitMedia.createNowPlaying();assert.equal(media.visible,false);
  media.setEnabled(true);assert.equal(media.registered,false);media.draw(null,1920,1080);media.close();
});
