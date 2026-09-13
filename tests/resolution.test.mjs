import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas} from '@napi-rs/canvas';
import '../public/animations.js';import '../public/gestures.js';import '../public/rig.js';import '../public/world.js';import '../public/life.js';import '../public/audio.js';import '../public/media.js';import '../public/free-renderer.js';

test('Résolution native, texte agrandi et spectre au-dessus de la barre des tâches sur les deux écrans',()=>{
  const oldDpr=globalThis.devicePixelRatio;let onTrack;
  globalThis.wallpaperRegisterMediaPropertiesListener=fn=>{onTrack=fn;};
  try{
    for(const [width,height,dpr,scale] of [[3440,1440,1,1.4],[1080,1920,1,1.4],[1720,720,2,1.4],[864,1536,1.25,1.4],[1920,1080,1.5,1]]){
      globalThis.devicePixelRatio=dpr;
      const world=new TransitWorld.World();world.reset('live');world.connection='open';
      const canvas=createCanvas(1,1);canvas.getBoundingClientRect=()=>({width,height});
      const r=TransitRenderer.createRenderer(canvas,world);r.settings.scale=scale;r.settings.bubbleScale=1.8;r.settings.pet=false;r.settings.media=true;r.media.setEnabled(true);
      onTrack({title:'Tom Misch & Yussef Dayes - Last 100',artist:'Tom Misch'});
      r.resize();r.spectrum.receive({status:'live',bands:Array(48).fill(.8)});r.draw();
      assert.equal(canvas.width,Math.round(width*dpr));assert.equal(canvas.height,Math.round(height*dpr));
      const ctx=canvas.getContext('2d'),raster=r.snapshot().raster,transform=ctx.getTransform();
      assert.equal(transform.a,canvas.width/raster.worldWidth);assert.equal(transform.d,canvas.height/raster.worldHeight);
      const baseline=(raster.contentHeight-20)*transform.d,taskbarTop=(height-48)*dpr;
      assert.ok(baseline<taskbarTop-12*dpr,'baseline remains above 48px taskbar');
      const x=Math.round(22*transform.a),y=Math.round(baseline-20*transform.d),w=Math.max(1,Math.floor(200*transform.a)),h=Math.floor(20*transform.d);
      const pixels=ctx.getImageData(x,y,w,h).data;assert.ok(pixels.some((v,i)=>i%4===0&&v>80),'bars present inside visible work area');
      assert.ok(r.life.bounds.bottom<raster.contentHeight-60,'garden stays above audio and music');
      // Resizing does not resize the backing store to the small logical scene again.
      r.resize();assert.equal(canvas.width,Math.round(width*dpr));
    }
  }finally{globalThis.devicePixelRatio=oldDpr;delete globalThis.wallpaperRegisterMediaPropertiesListener;}
});
