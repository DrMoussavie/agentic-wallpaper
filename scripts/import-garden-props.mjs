// Import generated black-backed sprite art into compact game atlases.
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile} from 'node:fs/promises';
const [treeSource,hoopSource]=process.argv.slice(2);
const palette=['#7ea148','#426f3b','#a2b77b','#b66870','#685243','#ad8b64','#dedbc2','#46545d','#87938e','#ce8649'].map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
async function pack(source,cols,rows,cw,ch,name){
  const image=await loadImage(source),input=createCanvas(image.width,image.height),c=input.getContext('2d');c.drawImage(image,0,0);
  const data=c.getImageData(0,0,image.width,image.height);
  for(let i=0;i<data.data.length;i+=4)if(Math.max(...data.data.subarray(i,i+3))<28)data.data[i+3]=0;
  c.putImageData(data,0,0);
  const out=createCanvas(cols*rows*cw,ch),ctx=out.getContext('2d');ctx.imageSmoothingEnabled=false;
  const sw=Math.floor(image.width/cols),sh=Math.floor(image.height/rows);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    let l=sw,t=sh,r=0,b=0;
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(data.data[((row*sh+y)*image.width+col*sw+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
    const scale=Math.min((cw-2)/(r-l+1),(ch-2)/(b-t+1)),w=Math.round((r-l+1)*scale),h=Math.round((b-t+1)*scale);
    ctx.drawImage(input,col*sw+l,row*sh+t,r-l+1,b-t+1,(row*cols+col)*cw+Math.floor((cw-w)/2),ch-1-h,w,h);
  }
  const packed=ctx.getImageData(0,0,out.width,out.height);
  for(let i=0;i<packed.data.length;i+=4){
    if(packed.data[i+3]<128){packed.data[i+3]=0;continue;}
    const distance=c=>c.reduce((sum,v,k)=>sum+(v-packed.data[i+k])**2,0);
    packed.data.set(palette.reduce((a,b)=>distance(a)<distance(b)?a:b),i);packed.data[i+3]=255;
  }ctx.putImageData(packed,0,0);
  await writeFile('public/assets/props/'+name,out.toBuffer('image/png'));
}
await pack(treeSource,2,2,24,32,'trees-v2.png');
await pack(hoopSource,1,1,24,48,'hoop-v2.png');
