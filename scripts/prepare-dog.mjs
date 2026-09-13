// Prepare the generated atlas for the sprite renderer: key the neutral backdrop,
// trim each cell and align the paws. No per-frame texture work at runtime.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {mkdir,writeFile} from 'node:fs/promises';
const source=process.argv[2];
if(!source)throw Error('Usage: node scripts/prepare-dog.mjs <generated atlas.png>');
const image=await loadImage(source),input=createCanvas(image.width,image.height),ctx=input.getContext('2d');
ctx.drawImage(image,0,0);
const pixels=ctx.getImageData(0,0,image.width,image.height);
// Flood the background up to the closed charcoal silhouette, retaining grey fur.
const seen=new Uint8Array(image.width*image.height),queue=[];
for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++)
  if(x%256===0||y%256===0||x===image.width-1||y===image.height-1){const n=y*image.width+x;seen[n]=1;queue.push(n);}
for(let q=0;q<queue.length;q++){
  const n=queue[q],i=n*4;
  if(Math.max(...pixels.data.subarray(i,i+3))<25)continue;
  pixels.data[i+3]=0;
  const x=n%image.width,y=Math.floor(n/image.width);
  for(const next of [x>0?n-1:-1,x<image.width-1?n+1:-1,y>0?n-image.width:-1,y<image.height-1?n+image.width:-1])
    if(next>=0&&!seen[next]){seen[next]=1;queue.push(next);}
}
const palette=[[20,24,27],[145,146,139],[220,222,211],[63,72,79],[54,111,118]];
for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]){
  const c=palette.reduce((a,b)=>distance(b)<distance(a)?b:a);
  function distance(c){return c.reduce((sum,v,k)=>sum+(v-pixels.data[i+k])**2,0);}
  pixels.data.set(c,i);
}
ctx.putImageData(pixels,0,0);
const atlas=createCanvas(6*48,4*40),out=atlas.getContext('2d');
out.imageSmoothingEnabled=false;
for(let row=0;row<4;row++)for(let col=0;col<6;col++){
  const x0=col*256,y0=row*256;let left=256,top=256,right=0,bottom=0;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
    if(pixels.data[((y0+y)*image.width+x0+x)*4+3]>128){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
  }
  const width=right-left+1,height=bottom-top+1,scale=.12;
  const w=Math.round(width*scale),h=Math.round(height*scale);
  out.drawImage(input,x0+left,y0+top,width,height,col*48+Math.round((48-w)/2),row*40+38-h,w,h);
}
const packed=out.getImageData(0,0,atlas.width,atlas.height);
for(let i=0;i<packed.data.length;i+=4){
  if(packed.data[i+3]<128){packed.data[i+3]=0;continue;}
  const distance=c=>c.reduce((sum,v,k)=>sum+(v-packed.data[i+k])**2,0);
  packed.data.set(palette.reduce((a,b)=>distance(b)<distance(a)?b:a),i);packed.data[i+3]=255;
}
out.putImageData(packed,0,0);
await mkdir('public/assets/pet',{recursive:true});
await writeFile('public/assets/pet/puppy-v2.png',atlas.toBuffer('image/png'));
console.log('Saved 24 aligned frames: public/assets/pet/puppy-v2.png');
