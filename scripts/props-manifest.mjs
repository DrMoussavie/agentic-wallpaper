import {createCanvas,loadImage} from '@napi-rs/canvas';
import {writeFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),props={};
for(const name of ['grass','flowers','stones','house']){
  let file=`assets/props/${name}-v2.png`;try{await access(path.join(root,'public',file));}catch{file=`assets/props/${name}-v1.png`;}
  const image=await loadImage(path.join(root,'public',file)),c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  let left=c.width,top=c.height,right=0,bottom=0,transparent=0;
  for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=data[(y*c.width+x)*4+3];if(a===0)transparent++;if(a>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
  if(transparent/(c.width*c.height)<.3)throw new Error(`${name}: fond opaque ou faux damier, image refusee`);
  props[name]={file,crop:[left,top,right-left+1,bottom-top+1]};console.log(`${name}: ${c.width}x${c.height}, alpha nul ${Math.round(transparent/(c.width*c.height)*100)}%, cadrage ${props[name].crop.join(',')}`);
}
await writeFile(path.join(root,'public/props.js'),`/* Generated images, original alpha retained. Crops only remove empty margins when drawing. */\nglobalThis.TransitProps=${JSON.stringify(props,null,2)};\n`);
await writeFile(path.join(root,'public/assets/props/manifest.json'),JSON.stringify(props,null,2)+'\n');
