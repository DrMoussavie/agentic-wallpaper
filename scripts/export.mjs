import { mkdir,copyFile,writeFile,cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dest=path.join(root,'dist/wallpaper');
await mkdir(dest,{recursive:true});
for(const file of ['wallpaper.html','animations.js','gestures.js','rig.js','world.js','props.js','life.js','audio.js','media.js','pet-guide.js','toy.js','visitors.js','free-renderer.js','app.js','icon.svg'])await copyFile(path.join(root,'public',file),path.join(dest,file));
await mkdir(path.join(dest,'assets'),{recursive:true});
await cp(path.join(root,'public/assets/props'),path.join(dest,'assets/props'),{recursive:true});
await copyFile(path.join(root,'public/assets/model-01.png'),path.join(dest,'preview.png'));
// Property labels are localization tokens (ui_*): Wallpaper Engine shows the user's Steam language, English otherwise.
const properties={
  tubes:{order:2,text:'ui_tubes',type:'bool',value:true},
  pet:{order:3,text:'ui_pet',type:'bool',value:true},
  pixelscale:{order:4,text:'ui_pixelscale',type:'combo',value:1,options:[{label:'ui_scale_mini',value:.75},{label:'ui_scale_small',value:1},{label:'ui_scale_large',value:1.4}]},
  background:{order:5,text:'ui_background',type:'combo',value:0,options:[{label:'ui_bg_black',value:0},{label:'ui_bg_night',value:1},{label:'ui_bg_grid',value:2}]},
  roam:{order:6,text:'ui_roam',type:'bool',value:true},
  social:{order:7,text:'ui_social',type:'bool',value:true},
  audio:{order:8,text:'ui_audio',type:'bool',value:true},
  bubbles:{order:9,text:'ui_bubbles',type:'bool',value:true},
  toy:{order:10,text:'ui_toy',type:'bool',value:true},
  bubbleScale:{order:11,text:'ui_bubblescale',type:'combo',value:1.4,options:[{label:'ui_bubble_small',value:1},{label:'ui_bubble_readable',value:1.4},{label:'ui_bubble_large',value:1.8}]},
  audioWidth:{order:12,text:'ui_audiowidth',type:'slider',value:35,min:20,max:100,step:5,precision:0},
  media:{order:13,text:'ui_media',type:'bool',value:true},
  bottomMargin:{order:14,text:'ui_bottommargin',type:'slider',value:80,min:0,max:200,step:4,precision:0},
  audioSource:{order:15,text:'ui_audiosource',type:'combo',value:'relay',options:[{label:'ui_audio_relay',value:'relay'},{label:'ui_audio_native',value:'wallpaper-engine'}]},
  hoop:{order:16,text:'ui_hoop',type:'bool',value:true},
  visitors:{order:17,text:'ui_visitors',type:'bool',value:true}
};
const localization={
  'en-us':{
    ui_tubes:'Data conduits',ui_pet:'Guide dog (flags waits and errors)',ui_pixelscale:'Character size',ui_scale_mini:'Miniature',ui_scale_small:'Small',ui_scale_large:'Larger',
    ui_background:'Background',ui_bg_black:'Absolute black',ui_bg_night:'Night blue',ui_bg_grid:'Micro-dots',
    ui_roam:'Idle robots wander around',ui_social:'Decorative meetings and click reactions',ui_audio:'PC sound spectrum',ui_bubbles:'Small speech bubbles',ui_toy:'Ball to throw (the dog puts it away)',
    ui_bubblescale:'Bubble size',ui_bubble_small:'Small',ui_bubble_readable:'Readable',ui_bubble_large:'Large',
    ui_audiowidth:'Spectrum width (%)',ui_media:'Track title and artist',ui_bottommargin:'Bottom margin / taskbar (px)',
    ui_audiosource:'Spectrum source',ui_audio_relay:'40 Hz–20 kHz bands (local relay)',ui_audio_native:'Native WE audio (decorative, no relay)',
    ui_hoop:'Roaming basketball hoop (robots and ball)',ui_visitors:'Butterflies by day, fireflies at night'
  },
  'fr-fr':{
    ui_tubes:'Conduits de données',ui_pet:'Chien guide (attentes et erreurs)',ui_pixelscale:'Taille des personnages',ui_scale_mini:'Miniatures',ui_scale_small:'Petits',ui_scale_large:'Plus grands',
    ui_background:'Fond',ui_bg_black:'Noir absolu',ui_bg_night:'Bleu nuit',ui_bg_grid:'Micro-points',
    ui_roam:'Promenades des agents disponibles',ui_social:'Rencontres décoratives et réactions au clic',ui_audio:'Spectre du son du PC',ui_bubbles:'Petites bulles en anglais',ui_toy:'Balle à lancer (le chien la range)',
    ui_bubblescale:'Taille des bulles',ui_bubble_small:'Petites',ui_bubble_readable:'Lisibles',ui_bubble_large:'Grandes',
    ui_audiowidth:'Largeur du spectre (%)',ui_media:'Titre et artiste de la musique',ui_bottommargin:'Marge basse / barre des tâches (px)',
    ui_audiosource:'Source du spectre',ui_audio_relay:'Fréquences 40 Hz–20 kHz (relais local)',ui_audio_native:'Audio natif WE (décoratif, sans relais)',
    ui_hoop:'Panier de basket itinérant (robots et balle)',ui_visitors:'Papillons le jour, lucioles la nuit'
  }
};
await writeFile(path.join(dest,'project.json'),JSON.stringify({title:'Agentic Wallpaper',description:'A live pixel-art garden where your local Claude Code and Codex sessions are little robots. Decor, dog, ball, hoop and native audio work on their own; real agents need the free local relay: github.com/DrMoussavie/agentic-wallpaper',type:'web',file:'wallpaper.html',preview:'preview.png',general:{properties,localization,supportsaudioprocessing:true}},null,2)+'\n');
await writeFile(path.join(dest,'INSTALLATION.txt'),`AGENTIC WALLPAPER — WALLPAPER ENGINE
https://github.com/DrMoussavie/agentic-wallpaper

WHAT WORKS RIGHT AWAY
The garden, the house, the guide dog, the ball, the basketball hoop, butterflies
and fireflies, and the native audio spectrum. Every visual setting is in the
wallpaper properties panel (right side of Wallpaper Engine). Labels follow your
Steam language (English by default, French available).

INSTALL
Copy this folder to projects\myprojectsgent-transit inside your Wallpaper
Engine folder, then pick "Agentic Wallpaper" in the Installed tab.

REAL AGENTS (CLAUDE CODE AND CODEX)
The robots are your real local sessions. They need the free local relay and
the agent hooks, which a wallpaper cannot install by itself:
  https://github.com/DrMoussavie/agentic-wallpaper  (see docs/INSTALL-WALLPAPER-ENGINE.md,
  or paste the install prompt from the README into Claude Code or Codex).
Without the relay no fake agents are shown; the wallpaper says how to connect.
Clicking the title or the link in the wallpaper opens the repository.

AUDIO
By default the spectrum uses the relay: 48 log bands, 40 Hz–20 kHz, Hz labels.
Without the relay set "Spectrum source" to "Native WE audio" — decorative,
no Hz calibration. A lost relay shows a disconnection instead of guessing.

MUSIC
Track title and artist come from Windows media sessions. Enable media
integration in Wallpaper Engine settings and use a player that reports to it.

PRIVACY
The relay listens on 127.0.0.1 only. Prompts, messages and commands are never
sent to the wallpaper — only the kind of activity. No model API, no API key.
`);
console.log('Fond exporté : '+dest);
