import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile} from 'node:fs/promises';
const [input,name,w,h]=process.argv.slice(2),image=await loadImage(input);
if(!['entrance-v1','server-v1'].includes(name))throw new Error('Unknown prop');
const source=createCanvas(image.width,image.height),s=source.getContext('2d');s.drawImage(image,0,0);
const data=s.getImageData(0,0,image.width,image.height);let l=image.width,t=image.height,r=0,b=0;
for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){
  const i=(y*image.width+x)*4;
  if(Math.max(data.data[i],data.data[i+1],data.data[i+2])<25)data.data[i+3]=0;
  if(data.data[i+3]>128){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
}
s.putImageData(data,0,0);
const out=createCanvas(Number(w),Number(h)),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;
ctx.drawImage(source,l,t,r-l+1,b-t+1,0,0,Number(w),Number(h));
await writeFile('public/assets/props/'+name+'.png',out.toBuffer('image/png'));
console.log(name,w,h);
