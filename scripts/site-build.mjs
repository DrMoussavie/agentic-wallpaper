// Assemble the GitHub Pages site: the wallpaper files from public/ plus the
// landing page and demo driver from site/. Output goes to _site/ (ignored).
import { rm, mkdir, cp, copyFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dest=path.join(root,'_site');
await rm(dest,{recursive:true,force:true});await mkdir(path.join(dest,'assets'),{recursive:true});
for(const file of ['animations.js','gestures.js','rig.js','world.js','props.js','life.js','audio.js','media.js','pet-guide.js','toy.js','visitors.js','free-renderer.js','app.js','icon.svg'])await copyFile(path.join(root,'public',file),path.join(dest,file)).catch(e=>{if(e.code!=='ENOENT')throw e;console.warn('absent, ignoré :',file);});
await cp(path.join(root,'public/assets/props'),path.join(dest,'assets/props'),{recursive:true});
await cp(path.join(root,'public/assets/pet'),path.join(dest,'assets/pet'),{recursive:true});
await cp(path.join(root,'site'),dest,{recursive:true});
await copyFile(path.join(root,'public/sky-preview.html'),path.join(dest,'sky-preview.html'));
await cp(path.join(root,'docs/media'),path.join(dest,'media'),{recursive:true,force:true}).catch(()=>{});
await writeFile(path.join(dest,'.nojekyll'),'');
console.log('site assembled in _site/');
