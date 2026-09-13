import { createCanvas } from '@napi-rs/canvas';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import '../public/animations.js';
import '../public/gestures.js';
import '../public/rig.js';
import '../public/sheets.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assets=path.join(root,'public/assets');
const specs=Object.values(globalThis.TransitAnimations.ACTIONS);const index={model:'agent-transit-model-01',families:{},generatedAt:new Date().toISOString()};
await mkdir(path.join(assets,'sprites'),{recursive:true});
let files=0;
for(const family of ['codex','claude']){
  const folder=path.join(assets,'animations',family);await mkdir(folder,{recursive:true});index.families[family]=[];
  for(const a of specs){
    const board=globalThis.TransitSheets.sheet(createCanvas,a.id,family);await writeFile(path.join(folder,`${a.id}.png`),board.toBuffer('image/png'));files++;
    const frames=24,w=96,h=80,strip=createCanvas(w*frames,h),ctx=strip.getContext('2d');
    for(let i=0;i<frames;i++)globalThis.TransitSprites.robot(ctx,i*w+38,61,family,a.id,a.duration*i/frames);
    await writeFile(path.join(folder,`${a.id}-sprites.png`),strip.toBuffer('image/png'));files++;
    const manifest={model:index.model,provider:family,action:a.id,name:a.name,duration:a.duration,frames,cellWidth:w,cellHeight:h,origin:{x:38,y:61},steps:a.steps};
    await writeFile(path.join(folder,`${a.id}.json`),JSON.stringify(manifest,null,2)+'\n');
    index.families[family].push({id:a.id,name:a.name,board:`animations/${family}/${a.id}.png`,sprites:`animations/${family}/${a.id}-sprites.png`,manifest:`animations/${family}/${a.id}.json`});
  }
  const atlas=globalThis.TransitSheets.atlas(createCanvas,family);await writeFile(path.join(assets,'sprites',`${family}.png`),atlas.canvas.toBuffer('image/png'));files++;await writeFile(path.join(assets,'sprites',`${family}.json`),JSON.stringify(atlas.manifest,null,2)+'\n');
}
await writeFile(path.join(assets,'index.json'),JSON.stringify(index,null,2)+'\n');
const model=createCanvas(900,400),ctx=model.getContext('2d');ctx.fillStyle='#071015';ctx.fillRect(0,0,900,400);ctx.fillStyle='#e4edec';ctx.font='22px sans-serif';ctx.fillText('MODÈLE 01 / identité commune à toutes les animations',35,42);globalThis.TransitSprites.robot(ctx,260,285,'codex','idle',0,{scale:6});globalThis.TransitSprites.robot(ctx,650,285,'claude','idle',0,{scale:6});ctx.font='16px monospace';ctx.fillStyle='#73d8e8';ctx.fillText('CODEX / BLANC / 1 ANTENNE',135,340);ctx.fillStyle='#edb56d';ctx.fillText('CLAUDE / SOMBRE / 2 ANTENNES',510,340);await writeFile(path.join(assets,'model-01.png'),model.toBuffer('image/png'));
console.log(`${files+1} PNG exportés : 44 planches, 44 bandes de 24 sprites, 2 atlas et 1 fiche de modèles.`);
console.log('Dossier : '+assets);
