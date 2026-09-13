(function(root){
  const {robot,pet,colors}=root.TransitSprites,{atPath}=root.TransitWorld;
  const bubbles={arrive:'Hello, world!',idle:'What next?',walk:'Beep, beep!',think:'Hmm... got it?',read:'Page patrol!',search:'Clue hunting!',type:'Tap tap tap!',tool:'On it!',test:'Does it pass?',send:'Special delivery!',receive:'Fresh data!',spawn:'Calling backup!',wait:'Need a human!',error:'Uh-oh!',celebrate:'Ta-da!',compact:'Brain cleanup!',pause:'Time out!',sleep:'Zzz...',wake:'Rise and compile!',archive:'Home time!',clean:'Dust buster!',offline:'Signal lost...'};
  const variants={idle:['What next?','Snack break?','Still here!'],think:['Hmm...','Thinking cap on!','Brain.exe busy'],read:['Page patrol!','Plot twist?','One more page!'],search:['Clue hunting!','Where is it?','Aha... maybe!'],type:['Tap tap tap!','Keyboard ninja!','Tiny fingers!'],tool:['On it!','Nuts and bolts!','Work in progress!'],test:['Does it pass?','Fingers crossed!','Science time!'],wait:['Need a human!','Your move!','A little help?'],error:['Uh-oh!','Well, that broke.','Plot twist!'],celebrate:['Ta-da!','All yours!','Mic drop!'],archive:['Clocking out!','Nap time!','Home, sweet home!'],receive:['Fresh data!','Ooh, mail!','Got it!'],compact:['Brain cleanup!','Squish the bits!'],walk:['Beep, beep!','Coming through!'],incoming:['Incoming!','New mission!','Oh, a prompt!'],delivered:['All yours!','Answer’s ready!','Read me!']};
  const BEST_KEY='agent-transit:hoop-best';
  function readBest(){try{return Math.max(0,Number(root.localStorage?.getItem(BEST_KEY))||0);}catch{return 0;}}
  function writeBest(value){try{root.localStorage?.setItem(BEST_KEY,String(value));}catch{}}
  function createRenderer(canvas,world){
    const ctx=canvas.getContext('2d',{alpha:false});let W=360,H=640,viewScale=1,linkBoxes=[],linkToast=0,life=new root.TransitLife.Life(),previousTime=world.time,lastCount=-1;
    const settings={tubes:true,background:'black',scale:1,pet:true,roam:true,social:true,audio:true,audioSource:'relay',media:false,audioWidth:35,bottomMargin:80,bubbles:true,bubbleScale:1.4,toy:true,hoop:true,visitors:true},images={},packetPaths=new Map();
    let bubbleRects=[];const random=root.TransitLife.random(life.seed^0x7e5721);let nextChatter=8,quietSince=null;
    const spectrum=root.TransitAudio?.createSpectrum(),guide=root.TransitPet?new root.TransitPet.Guide():null;let lastFooter=-1,lastMediaVisible=false,contentHeight=640,bottomInset=0,lastDpr=1;let promptVisuals=[];
    const media=root.TransitMedia?.createNowPlaying();
    const ball=root.TransitToy?new root.TransitToy.Ball():null,hoop=root.TransitToy?.Hoop?new root.TransitToy.Hoop(life.seed):null;let toyHintAt=0,toyHintUntil=0,savedBest=readBest();if(hoop)hoop.best=savedBest;
    const visitors=root.TransitVisitors?new root.TransitVisitors.Visitors(life.seed):null;let clockHour=null;
    let groove=0,danceSince=null,dancing=false,petting=null;
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
      viewScale=scale;
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
    function ballSprite(x,y){
      box(x-4,y-7,8,14,'#633e48');box(x-6,y-5,12,10,'#633e48');
      box(x-4,y-6,8,12,'#d28588');box(x-5,y-4,10,8,'#d28588');
      box(x-3,y-5,6,4,'#f1c8a5');box(x-4,y+2,8,3,'#ac657d');
      box(x-3+Math.round(Math.sin(ball.spin)*2),y-1,3,3,'#f4d3b0');
    }
    // The toy box shows the ball resting inside instead of a lone pixel.
    function drawToyBox(){
      const b=ball.basket;
      box(b.x-10,b.y-15,20,2,'#4f6b5d');box(b.x-9,b.y-13,18,6,'#1c2f29');
      if(ball.state==='hidden')ballSprite(b.x,b.y-10);
      box(b.x-9,b.y-6,18,8,'#253d35');box(b.x-10,b.y-8,20,3,'#638373');box(b.x-5,b.y-4,10,1,'#426052');
    }
    function drawHoop(){
      const x=hoop.x,y=hoop.y,f=hoop.facing,r=hoop.rim(),hot=hoop.rimUntil>hoop.time;
      box(x-4,y-1,8,2,'#2c3a37');box(x-1,y-40,2,40,'#4a5a57');box(x-1,y-40,1,40,'#6d7f7b');
      box(x-1,y-44,3,22,'#c5cfc9');box(x,y-43,1,20,'#e6eeea');box(x-1,y-31,3,5,'#e9a15b');
      const reach=r.half*2+2,rimX=Math.min(x,x+f*reach);box(rimX,r.y-1,reach+1,2,hot?'#ffb070':'#e98b4a');box(x+f*reach-(f<0?1:0),r.y-2,1,1,'#ffd2a3');
      const swing=hoop.netUntil>hoop.time?Math.sin((hoop.netUntil-hoop.time)*19)*Math.min(2.5,(hoop.netUntil-hoop.time)*3):0;
      for(let i=0;i<4;i++){const nx=x+f*(3+i*5)+swing*(i%2?1.4:1);box(nx,r.y+1,1,7,'#dfe8e3');if(i<3)box(nx+f,r.y+4+i%2,f*4,1,'#b8c6c0');}
      if(hoop.streak>0)text(String(hoop.streak),x,y-47,'#f1c76b',5,'center');
      if(hoop.flashUntil>hoop.time){ctx.globalAlpha=Math.min(1,(hoop.flashUntil-hoop.time)*1.5);text('SWISH!',x+f*8,y-54,'#f1c76b',6,'center');ctx.globalAlpha=1;}
      if(hoop.score>0)text(`${hoop.score} PTS · REC ${hoop.best}`,x,y+9,'#466457',4,'center');
    }
    function drawBurst(b){
      const age=life.time-b.since,q=Math.min(1,age/1.3),c=colors[b.provider]||'#c9daa0';ctx.globalAlpha=1-q;
      for(let i=0;i<10;i++){const angle=i*Math.PI/5+q*.6,r=3+q*22;box(b.x+Math.cos(angle)*r-1,b.y-8+Math.sin(angle)*r*.55-1,2,2,i%2?c:'#e4edec');}
      if(b.kind==='portal')for(let i=0;i<4;i++)box(b.x-1+(i%2)*2,b.y-14-q*18-i*4,1,2,c);
      ctx.globalAlpha=1;
    }
    function drawButterfly(v){
      const flap=Math.floor(visitors.time*(v.resting?3:14))%2,c=v.color,x=Math.round(v.x),y=Math.round(v.y);
      box(x,y-1,1,3,'#3b3a45');
      if(flap){box(x-4,y-2,4,3,c);box(x+1,y-2,4,3,c);box(x-3,y+1,2,1,c);box(x+2,y+1,2,1,c);}
      else{box(x-3,y-1,3,2,c);box(x+1,y-1,3,2,c);}
    }
    function drawFirefly(f){
      if(f.glow<=0)return;const x=Math.round(f.x),y=Math.round(f.y);ctx.globalAlpha=.35*f.glow;box(x-2,y-2,5,5,'#c8e37a');ctx.globalAlpha=Math.min(1,.4+f.glow);box(x-1,y-1,3,3,'#e6f5a0');box(x,y,1,1,'#ffffff');ctx.globalAlpha=1;
    }
    function updateDance(dt){
      const bass=settings.audio?spectrum?.bass:null;
      if(bass===null||bass===undefined){groove=Math.max(0,groove-dt*.5);}else groove+=(bass-groove)*(1-Math.exp(-dt*2.2));
      if(groove>.5)danceSince??=life.time;else if(groove<.32)danceSince=null;
      dancing=danceSince!==null&&life.time-danceSince>3;
    }
    function draw(){
      if(lastCount!==world.agents.size||lastMediaVisible!==!!(settings.media&&media?.visible)||lastDpr!==Math.max(1,Number(root.devicePixelRatio)||1))resize();const t=world.time,dt=Math.max(0,t-previousTime);previousTime=t;
      const toysOn=settings.toy&&!!ball,hoopOn=toysOn&&settings.hoop&&!!hoop;
      hoop?.update(dt,life,hoopOn,ball);
      life.update(dt,world,settings,{ball:toysOn?ball:null,hoop:hoopOn?hoop:null});const s=life.scene;bubbleRects=[];
      ball?.update(dt,life,settings.toy,settings.pet&&!!guide&&(world.mode==='demo'||world.connection==='open'||world.agents.size===0),hoopOn?hoop:null);
      visitors?.update(dt,life,settings.visitors!==false,clockHour);
      const butterfly=visitors?.butterfly&&visitors.butterfly.x>0&&visitors.butterfly.x<W?visitors.butterfly:null;
      guide?.update(dt,life,world,settings.pet,ball,butterfly?{x:butterfly.x,y:butterfly.y}:null);
      if(guide&&settings.pet&&guide.x!==null&&butterfly)visitors.startle(guide.x,guide.y);
      updateDance(dt);
      if(hoop&&hoop.best>savedBest){savedBest=hoop.best;writeBest(savedBest);}
      if(petting&&guide&&life.time-petting.since>1){guide.loveUntil=life.time+2.6;petting=null;}
      ctx.globalAlpha=1;ctx.fillStyle=settings.background==='night'?'#03080c':'#000';ctx.fillRect(0,0,W,H);
      if(settings.background==='grid')for(let x=15;x<W;x+=28)for(let y=35;y<H;y+=28)box(x,y,1,1,'#0c171b');
      // The house anchors the upper left; its garden follows the available screen width.
      path([{x:s.left+6,y:s.busY+5},{x:s.right-8,y:s.busY+5}],'#18231f');
      for(let x=s.left+14;x<s.right-5;x+=13)box(x,s.busY+8,6,1,'#142019');
      const mids=dancing?Math.max(0,spectrum?.mids||0):0;
      for(const plant of s.plants)prop(plant.type,plant.x,plant.y+(dancing&&plant.type==='flowers'?Math.round(Math.sin(life.time*9+plant.x*.3)*(1+mids*1.5)):0),plant.width);
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
        const available=ordered.filter(a=>a.phase==='outside'&&!a.agent.resting&&!a.play&&!['wait','error','offline','receive','celebrate'].includes(a.agent.action)&&!life.pendingDelivery(a.id));
        if(available.length){const actor=available[Math.floor(random()*available.length)],loud=level!=null&&level>.66,quiet=quietSince!==null&&life.time-quietSince>10;
          const phrases=dancing?['Feel the beat!','Bass!','Dance mode on!']:loud?['My circuits!','Easy on the bass!','That beat though!']:quiet?['Where’s the beat?','Did someone mute?','Tiny volume!']:['Listening...','Just one more bit.','Seriously, bits?'];
          actor.chatter={text:phrases[Math.floor(random()*phrases.length)],until:life.time+3.6,mood:loud?'grumpy':quiet?'listening':random()<.35?'grumpy':'listening'};
        }
      }
      // Every ground object shares one painter's order so nothing walks "through" the hoop or the toy box.
      const visuals=new Map(),layers=[];
      for(const actor of ordered){const a=actor.agent,visual=life.visual(actor,world);const chatter=actor.chatter?.until>life.time&&!['wait','error','receive','celebrate','offline'].includes(visual.action)&&!visual.expecting&&!actor.play?actor.chatter:null;if(chatter)visual.mood=chatter.mood;visuals.set(actor,{visual,chatter});
        layers.push({y:actor.y,draw(){box(actor.x-8,actor.y+2,17,2,'#101b18');
          ctx.save();if(actor.phase==='entering'){ctx.beginPath();const doorway=s.house.width*.2;ctx.rect(s.door.x-doorway/2,s.door.y-s.house.height*.38,doorway,s.house.height*.4);ctx.clip();ctx.globalAlpha=1-(visual.entering||0);}
          robot(ctx,actor.x,actor.y,a.provider,visual.action,visual.age,{...visual,free:true,scale:a.parent?.62:1,showMini:false,dance:dancing&&!actor.play&&!visual.expecting&&actor.phase==='outside'});ctx.restore();}});
        if(toysOn&&ball.state==='robot'&&ball.carrier===actor.id)layers.push({y:actor.y+.01,draw(){ballSprite(ball.x,ball.y);}});
      }
      if(hoopOn&&hoop.active)layers.push({y:hoop.y,draw:drawHoop});
      if(toysOn&&ball.basket)layers.push({y:ball.basket.y+2,draw:drawToyBox});
      if(toysOn&&!['hidden','robot'].includes(ball.state))layers.push({y:ball.state==='carried'&&guide?guide.y+.01:ball.y,draw(){ballSprite(ball.x,ball.y);}});
      if(settings.pet&&guide&&guide.x!==null)layers.push({y:guide.y,draw(){pet(ctx,guide.x,guide.y,guide.time,{moving:guide.walking,flip:guide.facing<0,alert:guide.reason,happy:dancing||guide.loveUntil>life.time});}});
      layers.sort((a,b)=>a.y-b.y);for(const layer of layers)layer.draw();
      for(const burst of life.bursts)drawBurst(burst);
      for(const actor of ordered){const a=actor.agent,{visual,chatter}=visuals.get(actor);
        const receiptAge=actor.caughtAt!=null?life.time-actor.caughtAt:99;
        if(receiptAge>=0&&receiptAge<.8){
          const r=5+receiptAge*23;ctx.globalAlpha=1-receiptAge/.8;
          for(let i=0;i<8;i++){const angle=i*Math.PI/4;box(actor.x+Math.cos(angle)*r-1,actor.y-17+Math.sin(angle)*r-1,2,2,colors[a.provider]);}
          ctx.globalAlpha=1;
        }
        if(['outside','leaving','returning'].includes(actor.phase)){
          const urgent=['wait','error','offline'].includes(a.action)||visual.action==='offline';
          const incoming=!!life.pendingDelivery(a.id);
          const captionKey=urgent?(visual.action==='offline'?'offline':a.action):actor.phase==='returning'?'archive':incoming?'incoming':actor.phase==='leaving'?'arrive':visual.delivered?'delivered':visual.action;
          const cycle=Math.floor(life.time/12),stamp=captionKey+':'+cycle;
          if(actor.phraseStamp!==stamp){actor.phraseStamp=stamp;const choices=variants[captionKey]||[bubbles[captionKey]];actor.phrase=choices[Math.floor(random()*choices.length)];}
          const cheer=actor.cheerUntil>life.time?actor.cheer:null,playing=actor.play?.stage;
          const caption=urgent?actor.phrase:incoming?actor.phrase:cheer?(cheer==='swish'?'Swish!':'Almost!'):playing==='aim'?'Watch this!':playing?'Ball time!':visual.social?'Hey there!':chatter?chatter.text:visual.caught?'New quest!':actor.phrase;
          if(actor.caption!==caption){actor.caption=caption;actor.captionSince=life.time;}
          const age=(life.time-actor.captionSince)%12;
          const displayCaption=caption==='Listening...'?`Listening${'.'.repeat([1,2,3,2,1][Math.floor(life.time*3)%5])}`:caption;
          if(settings.bubbles&&(urgent||incoming||chatter||cheer||age<4.5))speech(displayCaption,actor,a.action==='error'?'#e2ad9f':a.action==='wait'?'#ead1a4':'#c1d0c1',urgent?1:Math.max(0,Math.min(1,.35+age*4,(4.5-age)*3)));
        }
      }
      for(const e of life.encounters){if(e.started===null||e.kind!=='spark')continue;const [a,b]=e.ids.map(id=>life.actors.get(id));if(!a||!b)continue;const q=Math.max(0,Math.min(1,(life.time-e.started-1)/2.3));box(a.x+(b.x-a.x)*q-1,a.y-17-Math.sin(q*Math.PI)*6,2,2,'#c9daa0');}
      promptVisuals=[];
      const envelope=(p,c,label,shrink=0)=>{
        const w=Math.round(19-shrink*10),h=Math.round(9-shrink*2);
        box(p.x-w/2,p.y-h/2,w,h,'#173832');if(shrink<.5)box(p.x-5,p.y-7,11,15,'#173832');
        box(p.x-w/2+2,p.y-h/2-1,w-4,h+2,'#10232a');box(p.x-w/2+3,p.y-h/2,w-6,h,c);box(p.x-w/2+4,p.y-h/2+1,w-8,h-2,'#edf5e8');
        if(shrink<.6)path([{x:p.x-5,y:p.y-3},{x:p.x,y:p.y+1},{x:p.x+5,y:p.y-3}],c);
        if(shrink<.3)text(label,Math.max(18,Math.min(W-18,p.x)),p.y-9,c,5,'center');
      };
      // Prompts wait at the terminal until their robot stands in the garden, then land in its hands.
      for(const flight of life.flights()){
        const actor=life.actors.get(flight.id);if(!actor)continue;const c=colors[flight.provider],start={x:s.terminal.x,y:s.terminal.y-14};
        if(!flight.launched){
          const hover=Math.round(Math.sin(life.time*3)*1.5),p={x:start.x,y:start.y-4+hover};
          ctx.globalAlpha=.5+Math.sin(life.time*6)*.2;for(let i=0;i<4;i++){const angle=i*Math.PI/2+life.time*2;box(start.x+Math.cos(angle)*9-1,start.y+Math.sin(angle)*9-1,2,2,c);}ctx.globalAlpha=1;
          envelope(p,c,'PROMPT');promptVisuals.push({kind:'prompt',to:flight.id,x:p.x,y:p.y,progress:0});continue;
        }
        const scale=actor.agent.parent?.62:1,side=actor.facing<0?-1:1,endpoint={x:actor.x+side*10*scale,y:actor.y-12*scale};
        const points=[start,{x:s.terminal.x,y:s.busY},{x:endpoint.x,y:s.busY},endpoint];
        const progress=flight.progress,eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2,p=atPath(points,eased);
        if(settings.tubes){ctx.globalAlpha=Math.min(1,progress*8,(1-progress)*8);path(points,'#233a37',3);path(points,'#071511',1);ctx.globalAlpha=1;}
        for(let i=1;i<=9;i++){const trail=atPath(points,Math.max(0,eased-i*.012));ctx.globalAlpha=(10-i)*.08;box(trail.x-1,trail.y-1,i<4?3:2,2,c);}ctx.globalAlpha=1;
        const launch=1-Math.min(1,progress*7);if(launch>0){const r=4+(1-launch)*14;ctx.globalAlpha=launch;for(let i=0;i<4;i++){const angle=i*Math.PI/2;box(start.x+Math.cos(angle)*r-1,start.y+Math.sin(angle)*r-1,3,3,c);}ctx.globalAlpha=1;}
        envelope(p,c,'PROMPT',Math.max(0,(progress-.86)/.14));
        promptVisuals.push({kind:'prompt',to:flight.id,x:p.x,y:p.y,progress});
      }
      for(const packet of world.packets.filter(p=>p.kind==='result'&&t>=p.start&&t<p.start+p.duration)){
        const actor=life.actors.get(packet.from);if(!actor)continue;
        const endpoint=['home','queued','entering','portal'].includes(actor.phase)?{x:s.door.x,y:s.door.y-13}:{x:actor.x+6,y:actor.y-14};
        const points=[endpoint,{x:endpoint.x,y:s.busY},{x:s.terminal.x,y:s.busY},{x:s.terminal.x,y:s.terminal.y-14}];
        const progress=(t-packet.start)/packet.duration,eased=progress<.5?2*progress*progress:1-Math.pow(-2*progress+2,2)/2,c=colors[packet.provider],p=atPath(points,eased);
        if(settings.tubes){ctx.globalAlpha=Math.min(1,progress*8,(1-progress)*8);path(points,'#233a37',3);path(points,'#071511',1);ctx.globalAlpha=1;}
        for(let i=1;i<=9;i++){const trail=atPath(points,Math.max(0,eased-i*.012));ctx.globalAlpha=(10-i)*.08;box(trail.x-1,trail.y-1,i<4?3:2,2,c);}ctx.globalAlpha=1;
        envelope(p,c,'REPLY');
        promptVisuals.push({kind:'result',to:packet.to,x:p.x,y:p.y,progress});
      }
      if(settings.pet&&guide&&guide.x!==null){
        if(guide.reason)speech('!',{x:guide.x,y:guide.y+20},guide.reason==='error'?'#ed8582':'#edb56d');
        else if(settings.bubbles&&guide.job&&guide.job!=='chase')speech(guide.job==='carried'?'Tidying up!':'Fetch!',{x:guide.x,y:guide.y+14},'#c1d0c1');
        if(guide.loveUntil>life.time){const q=(guide.loveUntil-life.time)/2.6,hy=guide.y-16-(1-q)*10;ctx.globalAlpha=Math.min(1,q*3);box(guide.x-3,hy,2,2,'#ed8582');box(guide.x,hy,2,2,'#ed8582');box(guide.x-4,hy+1,7,2,'#ed8582');box(guide.x-3,hy+3,5,1,'#ed8582');box(guide.x-2,hy+4,3,1,'#ed8582');box(guide.x-1,hy+5,1,1,'#ed8582');ctx.globalAlpha=1;}
        const target=life.actors.get(guide.targetId);
        if(target&&guide.focusUntil>guide.time){
          const c=guide.reason==='error'?'#ed8582':'#edb56d';
          path([{x:target.x-19,y:target.y-36},{x:target.x-19,y:target.y+7},{x:target.x+19,y:target.y+7},{x:target.x+19,y:target.y-36}],c);
          text((guide.reason==='wait'?'NEED YOU · ':'OOPS · ')+target.agent.name.slice(0,16),Math.max(85,Math.min(W-85,target.x)),target.y-66,c,6,'center');
        }
      }
      if(toysOn){
        const resting=ball.state==='free'&&ball.stillSince!==null;
        if(resting&&ball.time>=toyHintAt){toyHintAt=ball.time+10+random()*7;toyHintUntil=ball.time+2.5;}
        if(settings.bubbles&&resting&&ball.time<toyHintUntil)speech(hoopOn&&hoop.active?'Shoot me!':'Grab me!',{x:ball.x,y:ball.y+24},'#e4c3aa');
      }
      if(visitors&&settings.visitors!==false){if(visitors.butterfly)drawButterfly(visitors.butterfly);for(const f of visitors.fireflies)drawFirefly(f);}
      // Corner text is sized in screen pixels (not world pixels) so it stays legible at every scale.
      const live=world.mode!=='demo'&&world.connection==='open',T=Math.max(8,Math.round(15/viewScale)),L=Math.max(6,Math.round(12/viewScale));
      linkBoxes=[];const markLink=(str,x,y,size)=>{ctx.font=`${size}px monospace`;linkBoxes.push({x:x-2,y:y-size,w:ctx.measureText(str).width+4,h:size+4});};
      text('AGENTIC WALLPAPER',14,T+6,'#7fd6a5',T);markLink('AGENTIC WALLPAPER',14,T+6,T);text(world.mode==='demo'?'DEMO':live?'LIVE':'OFFLINE',W-14,T+6,'#7fd6a5',L,'right');
      const population=world.population(true);
      if(live)text(`${population.conversations} ACTIVE CONVERSATIONS · ${population.subagents} MINI-BOTS`,14,T+L+10,'#8fa89b',L);
      // Next to the house: without a relay (Workshop subscribers) or in the demo, say where the agents come from.
      const hx=s.house.x+s.house.width+12,hy=s.house.y-25;
      if(!live){
        text('CONNECT YOUR CLAUDE CODE & CODEX AGENTS',hx,hy,'#e6efe9',L);text(GITHUB_LABEL,hx,hy+L+3,'#7ee8ff',L);markLink(GITHUB_LABEL,hx,hy+L+3,L);
        ctx.fillStyle='#7ee8ff';ctx.fillRect(Math.round(hx),Math.round(hy+L+5),Math.round(linkBoxes[1].w-4),1); // underline: it is clickable
        if(linkToast>life.time)text('LINK COPIED — PASTE IT IN YOUR BROWSER',hx,hy+2*L+8,'#8fa89b',L);
      }
      else if(!world.agents.size)text('THE HOUSE IS WAITING FOR YOUR AGENTS',hx,hy,'#8fa89b',L);
    }
    const GITHUB_URL='https://github.com/DrMoussavie/agentic-wallpaper',GITHUB_LABEL='github.com/DrMoussavie/agentic-wallpaper';
    // Clicking the title or the link opens the repository. Wallpaper Engine may block window.open: then copy the URL instead.
    function openGithub(){let opened=null;try{opened=root.open(GITHUB_URL,'_blank','noopener');}catch{}if(!opened){linkToast=life.time+4;try{root.navigator?.clipboard?.writeText(GITHUB_URL).catch(()=>{});}catch{}}}
    const linkHit=(x,y)=>{const p=local(x,y);return linkBoxes.some(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);};
    const local=(x,y)=>{const b=canvas.getBoundingClientRect();return{x:x*W/Math.max(1,b.width),y:y*H/Math.max(1,b.height)};};
    return{draw,resize,settings,spectrum,media,guide,ball,hoop,visitors,get life(){return life;},get scene(){return{...life.scene,stations:[]};},get positions(){return life.actors;},set clockHour(value){clockHour=value;},get dancing(){return dancing;},
      clear(){life=new root.TransitLife.Life();life.resize(W,H,world.agents.size,lastFooter);previousTime=world.time;lastCount=-1;packetPaths.clear();if(ball){ball.release(0,true);ball.state='hidden';ball.carrier=null;}if(hoop){hoop.state='away';hoop.nextAt=hoop.time;}if(visitors)visitors.butterfly=null;},
      hit(x,y){const p=local(x,y);return life.outside().reverse().find(a=>Math.abs(a.x-p.x)<15&&p.y>a.y-34&&p.y<a.y+5)?.id;},interact(x,y){const p=local(x,y);if(settings.pet&&guide?.hit(p.x,p.y)){guide.point();return;}if(!settings.social)return;life.invite(p.x,p.y,this.hit(x,y),world);},
      pointerDown(x,y,stamp){if(linkHit(x,y)){openGithub();return false;}const p=local(x,y);if(settings.toy&&(ball?.hit(p.x,p.y)||ball?.basketHit(p.x,p.y)))return ball.press(p.x,p.y,stamp);if(settings.pet&&guide?.hit(p.x,p.y)){guide.point();petting={since:life.time};return true;}this.interact(x,y);if(settings.toy&&!this.hit(x,y))return ball?.press(p.x,p.y,stamp);return false;},
      pointerMove(x,y,stamp){if(linkHit(x,y))return 'pointer';const p=local(x,y);ball?.move(p.x,p.y,stamp);if(petting&&!(guide?.hit(p.x,p.y)))petting=null;return ball?.state==='held'?'grabbing':ball?.hit(p.x,p.y)||ball?.basketHit(p.x,p.y)?'grab':'crosshair';},
      pointerUp(stamp,cancel=false){ball?.release(stamp,cancel);petting=null;},
      snapshot(){return{...life.snapshot(),raster:{width:canvas.width,height:canvas.height,dpr:lastDpr,worldWidth:W,worldHeight:H,contentHeight,bottomInset},guide:guide?.snapshot(),toy:ball?.snapshot(),hoop:hoop?.snapshot(),visitors:visitors?.snapshot(),dancing,promptFlights:promptVisuals,propsLoaded:Object.keys(images),renderedRobotHeight:Math.round(33*canvas.getBoundingClientRect().height/H),activeConduits:Math.min(3,packetPaths.size)};}};
  }
  root.TransitRenderer={createRenderer};
})(globalThis);
