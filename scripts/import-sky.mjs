import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile} from 'node:fs/promises';
const image=await loadImage(process.argv[2]),input=createCanvas(image.width,image.height),c=input.getContext('2d');c.drawImage(image,0,0);
const data=c.getImageData(0,0,image.width,image.height);
for(let i=0;i<data.data.length;i+=4)if(Math.max(...data.data.subarray(i,i+3))<30)data.data[i+3]=0;
c.putImageData(data,0,0);
const out=createCanvas(6*48,32),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;
const sw=Math.floor(image.width/3),sh=Math.floor(image.height/2);
for(let n=0;n<6;n++){
  const col=n%3,row=Math.floor(n/3);let l=sw,t=sh,r=0,b=0;
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data.data[((row*sh+y)*image.width+col*sw+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
  const scale=Math.min(44/(r-l+1),28/(b-t+1)),w=Math.round((r-l+1)*scale),h=Math.round((b-t+1)*scale);
  ctx.drawImage(input,col*sw+l,row*sh+t,r-l+1,b-t+1,n*48+Math.floor((48-w)/2),Math.floor((32-h)/2),w,h);
}
await writeFile('public/assets/props/sky-v1.png',out.toBuffer('image/png'));
