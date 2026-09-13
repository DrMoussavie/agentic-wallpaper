import { mkdir,copyFile,writeFile,cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dest=path.join(root,'dist/wallpaper');
await mkdir(dest,{recursive:true});
for(const file of ['wallpaper.html','animations.js','gestures.js','rig.js','world.js','props.js','life.js','audio.js','media.js','pet-guide.js','toy.js','visitors.js','free-renderer.js','app.js','icon.svg'])await copyFile(path.join(root,'public',file),path.join(dest,file));
await mkdir(path.join(dest,'assets'),{recursive:true});
await cp(path.join(root,'public/assets/props'),path.join(dest,'assets/props'),{recursive:true});
await copyFile(path.join(root,'public/assets/model-01.png'),path.join(dest,'preview.png'));
const properties={tubes:{order:2,text:'Conduits de données',type:'bool',value:true},pet:{order:3,text:'Chien guide (attentes et erreurs)',type:'bool',value:true},pixelscale:{order:4,text:'Taille des personnages',type:'combo',value:1,options:[{label:'Miniatures',value:.75},{label:'Petits',value:1},{label:'Plus grands',value:1.4}]},background:{order:5,text:'Fond',type:'combo',value:0,options:[{label:'Noir absolu',value:0},{label:'Bleu nuit',value:1},{label:'Micro-points',value:2}]}};
properties.roam={order:6,text:'Promenades des agents disponibles',type:'bool',value:true};
properties.social={order:7,text:'Rencontres décoratives et réactions au clic',type:'bool',value:true};
properties.bubbles={order:9,text:'Petites bulles en anglais',type:'bool',value:true};
properties.toy={order:10,text:'Balle à lancer (le chien la range)',type:'bool',value:true};
properties.hoop={order:16,text:'Panier de basket itinérant (robots et balle)',type:'bool',value:true};
properties.visitors={order:17,text:'Papillons le jour, lucioles la nuit',type:'bool',value:true};
properties.bubbleScale={order:11,text:'Taille des bulles',type:'combo',value:1.4,options:[{label:'Petites',value:1},{label:'Lisibles',value:1.4},{label:'Grandes',value:1.8}]};
properties.media={order:13,text:'Titre et artiste de la musique',type:'bool',value:false};
properties.bottomMargin={order:14,text:'Marge basse / barre des tâches (px)',type:'slider',value:80,min:0,max:200,step:4,precision:0};
properties.audioSource={order:15,text:'Source du spectre',type:'combo',value:'relay',options:[{label:'Fréquences 40 Hz–20 kHz (relais local)',value:'relay'},{label:'Audio natif WE (décoratif, sans relais)',value:'wallpaper-engine'}]};
properties.audioWidth={order:12,text:'Largeur du spectre (%)',type:'slider',value:35,min:20,max:100,step:5,precision:0};
properties.audio={order:8,text:'Spectre du son du PC',type:'bool',value:true};
await writeFile(path.join(dest,'project.json'),JSON.stringify({title:'Agentic Wallpaper',description:'Un laboratoire pixel art adaptatif pour les sessions locales Codex et Claude Code. Nécessite le pont Agent Transit pour les événements réels.',type:'web',file:'wallpaper.html',preview:'preview.png',general:{properties,supportsaudioprocessing:true}},null,2)+'\n');
await writeFile(path.join(dest,'INSTALLATION.txt'),`AGENT TRANSIT — WALLPAPER ENGINE

Le dossier contient le fond Web et ses ressources. Le décor, la balle, le chien
utilisent Wallpaper Engine directement. Le spectre précis utilise le relais local,
déjà lancé automatiquement sur le PC configuré. Un mode audio natif décoratif
sans relais reste sélectionnable dans les propriétés. Le mode démo a été supprimé.

Pour le créateur : placer ce dossier dans projects/myprojects/agent-transit de
Wallpaper Engine, puis sélectionner Agent Transit et choisir l’écran voulu.
Tous les réglages visuels sont dans les propriétés du fond : largeur du spectre,
taille des bulles et des personnages, titre/artiste, décor, conduits, chien, balle
et promenades.
Le spectre reste en bas à gauche, à 35 % de largeur par défaut (20 à 100 %).
Une marge basse de 80 px (réglable de 0 à 200 px) protège la barre des tâches.
Les textes sont dessinés à la résolution réelle de l’écran, même en grande taille.

Pour les abonnés au Workshop : s’abonner et appliquer le fond suffit pour les
fonctions autonomes. Aucun installateur n’est inclus ou exécuté par le fond.

VRAIS AGENTS CODEX ET CLAUDE
Le suivi des conversations nécessite le relais Agent Transit sur 127.0.0.1:49157
et les hooks configurés dans les applications. Le Workshop ne peut pas installer
ces composants ni lancer un programme local à votre place. Sans relais, aucun
faux agent n’apparaît. Si le relais est déjà lancé, le fond s’y connecte tout seul.

MUSIQUE
Le titre et l’artiste viennent des sessions multimédias Windows compatibles.
Activer l’intégration multimédia dans Wallpaper Engine. Aucun texte factice
n’est affiché en l’absence de titre ; cette API est absente du navigateur local.

AUDIO
Par défaut, Wallpaper Engine ET le navigateur utilisent le même flux WASAPI
du relais : 48 bandes logarithmiques de 40 Hz à 20 kHz, avec graduations Hz.
Aucun renforcement ni seconde conversion des valeurs. Une perte du relais
affiche une déconnexion ; elle ne bascule pas vers une autre analyse.
Option explicite : audio natif Wallpaper Engine, purement décoratif.
Les données natives n’ont pas de calibration Hz documentée : pas de graduations
Hz inventées dans Wallpaper Engine. Dégradé vertical vert, jaune, orange, rouge.

Jeu : cliquer pour sortir la balle, glisser-lâcher pour la lancer et la faire
rebondir avec le curseur. Après 4 s d’immobilité, le chien la range. Reprendre
la balle avant qu’il la touche annule sa récupération.
Un panier de basket apparaît à un endroit libre du jardin pendant environ
90 s, puis change de place. Marquer allonge sa visite. Les robots disponibles
vont eux-mêmes tirer de temps en temps ; tout événement réel interrompt le jeu.
La meilleure série est mémorisée localement par le fond.
Le jour, un papillon visite les fleurs et le chien le poursuit ; la nuit
(21 h – 7 h, heure du PC), des lucioles. Quand les graves du son du PC
montent quelques secondes, les robots au repos dansent et les fleurs vibrent.

Ce dossier est un export local, pas une publication Workshop déjà effectuée.
Guide : https://docs.wallpaperengine.io/en/web/first/gettingstarted.html
`);
console.log('Fond exporté : '+dest);
