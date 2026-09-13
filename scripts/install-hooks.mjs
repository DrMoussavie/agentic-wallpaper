import { readFile,writeFile,mkdir,rename } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { HOOKS } from '../bridge/normalize.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function configureHooks(operation,{codexHome=process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),claudeHome=path.join(os.homedir(),'.claude'),backupRoot=path.join(root,'.local/backups')}={}){
  if(!['plan','install','remove'].includes(operation))throw new Error('Utiliser plan, install ou remove.');
  const script=path.join(root,'bridge/hook.mjs').replaceAll('\\','/');const changes=[];
  for(const [provider,folder,filename] of [['codex',codexHome,'hooks.json'],['claude',claudeHome,'settings.json']]){
    const target=path.join(folder,filename);let original='';try{original=await readFile(target,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
    const config=original?JSON.parse(original.replace(/^\uFEFF/,'')):{};
    if(config.hooks&&(!config.hooks||typeof config.hooks!=='object'||Array.isArray(config.hooks)))throw new Error(`Configuration de hooks ${provider} non reconnue.`);
    const command=`node "${script}" ${provider}`;const hooks=config.hooks||{};let count=0;
    for(const event of HOOKS[provider]){
      const existing=hooks[event]||[];if(!Array.isArray(existing))throw new Error(`Liste ${event} non reconnue.`);
      const cleaned=existing.map(group=>({...group,hooks:(group.hooks||[]).filter(h=>h.command!==command)})).filter(group=>group.hooks.length);
      if(operation!=='remove')cleaned.push({hooks:[{type:'command',command,timeout:2}]});
      if(cleaned.length)hooks[event]=cleaned;else delete hooks[event];count++;
    }
    config.hooks=hooks;if(!Object.keys(hooks).length)delete config.hooks;
    const updated=JSON.stringify(config,null,2)+'\n';
    const oldCanonical=original?JSON.stringify(JSON.parse(original.replace(/^\uFEFF/,''))):'{}';
    const changed=oldCanonical!==JSON.stringify(config);
    if(operation!=='plan'&&changed){
      await mkdir(folder,{recursive:true});await mkdir(backupRoot,{recursive:true});
      if(original)await writeFile(path.join(backupRoot,`${provider}-${Date.now()}-${randomUUID()}.json`),original,{mode:0o600});
      let current='';try{current=await readFile(target,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}
      if(current!==original)throw new Error(`Les paramètres ${provider} ont changé pendant l’installation. Aucune écriture effectuée pour ce fichier.`);
      const temp=target+`.transit-${randomUUID()}.tmp`;await writeFile(temp,updated,{mode:0o600});await rename(temp,target);
    }
    changes.push({provider,path:target,events:count,changed,operation});
  }
  return changes;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const operation=process.argv[2]||'plan';const results=await configureHooks(operation);for(const r of results)console.log(`${r.provider}: ${r.events} événements, ${r.changed?'mise à jour':'déjà configuré'} — ${r.path}`);if(operation==='install')console.log('Dans Codex : /hooks pour examiner et approuver les définitions. Relancer/reprendre les sessions concernées. Aucun contournement de confiance n’est activé.');}
  catch(error){console.error(error.message);process.exitCode=1;}
}
