(function(root){
  const {robot,pet,colors}=root.TransitSprites,{atPath}=root.TransitWorld;
  const bubbles={arrive:'Hello, world!',idle:'What next?',walk:'Beep, beep!',think:'Hmm... got it?',read:'Page patrol!',search:'Clue hunting!',type:'Tap tap tap!',tool:'On it!',test:'Does it pass?',send:'Special delivery!',receive:'Fresh data!',spawn:'Calling backup!',wait:'Need a human!',error:'Uh-oh!',celebrate:'Ta-da!',compact:'Brain cleanup!',pause:'Time out!',sleep:'Zzz...',wake:'Rise and compile!',archive:'Home time!',clean:'Dust buster!',offline:'Signal lost...'};
  const variants={idle:['What next?','Snack break?','Still here!'],think:['Hmm...','Thinking cap on!','Brain.exe busy'],read:['Page patrol!','Plot twist?','One more page!'],search:['Clue hunting!','Where is it?','Aha... maybe!'],type:['Tap tap tap!','Keyboard ninja!','Tiny fingers!'],tool:['On it!','Nuts and bolts!','Work in progress!'],test:['Does it pass?','Fingers crossed!','Science time!'],wait:['Need a human!','Your move!','A little help?'],error:['Uh-oh!','Well, that broke.','Plot twist!'],celebrate:['Ta-da!','All yours!','Mic drop!'],archive:['Clocking out!','Nap time!','Home, sweet home!'],receive:['Fresh data!','Ooh, mail!','Got it!'],compact:['Brain cleanup!','Squish the bits!'],walk:['Beep, beep!','Coming through!'],incoming:['Incoming!','New mission!','Oh, a prompt!']};
  function createRenderer(canvas,world){
    const ctx=canvas.getContext('2d',{alpha:false});let W=360,H=640,life=new root.TransitLife.Life(),previousTime=world.time,lastCount=-1;
    const settings={tubes:true,background:'black',scale:1,pet:true,roam:true,social:true,audio:true,audioSource:'relay',media:false,audioWidth:35,bottomMargin:80,bubbles:true,bubbleScale:1.4,toy:true},images={},packetPaths=new Map();
    let bubbleRects=[];const random=root.TransitLife.random(life.seed^0x7e5721);let nextChatter=8,quietSince=null;
    const spectrum=root.TransitAudio?.createSpectrum(),guide=root.TransitPet?new root.TransitPet.Guide():null;let lastFooter=-1,lastMediaVisible=false,contentHeight=640,bottomInset=0,lastDpr=1;let promptVisuals=[];
    const media=root.TransitMedia?.createNowPlaying();
    const ball=root.TransitToy?new root.TransitToy.Ball():null;let toyHintAt=0,toyHintUntil=0;
    const box=(x,y,w,h,c)=>{if(w<=0||h<=0)return;ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
    const text=(s,x,y,c='#71858e',size=5,align='left')=>{ctx.font=`${size}px monospace`;ctx.fillStyle=c;ctx.textAlign=align;ctx.fillText(s,Math.round(x),Math.round(y));ctx.textAlign='left';};
    const path=(pts,c,w=1)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineJoin='bevel';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(Math.round(p.x)+.5,Math.round(p.y)+.5):ctx.moveTo(Math.round(p.x)+.5,Math.round(p.y)+.5));ctx.stroke();};
    if(typeof Image!=='undefined')for(const [name,spec] of Object.entries(root.TransitProps||{})){const image=new Image();image.onload=()=>{images[name]=image;draw();};image.src=spec.file;}
    function prop(name,x,y,width,height){const image=images[name],spec=root.TransitProps?.[name];if(!image||!spec)return;const [sx,sy,sw,sh]=spec.crop;const h=height||width*sh/sw;ctx.drawImage(image,sx,sy,sw,sh,Math.round(x-width/2),Math.round(y-h),Math.round(width),Math.round(h));}
    function resize(){
      const b=canvas.getBoundingClientRect(),n=world.agents.size;
      // Smaller default: 33px on a 1080px short edge; 66px on a 1440px short edge.
      let scale=Math.max(1,Math.min(3,Math.floor(Math.min(b.width,b.height)/700*settings.scale)));
      while(scale>1&&(b.width/scale<260||b.height/scale<230))scale--;
      const width=Math.max(180,Math.floor(b.width/scale)),height=Math.max(180,Math.floor(b.height/scale));
      // World coordinates retain small sprites; rasterize text at the display's actual resolution.
      const dpr=Math.max(1,Number(root.devicePixelRatio)||1),pixelWidth=Math.max(1,Math.round(b.width*dpr)),pixelHeight=Math.max(1,Math.round(b.height*dpr));
      bottomInset=Math.min(height*.25,Math.max(0,Math.min(200,Number(settings.bottomMargin)||0))*height/Math.max(1,b.height));
      contentHeight=Math.floor(height-bottomInset);
      const footer=bottomInset+(spectrum&&settings.audio?Math.min(104,Math.floor(contentHeight*.13)+40):32)+(settings.media&&media?.visible?28:0);
      if(width!==W||height!==H||canvas.width!==pixelWidth||canvas.height!==pixelHeight||lastCount!==n||lastFooter!==footer){W=width;H=height;canvas.width=pixelWidth;canvas.height=pixelHeight;life.resize(W,H,n,footer);ball?.layout(life);packetPaths.clear();lastFooter=footer;}
      ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
      ctx.imageSmoothingEnabled=false;lastCount=n;lastDpr=dpr;lastMediaVisible=!!(settings.media&&media?.visible);
    }
    function speech(value,p,color='#cbdadc',alpha=1){
      if(!value)return;const fontSize=Math.round(6*Math.max(.75,Math.min(2,settings.bubbleScale))),height=fontSize+6;
      ctx.font=`${fontSize}px monospace`;const width=Math.ceil(ctx.measureText(value).width)+10,baseY=p.y-35-height;
      const candidates=[[p.x-width/2,baseY],[p.x-width/2,baseY-height-4],[p.x-width-12,baseY],[p.x+12,baseY]];
      let rect;
      for(const [cx,cy] of candidates){const q={x:Math.max(3,Math.min(W-width-3,cx)),y:Math.max(31,cy),w:width,h:height};
        if(!bubbleRects.some(b=>q.x<b.x+b.w+3&&q.x+q.w+3>b.x&&q.y<b.y+b.h+3&&q.y+q.h+3>b.y)){rect=q;break;}}
      if(!rect)return;bubbleRects.push(rect);const {x,y}=rect,tail=Math.max(x+3,Math.min(x+width-4,p.x));
      ctx.globalAlpha=alpha;box(x+1,y,width-2,height,'#10231f');box(x,y+1,width,height-2,color);box(tail,y+height,3,3,color);text(value,x+width/2,y+fontSize+2,'#122b35',fontSize,'center');ctx.globalAlpha=1;
    }
    function drawHouse(s){
      const house=s.house;prop('house',house.x,house.y,house.width,house.height);
      const opening=life.doorOpening||0,doorWidth=house.width*.195,doorHeight=house.height*.365;
      // These two sliding leaves sit precisely inside the generated open doorway.
      if(opening<1){const leaf=doorWidth/2*(1-opening);box(s.door.x-doorWidth/2,s.door.y-doorHeight,leaf,doorHeight,'#96aaa5');box(s.door.x+doorWidth/2-leaf,s.door.y-doorHeight,leaf,doorHeight,'#819a94');box(s.door.x-doorWidth/2,s.door.y-doorHeight,leaf,1,'#c1cdc0');box(s.door.x+doorWidth/2-leaf,s.door.y-doorHeight,leaf,1,'#c1cdc0');}
      const sleeping=[...life.actors.values()].filter(a=>a.phase==='home').length;if(sleeping){text(`z ${sleeping}`,house.x+house.width*.38,house.y-house.height*.62,'#abb793',5);}
      for(let y=s.door.y+6;y<s.gate.y;y+=7){box(s.door.x-8,y,16,3,'#1d2b29');box(s.door.x-7,y,14,1,'#3a4c45');}
    }
    function route(from,to){const y=life.scene.busY;return[{x:from.x,y:from.y-9},{x:from.x,y},{x:to.x,y},{x:to.x,y:to.y-9}];}
    function drawBall(){
      if(!settings.toy||!ball?.basket)return;const b=ball.basket;
      // A tiny toy box near the house, kept separate from the door path.
      box(b.x-9,b.y-6,18,8,'#253d35');box(b.x-10,b.y-8,20,3,'#638373');box(b.x-5,b.y-4,10,1,'#426052');
      if(ball.state==='hidden'){box(b.x-3,b.y-9,6,3,'#bca476');return;}
      const x=ball.x,y=ball.y;
      box(x-4,y-7,8,14,'#633e48');box(x-6,y-5,12,10,'#633e48');
      box(x-4,y-6,8,12,'#d28588');box(x-5,y-4,10,8,'#d28588');
      box(x-3,y-5,6,4,'#f1c8a5');box(x-4,y+2,8,3,'#ac657d');
      box(x-3+Math.round(Math.sin(ball.spin)*2),y-1,3,3,'#f4d3b0');
      if(ball.state==='free'&&ball.time>=toyHintAt){toyHintAt=ball.time+10+random()*7;toyHintUntil=ball.time+2.5;}
      if(settings.bubbles&&ball.state==='free'&&ball.time<toyHintUntil)speech('Grab me!',{x,y:y+24},'#e4c3aa');
    }
    function draw(){
      if(lastCount!==world.agents.size||lastMediaVisible!==!!(settings.media&&media?.visible)||lastDpr!==Math.max(1,Number(root.devicePixelRatio)||1))resize();const t=world.time,dt=Math.max(0,t-previousTime);previousTime=t;life.update(dt,world,settings);const s=life.scene;bubbleRects=[];
      ctx.globalAlpha=1;ctx.fillStyle=settings.background==='night'?'#03080c':'#000';ctx.fillRect(0,0,W,H);
      if(settings.background==='grid')for(let x=15;x<W;x+=28)for(let y=35;y<H;y+=28)box(x,y,1,1,'#0c171b');
      // The house anchors the upper left; its garden follows the available screen width.
      path([{x:s.left+6,y:s.busY+5},{x:s.right-8,y:s.busY+5}],'#18231f');
      for(let x=s.left+14;x<s.right-5;x+=13)box(x,s.busY+8,6,1,'#142019');
      for(const plant of s.plants)prop(plant.type,plant.x,plant.y,plant.width);
      spectrum?.draw(ctx,W,contentHeight,settings.audioWidth);
      if(settings.media)media?.draw(ctx,W,contentHeight,settings.audioWidth,settings.audio);
      const b=s.bench;box(b.x-14,b.y-9,29,3,'#8b9a87');box(b.x-12,b.y-5,25,3,'#586c5c');box(b.x-10,b.y-2,2,7,'#3b5144');box(b.x+9,b.y-2,2,7,'#3b5144');
      const terminal=s.terminal;box(terminal.x-6,terminal.y-22,13,19,'#a7b7b3');box(terminal.x-4,terminal.y-20,9,12,'#0f262c');box(terminal.x-2,terminal.y-17,5,1,'#80cbd1');box(terminal.x-2,terminal.y-14,3,1,'#688b7e');box(terminal.x-3,terminal.y-3,7,4,'#485e57');
      drawHouse(s);path([{x:terminal.x,y:terminal.y+1},{x:terminal.x,y:s.busY}],'#233930');
      const lookup=id=>id==='hub'||id==='dock'?s.hub:life.actors.get(id);
      const packets=world.packets.filter(p=>p.kind!=='agent'&&p.kind!=='prompt'&&p.kind!=='result'&&t>=p.start&&t<p.start+p.duration).slice(-3);
      for(const p of [...packetPaths.keys()])if(!world.packets.includes(p))packetPaths.delete(p);
      if(settings.tubes&&packets.length)path([{x:s.door.x,y:s.busY},{x:s.hub.x,y:s.busY}],'#314742');
      for(const packet of packets){
        const from=lookup(packet.from),to=lookup(packet.to);if(!from||!to||from.phase&&from.phase!=='outside'||to.phase&&to.phase!=='outside')continue;
        if(!packetPaths.has(packet))packetPaths.set(packet,route(from,to));const points=packetPaths.get(packet),q=(t-packet.start)/packet.duration,c=colors[packet.provider];
        if(settings.tubes){ctx.globalAlpha=Math.min(1,q*5,(1-q)*5)*.65;path(points,'#3c5d59');ctx.globalAlpha=1;const p=atPath(points,q);box(p.x-1,p.y-1,3,2,c);}
      }
      for(const ripple of life.ripples){const age=life.time-ripple.since,rad=4+age*9;ctx.globalAlpha=Math.max(0,1-age/2);path([{x:ripple.x-rad,y:ripple.y},{x:ripple.x,y:ripple.y-rad*.3},{x:ripple.x+rad,y:ripple.y},{x:ripple.x,y:ripple.y+rad*.3},{x:ripple.x-rad,y:ripple.y}],'#52786a');ctx.globalAlpha=1;}
      const ordered=life.outside().sort((a,b)=>a.y-b.y);
      const level=spectrum?.level;
      if(level!==null&&level!==undefined&&level<.12){quietSince??=life.time;}else quietSince=null;
      if(settings.bubbles&&world.connection!=='offline'&&life.time>=nextChatter){
        nextChatter=life.time+12+random()*10;
        const available=ordered.filter(a=>a.phase==='outside'&&!a.agent.resting&&!['wait','error','offline','receive','celebrate'].includes(a.agent.action)&&!world.packets.some(p=>p.kind==='prompt'&&p.to===a.id));
        if(available.length){const actor=available[Math.floor(random()*available.length)],loud=level!=null&&level>.66,quiet=quietSince!==null&&life.time-quietSince>10;
          const phrases=loud?['My circuits!','Easy on the bass!','That beat though!']:quiet?['Where’s the beat?','Did someone mute?','Tiny volume!']:['Listening...','Just one more bit.','Seriously, bits?'];
          actor.chatter={text:phrases[Math.floor(random()*phrases.length)],until:life.time+3.6,mood:loud?'grumpy':quiet?'listening':random()<.35?'grumpy':'listening'};
        }
      }
      for(const actor of ordered){const a=actor.agent,visual=life.visual(actor,world);const chatter=actor.chatter?.until>life.time&&!['wait','error','receive','celebrate','offline'].includes(visual.action)?actor.chatter:null;if(chatter)visual.mood=chatter.mood;box(actor.x-8,actor.y+2,17,2,'#101b18');
        ctx.save();if(actor.phase==='entering'){ctx.beginPath();const doorway=s.house.width*.2;ctx.rect(s.door.x-doorway/2,s.door.y-s.house.height*.38,doorway,s.house.height*.4);ctx.clip();ctx.globalAlpha=1-(visual.entering||0);}
        robot(ctx,actor.x,actor.y,a.provider,visual.action,visual.age,{...visual,free:true,scale:a.parent?.62:1,showMini:false});ctx.restore();
        const receiptAge=a.reaction?.kind==='prompt'?t-a.reaction.since:99;
        if(receiptAge>=0&&receiptAge<.8){
          const r=5+receiptAge*23;ctx.globalAlpha=1-receiptAge/.8;
          for(let i=0;i<8;i++){const angle=i*Math.PI/4;box(actor.x+Math.cos(angle)*r-1,actor.y-17+Math.sin(angle)*r-1,2,2,colors[a.provider]);}
          ctx.globalAlpha=1;
        }
        if(['outside','leaving','returning'].includes(actor.phase)){
          const urgent=['wait','error','offline'].includes(a.action)||visual.action==='offline';
          const incoming=world.packets.some(p=>p.kind==='prompt'&&p.to===a.id&&t>=p.start);
          const captionKey=urgent?(visual.action==='offline'?'offline':a.action):actor.phase==='returning'?'archive':incoming?'incoming':actor.phase==='leaving'?'arrive':visual.action;
          const cycle=Math.floor(life.time/12),stamp=captionKey+':'+cycle;
          if(actor.phraseStamp!==stamp){actor.phraseStamp=stamp;const choices=variants[captionKey]||[bubbles[captionKey]];actor.phrase=choices[Math.floor(random()*choices.length)];}
          const caption=urgent?actor.phrase:incoming?actor.phrase:visual.social?'Hey there!':chatter?chatter.text:visual.action==='receive'&&a.reaction?.kind==='prompt'?'New quest!':actor.phrase;
          if(actor.caption!==caption){actor.caption=caption;actor.captionSince=life.time;}
          const age=(life.time-actor.captionSince)%12;
          const displayCaption=caption==='Listening...'?`Listening${'.'.repeat([1,2,3,2,1][Math.floor(life.time*3)%5])}`:caption;
          if(settings.bubbles&&(urgent||incoming||chatter||age<4.5))speech(displayCaption,actor,a.action==='error'?'#e2ad9f':a.action==='wait'?'#ead1a4':'#c1d0c1',urgent?1:Math.max(0,Math.min(1,.35+age*4,(4.5-age)*3)));
        }
      }
      for(const e of life.encounters){if(e.started===null||e.kind!=='spark')continue;const [a,b]=e.ids.map(id=>life.actors.get(id));if(!a||!b)continue;const q=Math.max(0,Math.min(1,(life.time-e.started-1)/2.3));box(a.x+(b.x-a.x)*q-1,a.y-17-Math.sin(q*Math.PI)*6,2,2,'#c9daa0');}
      promptVisuals=[];
      for(const packet of world.packets.filter(p=>['prompt','result'].includes(p.kind)&&t>=p.start&&t<p.start+p.duration)){
        const returning=packet.kind==='result',actor=life.actors.get(returning?packet.from:packet.to);if(!actor)continue;
        const endpoint=['home','queued','entering'].includes(actor.phase)?{x:s.door.x,y:s.door.y-13}:{x:actor.x+6,y:actor.y-14};
        const points=[{x:s.terminal.x,y:s.terminal.y-14},{x:s.terminal.x,y:s.busY},{x:endpoint.x,y:s.busY},endpoint];
        if(returning)points.reverse();const progress=(t-packet.start)/packet.duration,eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2,c=colors[packet.provider],p=atPath(points,eased);
        if(settings.tubes){ctx.globalAlpha=Math.min(1,progress*8,(1-progress)*8);path(points,'#233a37',3);path(points,'#071511',1);ctx.globalAlpha=1;}
        for(let i=1;i<=9;i++){const trail=atPath(points,Math.max(0,eased-i*.012));ctx.globalAlpha=(10-i)*.08;box(trail.x-1,trail.y-1,i<4?3:2,2,c);}ctx.globalAlpha=1;
        const launch=1-Math.min(1,progress*7);if(launch>0){const r=4+(1-launch)*14,start=points[0];ctx.globalAlpha=launch;for(let i=0;i<4;i++){const angle=i*Math.PI/2;box(start.x+Math.cos(angle)*r-1,start.y+Math.sin(angle)*r-1,3,3,c);}ctx.globalAlpha=1;}
        box(p.x-9,p.y-4,19,9,'#173832');box(p.x-5,p.y-7,11,15,'#173832');
        box(p.x-7,p.y-5,15,11,'#10232a');box(p.x-6,p.y-4,13,9,c);box(p.x-5,p.y-3,11,7,'#edf5e8');
        path([{x:p.x-5,y:p.y-3},{x:p.x,y:p.y+1},{x:p.x+5,y:p.y-3}],c);
        text(returning?'REPLY':'PROMPT',Math.max(18,Math.min(W-18,p.x)),p.y-9,c,5,'center');
        promptVisuals.push({kind:packet.kind,to:packet.to,x:p.x,y:p.y,progress});
      }
      ball?.update(dt,life,settings.toy,settings.pet&&!!guide&&(world.mode==='demo'||world.connection==='open'||world.agents.size===0));
      guide?.update(dt,life,world,settings.pet,ball);
      if(settings.pet&&guide&&guide.x!==null){
        pet(ctx,guide.x,guide.y,guide.time,{moving:guide.walking,flip:guide.facing<0,alert:guide.reason});
        if(guide.reason)speech('!',{x:guide.x,y:guide.y+20},guide.reason==='error'?'#ed8582':'#edb56d');
        else if(settings.bubbles&&guide.job)speech(guide.job==='carried'?'Tidying up!':'Fetch!',{x:guide.x,y:guide.y+14},'#c1d0c1');
        const target=life.actors.get(guide.targetId);
        if(target&&guide.focusUntil>guide.time){
          const c=guide.reason==='error'?'#ed8582':'#edb56d';
          path([{x:target.x-19,y:target.y-36},{x:target.x-19,y:target.y+7},{x:target.x+19,y:target.y+7},{x:target.x+19,y:target.y-36}],c);
          text((guide.reason==='wait'?'NEED YOU · ':'OOPS · ')+target.agent.name.slice(0,16),Math.max(85,Math.min(W-85,target.x)),target.y-66,c,6,'center');
        }
      }
      drawBall();
      text('AGENT / TRANSIT',14,18,'#3e574e',5);text(world.mode==='demo'?'DÉMO':world.connection==='open'?'LIVE':'HORS LIGNE',W-14,18,'#577466',4,'right');
      const population=world.population(true);text(`${population.conversations} CONV ACTIVES · ${population.subagents} MINI-BOTS`,14,27,'#466457',4);
      if(!world.agents.size)text(world.connection==='open'?'LA MAISON ATTEND TES AGENTS':'LE JARDIN EST PRÊT',s.house.x+s.house.width+12,s.house.y-25,'#658274',5);
    }
    const local=(x,y)=>{const b=canvas.getBoundingClientRect();return{x:x*W/Math.max(1,b.width),y:y*H/Math.max(1,b.height)};};
    return{draw,resize,settings,spectrum,media,guide,ball,get life(){return life;},get scene(){return{...life.scene,stations:[]};},get positions(){return life.actors;},clear(){life=new root.TransitLife.Life();life.resize(W,H,world.agents.size,lastFooter);previousTime=world.time;lastCount=-1;packetPaths.clear();if(ball){ball.release(0,true);ball.state='hidden';}},hit(x,y){const p=local(x,y);return life.outside().reverse().find(a=>Math.abs(a.x-p.x)<15&&p.y>a.y-34&&p.y<a.y+5)?.id;},interact(x,y){const p=local(x,y);if(settings.pet&&guide?.hit(p.x,p.y)){guide.point();return;}if(!settings.social)return;life.invite(p.x,p.y,this.hit(x,y),world);},
      pointerDown(x,y,stamp){const p=local(x,y);if(settings.toy&&(ball?.hit(p.x,p.y)||ball?.basketHit(p.x,p.y)))return ball.press(p.x,p.y,stamp);this.interact(x,y);if(settings.toy&&!this.hit(x,y)&&!(settings.pet&&guide?.hit(p.x,p.y)))return ball?.press(p.x,p.y,stamp);return false;},
      pointerMove(x,y,stamp){const p=local(x,y);ball?.move(p.x,p.y,stamp);return ball?.state==='held'?'grabbing':ball?.hit(p.x,p.y)||ball?.basketHit(p.x,p.y)?'grab':'crosshair';},
      pointerUp(stamp,cancel=false){ball?.release(stamp,cancel);},
      snapshot(){return{...life.snapshot(),raster:{width:canvas.width,height:canvas.height,dpr:lastDpr,worldWidth:W,worldHeight:H,contentHeight,bottomInset},guide:guide?.snapshot(),toy:ball?.snapshot(),promptFlights:promptVisuals,propsLoaded:Object.keys(images),renderedRobotHeight:Math.round(33*canvas.getBoundingClientRect().height/H),activeConduits:Math.min(3,packetPaths.size)};}};
  }
  root.TransitRenderer={createRenderer};
})(globalThis);
