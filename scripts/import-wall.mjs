import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile} from 'node:fs/promises';
const image=await loadImage(process.argv[2]),source=createCanvas(image.width,image.height),s=source.getContext('2d');
s.drawImage(image,0,0);const pixels=s.getImageData(0,0,image.width,image.height).data;
// Remove the generator's empty margins, retaining only the full-width wall.
const rows=[];
for(let y=0;y<image.height;y++){
  let opaque=0;
  for(let x=0;x<image.width;x++){const i=(y*image.width+x)*4;if(pixels[i+3]>200&&Math.max(pixels[i],pixels[i+1],pixels[i+2])>35)opaque++;}
  if(opaque>image.width*.95)rows.push(y);
}
if(!rows.length)throw new Error('No full-width wall in input');
const tile=createCanvas(96,20),t=tile.getContext('2d');t.imageSmoothingEnabled=false;
t.drawImage(source,0,rows[0],image.width,rows.at(-1)-rows[0]+1,0,0,96,20);
// Mirror-wrap the generated strip: both repeat boundaries are pixel-identical.
const out=createCanvas(192,20),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;
ctx.drawImage(tile,0,0);ctx.save();ctx.translate(192,0);ctx.scale(-1,1);ctx.drawImage(tile,0,0);ctx.restore();
await writeFile('public/assets/props/wall-v1.png',out.toBuffer('image/png'));
console.log('wall-v1.png: 192 x 20, seamless horizontal repeat');
