import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {fileURLToPath} from 'node:url';
test('Le muret généré raccorde ses deux bords pixel pour pixel',async()=>{
  const image=await loadImage(fileURLToPath(new URL('../public/assets/props/wall-v1.png',import.meta.url)));
  assert.equal(image.width,192);assert.equal(image.height,20);
  const canvas=createCanvas(192,20),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  assert.deepEqual(ctx.getImageData(0,0,1,20).data,ctx.getImageData(191,0,1,20).data);
  assert.deepEqual(ctx.getImageData(95,0,1,20).data,ctx.getImageData(96,0,1,20).data);
});
