(function(){
  const world=new TransitWorld.World();const canvas=document.getElementById('world');const renderer=TransitRenderer.createRenderer(canvas,world);
  const isStudio=!!document.getElementById('stage');let paused=false,enginePaused=false,fps=30,last=0,lastUi=0,source=null,resetBusy=false,lastRevision=null,verification=null;
  const q=id=>document.getElementById(id);
  function mode(){
    const value='live';
    if(source){source.close();source=null;}world.reset(value);renderer.clear?.();
    if(q('immersive'))q('immersive').href='wallpaper.html';
    {
      world.connection='connecting';const url=location.protocol==='file:'?'http://127.0.0.1:49157/stream':'/stream';
      source=new EventSource(url);
      source.onopen=()=>{world.connection='open';updateUi();};
      source.onerror=()=>{world.connection='offline';updateUi();};
      source.onmessage=message=>{try{const data=JSON.parse(message.data);if(data.kind==='snapshot'){world.restore(data,lastRevision!==null&&lastRevision===data.revision);verification=data.verification;if(lastRevision!==null&&lastRevision!==data.revision)renderer.clear();lastRevision=data.revision;}else if(data.kind==='event')world.apply(data.event);renderer.draw();updateUi();}catch{/* Ignore a malformed frame; EventSource keeps reconnecting. */}};
    }
    renderer.draw();updateUi();
  }
  function updateUi(){
    if(!isStudio)return;const list=q('activity-list');list.replaceChildren();
    q('mode-note').textContent=world.connection==='connecting'?'Connexion au relais local…':
      world.connection!=='open'?'Relais local déconnecté. Reconnexion automatique ; l’activité réelle est inconnue.':
      (world.events||world.agents.size)?'Activité réelle reçue. Les bulles représentent les actions, sans afficher les conversations.':
      'Relais connecté, mais aucun événement reçu. Dans l’app Codex, ouvre Paramètres → Hooks et approuve les entrées Agent Transit. Les sessions locales Claude Code utilisent aussi les hooks installés.';
    const visible=world.visible(),agents=[],visited=new Set();const add=a=>{if(visited.has(a.id))return;visited.add(a.id);agents.push(a);visible.filter(c=>c.parent===a.id).forEach(add);};visible.filter(a=>!a.parent||!world.agents.has(a.parent)).forEach(add);visible.forEach(add);
    const pop=world.population(),active=world.population(true);q('population-count').textContent=`${active.conversations} conversations actives · ${active.subagents} sous-agents actifs · ${pop.resting} au repos`;q('reset-agents').disabled=world.mode!=='live'||resetBusy;
    q('audio-note').textContent=({live:renderer.spectrum?.sourceKind==='wallpaper-engine'?'Son du PC · audio natif Wallpaper Engine':'Son du PC · 40 Hz à 20 kHz · analyse locale',connecting:'Connexion au son du PC…',paused:'Analyse audio en pause',disabled:'Spectre audio désactivé',unavailable:'Audio indisponible : vérifier le relais et le périphérique de sortie Windows.'})[renderer.spectrum?.status]||'';
    if(!agents.length){const p=document.createElement('p');p.className='empty';p.textContent=world.mode==='live'&&!world.events?'Aucune activité reçue. Cela ne signifie pas que tes agents sont arrêtés.':'La maison est prête pour les prochains agents.';list.append(p);}
    agents.forEach(a=>{const row=document.createElement('div');row.className='activity-row';const dot=document.createElement('i');dot.className=a.provider==='codex'?'cyan':'amber';const name=document.createElement('span');name.textContent=(a.parent?'↳ ':'')+a.name;if(a.parent)row.classList.add('subagent-row');const state=document.createElement('small');const phase=renderer.life.actors.get(a.id)?.phase;state.textContent=({home:'À la maison',returning:'Rentre à la maison',entering:'Entre à la maison',queued:'Dans la maison',leaving:'Sort de la maison',portal:'Sort du portail'})[phase]||TransitAnimations.ACTIONS[a.action]?.name||'Veille';row.append(dot,name,state);list.append(row);});
    q('event-count').textContent=`${world.events} événements`;if(verification?.lastCheckAt&&!resetBusy&&!q('reset-note').dataset.manual)q('reset-note').textContent=`Contrôle toutes les 60 s · ${verification.checked} états d’agents vérifiés${verification.unknown?` · ${verification.unknown} états suivis par hooks`:''}.`;
  }
  function syncAudio(){renderer.spectrum?.setSource(renderer.settings.audioSource);renderer.spectrum?.setVisible(!document.hidden&&!paused&&!enginePaused);renderer.spectrum?.setEnabled(renderer.settings.audio);renderer.media?.setEnabled(renderer.settings.media);}
  q('reset-agents')?.addEventListener('click',async()=>{
    if(resetBusy||world.mode!=='live')return;resetBusy=true;updateUi();const note=q('reset-note');note.dataset.manual='true';note.textContent='Vérification des états réels…';
    try{const response=await fetch('/agents/reset',{method:'POST',headers:{'X-Transit-Action':'reset'}});if(!response.ok)throw new Error();const result=await response.json();note.textContent=`Affichage reconstruit : ${result.population.conversations} conversations, ${result.population.subagents} sous-agents. Les états inconnus reviennent au prochain hook.`;}
    catch{note.textContent='Reset indisponible. Vérifie que le relais local est connecté, puis réessaie.';}
    finally{resetBusy=false;updateUi();}
  });
  q('pause')?.addEventListener('click',()=>{paused=!paused;if(paused)releasePointer(performance.now(),true);syncAudio();q('pause').textContent=paused?'▶ Reprendre':'Ⅱ Pause';});
  function preview(value){const formats={portrait:'9:16',landscape:'16:9',square:'1:1',wide:'21:9'};for(const id of Object.keys(formats)){q('stage')?.classList.toggle(id,value===id);q(id)?.classList.toggle('active',value===id);}if(q('dimensions'))q('dimensions').textContent=`${formats[value]||value} · espace procédural`;requestAnimationFrame(()=>{renderer.resize();renderer.draw();});}
  ['portrait','landscape','square','wide'].forEach(id=>q(id)?.addEventListener('click',()=>preview(id)));
  ['tubes','pet','roam','social','audio','media','bubbles','toy','hoop','visitors','background','audioSource','scale','bubbleScale'].forEach(id=>q(id)?.addEventListener('change',()=>{renderer.settings[id]=['tubes','pet','roam','social','audio','media','bubbles','toy','hoop','visitors'].includes(id)?q(id).checked:['scale','bubbleScale'].includes(id)?Number(q(id).value):q(id).value;syncAudio();renderer.resize();renderer.draw();}));
  q('audioWidth')?.addEventListener('input',()=>{renderer.settings.audioWidth=Math.max(20,Math.min(100,Number(q('audioWidth').value)||35));q('audio-width-value').value=renderer.settings.audioWidth+' %';renderer.draw();});
  q('bottomMargin')?.addEventListener('input',()=>{renderer.settings.bottomMargin=Math.max(0,Math.min(200,Number(q('bottomMargin').value)||0));q('bottom-margin-value').value=renderer.settings.bottomMargin+' px';renderer.resize();renderer.draw();});
  q('redistribute')?.addEventListener('click',()=>{renderer.clear();renderer.draw();});
  let capturedPointer=null;
  // Input probe for hosts that may not forward every mouse event (Wallpaper Engine): window.TransitDebugInput=true shows the last events on screen.
  if(window.TransitDebugInput){const probe=document.createElement('pre');probe.style.cssText='position:fixed;right:24px;top:40px;margin:0;padding:12px 16px;font:22px/1.3 monospace;color:#f1c76b;background:rgba(0,0,0,.75);z-index:9;pointer-events:none';document.body.append(probe);const seen={};const log=[];
    for(const type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','click','contextmenu'])window.addEventListener(type,e=>{seen[type]=(seen[type]||0)+1;if(type!=='pointermove'&&type!=='mousemove'){log.unshift(`${type} btn=${e.button} primary=${e.isPrimary} ptr=${e.pointerType||'-'} id=${e.pointerId??'-'} @${Math.round(e.clientX)},${Math.round(e.clientY)}`);log.length=Math.min(log.length,6);}probe.textContent=['INPUT PROBE',Object.entries(seen).map(([k,v])=>k+':'+v).join('  '),`held=${renderer.ball?.state} captured=${capturedPointer}`,...log].join('\n');},true);}
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0||!e.isPrimary||paused||enginePaused||capturedPointer!==null)return;
    const b=canvas.getBoundingClientRect();
    // performance.now() rather than e.timeStamp: injected events (Wallpaper Engine) may carry stale stamps.
    if(renderer.pointerDown(e.clientX-b.left,e.clientY-b.top,performance.now())){capturedPointer=e.pointerId;try{canvas.setPointerCapture(e.pointerId);}catch{}canvas.style.cursor='grabbing';}
    renderer.draw();
  });
  canvas.addEventListener('pointermove',e=>{if(!e.isPrimary||paused||enginePaused)return;const b=canvas.getBoundingClientRect();canvas.style.cursor=renderer.pointerMove(e.clientX-b.left,e.clientY-b.top,performance.now());});
  function releasePointer(stamp,cancel=false){renderer.pointerUp(stamp,cancel);try{if(capturedPointer!==null&&canvas.hasPointerCapture(capturedPointer))canvas.releasePointerCapture(capturedPointer);}catch{}capturedPointer=null;canvas.style.cursor='crosshair';}
  // Losing the pointer mid-flick still throws the ball: only a pause or a hidden page drops it.
  canvas.addEventListener('pointerup',e=>{if(e.pointerId===capturedPointer)releasePointer(performance.now());});
  canvas.addEventListener('pointercancel',e=>{if(e.pointerId===capturedPointer)releasePointer(performance.now());});
  canvas.addEventListener('lostpointercapture',e=>{if(e.pointerId===capturedPointer)releasePointer(performance.now());});
  canvas.addEventListener('pointerleave',()=>{if(capturedPointer===null)renderer.pointerUp(performance.now(),true);});
  window.addEventListener('mouseup',()=>{if(capturedPointer!==null)releasePointer(performance.now());});
  window.addEventListener('blur',()=>releasePointer(performance.now()));
  // Must be assigned synchronously for Wallpaper Engine's initial property callbacks.
  window.wallpaperPropertyListener={
    applyUserProperties(p){if(p.audioSource)renderer.settings.audioSource=p.audioSource.value==='wallpaper-engine'?'wallpaper-engine':'relay';for(const id of ['tubes','pet','roam','social','audio','media','bubbles','toy','hoop','visitors'])if(p[id])renderer.settings[id]=!!p[id].value;if(p.pixelscale)renderer.settings.scale=Number(p.pixelscale.value)||1;if(p.bubbleScale)renderer.settings.bubbleScale=Math.max(.75,Math.min(2,Number(p.bubbleScale.value)||1.4));if(p.audioWidth)renderer.settings.audioWidth=Math.max(20,Math.min(100,Number(p.audioWidth.value)||35));if(p.bottomMargin)renderer.settings.bottomMargin=Math.max(0,Math.min(200,Number(p.bottomMargin.value)||0));if(p.background)renderer.settings.background=['black','night','grid'][Number(p.background.value)]||'black';syncAudio();renderer.resize();renderer.draw();},
    applyGeneralProperties(p){if(Number.isFinite(Number(p.fps)))fps=Math.max(1,Math.min(60,Number(p.fps)));},
    setPaused(value){enginePaused=value;if(value)releasePointer(performance.now(),true);last=0;syncAudio();}
  };
  new ResizeObserver(()=>{renderer.resize();renderer.draw();}).observe(canvas);
  function frame(now){requestAnimationFrame(frame);if(!last)last=now;if(now-last<1000/fps)return;const dt=(now-last)/1000;last=now;if(enginePaused||document.hidden)return;if(!paused){world.update(dt);renderer.draw();}if(now-lastUi>500){updateUi();lastUi=now;}}
  syncAudio();renderer.resize();mode();requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)releasePointer(performance.now(),true);syncAudio();});
  window.addEventListener('pagehide',()=>{source?.close();renderer.spectrum?.close();renderer.media?.close();});
  window.TransitApp={world,renderer,setMode:mode,setPreview:preview,setPaused(value){paused=value;syncAudio();},advance(seconds){for(let t=0;t<seconds;t+=.1){world.update(Math.min(.1,seconds-t));renderer.draw();}updateUi();},snapshot(){return{mode:world.mode,connection:world.connection,events:world.events,time:world.time,agents:world.visible().map(a=>({name:a.name,action:a.action})),life:renderer.snapshot(),width:canvas.width,height:canvas.height,packets:world.packets.length};}};
})();
