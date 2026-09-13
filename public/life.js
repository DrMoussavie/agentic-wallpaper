/* Visual life-cycle: session identity stays in World, resting avatars stay in the house. */
(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const wanderable=a=>a.action==='idle'||a.action==='walk';
  // A prompt flies from the terminal only once its robot stands in the garden; the catch starts the receive gesture with the capsule already in hand.
  const FLIGHT=3.2,CATCH_OFFSET=1.5,CAUGHT_FOR=3.2;
  // After its answer a robot lingers with the reply in hand, so an unread result stays visible; it goes home after this delay at the latest.
  const LINGER=300;
  function random(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let t=Math.imul(s^s>>>15,1|s);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
  function compose(width,height,count,seed,bottomInset=32){
    const r=random(seed^0xabc123),margin=clamp(width*.035,22,60),left=margin,right=width-margin,span=right-left;
    const houseScale=Math.min(1,Math.max(.65,height/360)),homeY=Math.min(clamp(height*.06,28,60)+88*houseScale,height-95),homeX=left+Math.min(64,span*.27);
    const house={x:homeX,y:homeY,width:100*houseScale,height:88*houseScale};
    const door={x:homeX,y:homeY-2},gate={x:homeX,y:homeY+30};
    const bounds={left:left+17,right:right-25,top:Math.min(height-45,homeY+37),bottom:Math.max(homeY+42,height-bottomInset)};
    const busY=Math.min(height-22,homeY+24),hub={x:right-23,y:busY};
    // The waiting corner: a paved patch with a bench whose length follows the screen width (2 to 6 seats).
    const benchLength=clamp(Math.round(span*.07),46,118),seats=Math.max(2,Math.floor((benchLength-6)/19));
    const bench={x:Math.round(Math.min(right-benchLength/2-16,homeX+house.width/2+42+benchLength/2)),y:gate.y+16,length:benchLength,seats};
    const corner={left:bench.x-benchLength/2-12,right:bench.x+benchLength/2+14,top:bench.y-18,bottom:bench.y+46};
    const plants=[];
    // Sparse groups across the whole screen; population changes never reshuffle the scenery.
    const field={left:24,right:width-24,top:42,bottom:height-Math.max(20,bottomInset-12)},fw=field.right-field.left,fh=field.bottom-field.top;
    const groups=clamp(Math.round(fw*fh/56000),4,70),columns=clamp(Math.round(Math.sqrt(groups*fw/fh)),1,groups),rows=Math.ceil(groups/columns);
    const clear=p=>p.x-p.width/2>=field.left&&p.x+p.width/2<=field.right&&p.y-p.width>=field.top&&p.y<=field.bottom&&
      !(Math.abs(p.x-homeX)<house.width/2+p.width+14&&p.y>homeY-house.height-12&&p.y<gate.y+20)&&
      !(Math.abs(p.y-busY)<p.width+12)&&
      !(p.x>right-90&&p.y>homeY-45&&p.y<homeY+18)&&
      !(p.x+p.width/2>corner.left-6&&p.x-p.width/2<corner.right+6&&p.y>corner.top-6&&p.y-p.width<corner.bottom+6);
    for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
      let anchor=null;
      for(let attempt=0;attempt<8&&!anchor;attempt++){
        const candidate={x:field.left+(col+.15+r()*.7)*fw/columns,y:field.top+(row+.15+r()*.7)*fh/rows,width:14+r()*8};
        if(clear(candidate))anchor=candidate;
      }
      if(!anchor)continue;
      const choice=r();plants.push({...anchor,type:choice<.72?'grass':choice<.88?'flowers':'stones'});
      if(r()<.55){
        const companion={x:anchor.x+(r()<.5?-1:1)*(anchor.width*.6+8+r()*6),y:anchor.y-5+r()*10,width:10+r()*6,type:'grass'};
        if(clear(companion))plants.push(companion);
      }
    }
    plants.push({x:homeX-58*houseScale,y:homeY+1,width:21,type:'flowers'},{x:homeX+58*houseScale,y:homeY+2,width:18,type:'grass'});
    return{width,height,left,right,house,door,gate,bounds,hub,busY,plants,bench,corner,terminal:{x:right-23,y:homeY-2}};
  }
  class Life {
    constructor(seed=Math.floor(Math.random()*4294967296)){this.seed=seed;this.random=random(seed);this.actors=new Map();this.encounters=[];this.ripples=[];this.time=0;this.nextMeeting=10;this.nextExit=0;this.doorUntil=0;this.count=0;this.stats={spawned:0,meetings:0,walked:0,returned:0,departed:0,shots:0,baskets:0};this.deliveries=[];this.tracked=new WeakSet();this.bursts=[];this.player=null;this.nextPlay=18;this.width=360;this.height=640;this.bounds={left:30,right:330,top:64,bottom:610};this.resize(360,640);}
    resize(width,height,count=this.count,bottomInset=this.bottomInset||32){
      this.bottomInset=bottomInset;const old=this.bounds;this.width=Math.max(180,width);this.height=Math.max(180,height);this.count=count;this.scene=compose(this.width,this.height,count,this.seed,bottomInset);this.bounds=this.scene.bounds;this.hub=this.scene.hub;
      const b=this.bounds,remap=p=>this.constrain({x:b.left+(p.x-old.left)/Math.max(1,old.right-old.left)*(b.right-b.left),y:b.top+(p.y-old.top)/Math.max(1,old.bottom-old.top)*(b.bottom-b.top)});
      for(const e of [...this.encounters])this.cancel(e);
      for(const a of this.actors.values()){
        a.homeSpot=remap(a.homeSpot||a);
        if(['home','queued','entering'].includes(a.phase)){a.x=this.scene.door.x;a.y=this.scene.door.y;a.target=null;}
        else if(a.phase==='portal'){a.target=null;}
        else {Object.assign(a,remap(a));if(a.phase==='returning')a.route=[{...this.scene.gate},{...this.scene.door}];else if(a.phase==='leaving')a.route=[{...this.scene.gate},{...a.homeSpot}];else if(a.target)a.target=remap(a.target);}
      }
      this.separate(1,10);
    }
    constrain(p){const b=this.bounds;p.x=clamp(p.x,b.left,b.right);p.y=clamp(p.y,b.top,b.bottom);return p;}
    outside(){return [...this.actors.values()].filter(a=>!['home','queued','portal'].includes(a.phase));}
    // The spawn gesture opens a portal beside the parent; the mini-bot steps out of it, not out of the house.
    portalSpot(parent){return{x:parent.x+35,y:parent.y};}
    portal(a,parent,world){const spot=this.portalSpot(parent);a.phase='portal';a.x=spot.x;a.y=spot.y;a.target=null;a.route=[];a.vx=a.vy=0;a.releaseAt=this.time+clamp(2.8-(world.time-parent.agent.since),0,2.8);}
    separate(strength,passes=2){
      if(strength<=0)return;const actors=[...this.actors.values()].filter(a=>a.phase==='outside'&&!a.parked);
      for(let pass=0;pass<passes;pass++){for(let i=0;i<actors.length;i++)for(let j=i+1;j<actors.length;j++){
        const a=actors[i],b=actors[j],family=a.agent.parent===b.id||b.agent.parent===a.id||a.agent.parent&&a.agent.parent===b.agent.parent,rx=family?24:a.meeting&&a.meeting===b.meeting?27:34,ry=family?28:42,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx/rx,dy/ry);if(d>=1)continue;
        const amount=(1-d)*.5*strength,px=(d>.001?dx/d:rx)*amount,py=(d>.001?dy/d:0)*amount;a.x-=px;a.y-=py;b.x+=px;b.y+=py;
      }actors.forEach(a=>this.constrain(a));}
    }
    point(near=null,minRadius=22,maxRadius=58,provider=null){
      const b=this.bounds;let best=null,score=-Infinity;
      for(let i=0;i<60;i++){
        const angle=this.random()*Math.PI*2,r=minRadius+this.random()*(maxRadius-minRadius);
        const q=this.constrain(near?{x:near.x+Math.cos(angle)*r,y:near.y+Math.sin(angle)*r}:{x:b.left+this.random()*(b.right-b.left),y:b.top+this.random()*(b.bottom-b.top)});
        const space=Math.min(120,...[...this.actors.values()].map(a=>distance(a.homeSpot||a,q)));
        const center=provider==='codex'?b.left+(b.right-b.left)*.32:b.left+(b.right-b.left)*.68;
        const value=space-(provider?Math.abs(q.x-center)*.12:0);if(value>score){best=q;score=value;}if(space>64)break;
      }
      return best;
    }
    cancel(e){for(const id of e.ids){const a=this.actors.get(id);if(a?.meeting===e){a.meeting=null;a.target=null;a.nextWander=this.time+5+this.random()*6;}}this.encounters=this.encounters.filter(v=>v!==e);}
    wantsHome(a){
      const g=a.agent;if(g.retired||['sleep','archive'].includes(g.action))return true;if(!g.resting)return false;
      // Mini-bots and corrected states go straight home; a finished conversation waits with its letter.
      if(g.parent||!['celebrate','idle'].includes(g.action))return true;
      return this.time-(a.restingSince??this.time)>=LINGER;
    }
    lingering(a){const g=a.agent;return a.phase==='outside'&&!!g.resting&&!g.parent&&g.action==='idle'&&!this.wantsHome(a);}
    // Seats on the bench first, then standing spots on the paving; a full corner leaves the robot where it is.
    spots(){
      const b=this.scene.bench,c=this.scene.corner,list=[];
      for(let i=0;i<b.seats;i++)list.push({x:Math.round(b.x-b.length/2+10+i*19),y:b.y+1,seated:true});
      for(let x=c.left+12;x<=c.right-10;x+=20)list.push({x:Math.round(x),y:b.y+38,seated:false});
      return list;
    }
    rest(a,dt){
      const spots=this.spots();
      if(a.spot==null||a.spot>=spots.length){const taken=new Set([...this.actors.values()].filter(o=>o!==a&&o.spot!=null).map(o=>o.spot));const free=spots.findIndex((s,i)=>!taken.has(i));if(free<0){a.spot=null;a.parked=false;return;}a.spot=free;if(a.meeting)this.cancel(a.meeting);a.target=null;}
      const spot=this.constrain({...spots[a.spot]}),pace=Math.max(21,Math.hypot(this.bounds.right-this.bounds.left,this.bounds.bottom-this.bounds.top)/24);
      if(this.move(a,spot,dt,pace)){a.parked=true;a.seated=spots[a.spot].seated;a.facing=1;a.walking=false;}else{a.parked=false;a.seated=false;}
    }
    queue(a){a.phase='queued';a.x=this.scene.door.x;a.y=this.scene.door.y;a.target=null;a.route=[];a.vx=a.vy=0;a.releaseAt=Math.max(this.time+.15,this.nextExit);this.nextExit=a.releaseAt+.9;}
    returnHome(a){if(a.meeting)this.cancel(a.meeting);a.phase='returning';a.target=null;a.route=[{x:a.x,y:this.scene.gate.y},{...this.scene.gate},{...this.scene.door}];a.vx=a.vy=0;}
    sync(world){
      const agents=[...world.agents.values()].sort((a,b)=>Number(!!a.parent)-Number(!!b.parent)),ids=new Set(agents.map(a=>a.id));
      if(agents.length!==this.count)this.resize(this.width,this.height,agents.length);
      for(const [id,a] of this.actors)if(!ids.has(id)){if(a.meeting)this.cancel(a.meeting);this.actors.delete(id);}
      for(const agent of agents){let a=this.actors.get(agent.id);
        if(!a){const parent=this.actors.get(agent.parent),spot=this.point(parent?.homeSpot||null,28,60,agent.provider);
          a={id:agent.id,x:this.scene.door.x,y:this.scene.door.y,homeSpot:spot,target:null,route:[],phase:'queued',vx:0,vy:0,facing:1,born:this.time,action:agent.action,actionSince:agent.since,nextWander:this.time+8,meeting:null,walking:false,waveUntil:0,agent};this.actors.set(a.id,a);this.stats.spawned++;
          if(this.wantsHome(a))a.phase='home';
          else if(parent&&parent.phase==='outside'&&parent.agent.action==='spawn'&&world.time-parent.agent.since<5)this.portal(a,parent,world);
          else this.queue(a);
        }
        a.agent=agent;
        if(agent.resting&&!a.wasResting)a.restingSince=this.time;a.wasResting=!!agent.resting;
        if(a.action!==agent.action||a.actionSince!==agent.since){if(a.meeting)this.cancel(a.meeting);a.target=null;a.action=agent.action;a.actionSince=agent.since;a.waveUntil=0;a.nextWander=this.time+5+this.random()*7;}
        if(this.wantsHome(a)){
          if(a.phase==='queued')a.phase='home';
          if(a.phase==='portal'){a.phase='home';a.x=this.scene.door.x;a.y=this.scene.door.y;}
          const celebrating=agent.action==='celebrate'&&world.time-agent.since<(root.TransitAnimations.ACTIONS.celebrate.duration||4);
          if(!celebrating&&['outside','leaving'].includes(a.phase))this.returnHome(a);
        }else if(a.phase==='home')this.queue(a);
        else if(a.phase==='returning'){a.phase='leaving';a.route=[{...a.homeSpot}];this.bursts.push({x:a.x,y:a.y,since:this.time,provider:agent.provider});}
        // An input received during the doorway transition is handled once the crossing completes.
      }
      for(const p of world.packets){
        if(p.kind!=='prompt'||this.tracked.has(p)||!this.actors.has(p.to))continue;
        this.tracked.add(p);this.deliveries=this.deliveries.filter(d=>d.id!==p.to||d.arrived!==null);this.deliveries.push({id:p.to,provider:p.provider,created:this.time,launched:null,arrived:null});
      }
    }
    pendingDelivery(id){return this.deliveries.find(d=>d.id===id&&d.arrived===null)||null;}
    stopPlaying(a,ball){if(!a.play)return;if(ball?.state==='robot'&&ball.carrier===a.id)ball.drop();a.play=null;if(this.player===a.id)this.player=null;a.nextPlay=this.time+40+this.random()*40;a.nextWander=this.time+4;}
    // A free robot takes the ball to the hoop, shoots, and reacts; anything real interrupts the game.
    play(a,dt,ball,hoop){
      const g=a.play,rim=hoop.rim(),scale=a.agent.parent?.62:1,pace=Math.max(24,Math.hypot(this.bounds.right-this.bounds.left,this.bounds.bottom-this.bounds.top)/18);
      if(!hoop.active||!wanderable(a.agent)||this.wantsHome(a)||a.phase!=='outside'||ball.state==='held'||ball.state==='carried'||ball.state==='robot'&&ball.carrier!==a.id){this.stopPlaying(a,ball);return;}
      if(g.stage==='toBall'){
        const spot=ball.state==='hidden'?{x:ball.basket.x,y:ball.basket.y+14}:{x:ball.x,y:ball.y+4};
        const dest=this.constrain({x:spot.x,y:spot.y});
        if(this.move(a,dest,dt,pace)||distance(a,spot)<18){if(!ball.take(a.id)){this.stopPlaying(a,ball);return;}g.stage='toSpot';const side=hoop.facing;g.spot=this.constrain({x:rim.x+side*(36+this.random()*12),y:hoop.y+(this.random()-.5)*8});}
        ball.followRobot(a,a.facing,false,scale);return;
      }
      if(g.stage==='toSpot'){
        if(this.move(a,g.spot,dt,pace)){g.stage='aim';g.until=this.time+.9;a.facing=rim.x<a.x?-1:1;}
        ball.followRobot(a,a.facing,false,scale);return;
      }
      if(g.stage==='aim'){
        a.facing=rim.x<a.x?-1:1;ball.followRobot(a,a.facing,true,scale);
        if(this.time>=g.until){const lucky=this.random()<.6,error=lucky?(this.random()-.5)*3:(this.random()<.5?-1:1)*(6+this.random()*6);ball.throwAt({x:rim.x,y:rim.y-1},.85,error);g.stage='watch';g.until=this.time+4;this.stats.shots++;}
        return;
      }
      if(g.stage==='watch'){
        a.facing=rim.x<a.x?-1:1;
        if(ball.shot?.scored||hoop.lastShot?.by===a.id&&hoop.lastShot.scored&&hoop.lastShot.at>=g.until-4){this.stats.baskets++;a.waveUntil=this.time+2.4;a.cheer='swish';a.cheerUntil=this.time+2.4;this.stopPlaying(a,ball);return;}
        if(ball.stillSince!==null||this.time>=g.until||!ball.shot){a.cheer='miss';a.cheerUntil=this.time+2.6;this.stopPlaying(a,ball);}
      }
    }
    startGame(ball,hoop,roaming){
      if(!roaming||!ball?.enabled||!hoop?.active||this.player||this.time<this.nextPlay)return;
      this.nextPlay=this.time+25+this.random()*30;
      const ready=ball.state==='hidden'||['free','fetch'].includes(ball.state)&&ball.stillSince!==null;if(!ready)return;
      const eligible=this.outside().filter(a=>a.phase==='outside'&&!a.agent.parent&&!a.agent.resting&&wanderable(a.agent)&&!a.meeting&&!this.wantsHome(a)&&!this.pendingDelivery(a.id)&&this.time>=(a.nextPlay||0));
      if(!eligible.length)return;const a=eligible[Math.floor(this.random()*eligible.length)];
      if(a.meeting)this.cancel(a.meeting);a.target=null;a.play={stage:'toBall',since:this.time};this.player=a.id;
    }
    startMeeting(a,b){const center=this.constrain({x:(a.x+b.x)/2,y:(a.y+b.y)/2});center.x=clamp(center.x,this.bounds.left+17,this.bounds.right-17);const e={ids:[a.id,b.id],center,created:this.time,timeout:Math.max(25,distance(a,b)/28+12),started:null,kind:this.random()<.5?'hello':'spark'};a.meeting=b.meeting=e;a.target={x:center.x-16,y:center.y};b.target={x:center.x+16,y:center.y};this.encounters.push(e);}
    move(a,target,dt,speed=16){const d=distance(a,target);if(d<1){a.x=target.x;a.y=target.y;a.vx=a.vy=0;return true;}const step=Math.min(d,speed*dt);a.x+=(target.x-a.x)/d*step;a.y+=(target.y-a.y)/d*step;if(Math.abs(target.x-a.x)>1)a.facing=target.x<a.x?-1:1;a.walking=step>0;this.stats.walked+=step;return distance(a,target)<1;}
    update(dt,world,settings={},toys={}){
      this.sync(world);dt=clamp(dt,0,.2);if(world.mode==='live'&&world.connection!=='open'){for(const a of this.actors.values())a.walking=false;return;}this.time+=dt;
      const roaming=settings.roam!==false,social=settings.social!==false,{ball=null,hoop=null}=toys;
      if(settings.toy===false||settings.hoop===false||!ball||!hoop){for(const a of this.actors.values())if(a.play)this.stopPlaying(a,ball);}
      else this.startGame(ball,hoop,roaming);
      for(const e of [...this.encounters]){const [a,b]=e.ids.map(id=>this.actors.get(id));if(!roaming||!social||!a||!b||a.phase!=='outside'||b.phase!=='outside'||!wanderable(a.agent)||!wanderable(b.agent)||this.time-e.created>e.timeout){this.cancel(e);continue;}if(e.started===null&&distance(a,a.target||a)<3&&distance(b,b.target||b)<3){e.started=this.time;a.target=b.target=null;a.facing=1;b.facing=-1;this.stats.meetings++;}if(e.started!==null&&this.time-e.started>4.6)this.cancel(e);}
      if(roaming&&social&&this.time>=this.nextMeeting){this.nextMeeting=this.time+12+this.random()*8;const available=this.outside().filter(a=>a.phase==='outside'&&!a.agent.parent&&!a.agent.resting&&wanderable(a.agent)&&!a.meeting&&!this.wantsHome(a));if(available.length>=2&&this.encounters.length<2){const a=available[Math.floor(this.random()*available.length)],b=available.filter(v=>v!==a).sort((x,y)=>distance(x,a)-distance(y,a))[0];this.startMeeting(a,b);}}
      const groups=new Map();
      if(roaming)for(const a of this.actors.values()){
        const parent=this.actors.get(a.agent.parent);
        if(a.phase==='outside'&&!this.wantsHome(a)&&parent?.phase==='outside'&&!this.wantsHome(parent)){
          if(!groups.has(parent.id))groups.set(parent.id,[]);groups.get(parent.id).push(a);
        }
      }
      for(const children of groups.values())children.sort((a,b)=>a.id.localeCompare(b.id));
      for(const a of this.actors.values()){
        a.walking=false;a.orbiting=false;
        if(a.phase==='home')continue;
        if(a.phase==='portal'){
          const parent=this.actors.get(a.agent.parent),open=parent&&parent.phase==='outside'&&parent.agent.action==='spawn';
          if(open)Object.assign(a,this.portalSpot(parent));
          if(this.time>=a.releaseAt||!open){a.phase='leaving';a.born=this.time;a.route=[{...a.homeSpot}];this.stats.departed++;this.bursts.push({x:a.x,y:a.y-9,since:this.time,provider:a.agent.provider,kind:'portal'});}
          continue;
        }
        if(a.phase==='queued'){if(this.time<a.releaseAt)continue;a.phase='leaving';a.born=this.time;a.route=[{...this.scene.gate},{...a.homeSpot}];this.doorUntil=this.time+1.7;this.stats.departed++;if(this.pendingDelivery(a.id))this.bursts.push({x:this.scene.door.x,y:this.scene.door.y,since:this.time,provider:a.agent.provider});}
        if(a.phase==='entering'){this.doorUntil=this.time+.4;if(this.time-a.enteredAt>.65){a.phase='home';a.route=[];a.x=this.scene.door.x;a.y=this.scene.door.y;this.stats.returned++;}continue;}
        if(['leaving','returning'].includes(a.phase)){
          // Cross a wide garden in a reasonable time while keeping the small robot model.
          const speed=Math.max(21,Math.hypot(this.bounds.right-this.bounds.left,this.bounds.bottom-this.bounds.top)/24);
          const dest=a.route[0];if(dest&&this.move(a,dest,dt,speed))a.route.shift();
          if(a.phase==='returning'&&distance(a,this.scene.door)<30)this.doorUntil=this.time+.8;
          if(!a.route.length){if(a.phase==='returning'){a.phase='entering';a.enteredAt=this.time;this.doorUntil=this.time+1;}else{a.phase='outside';a.nextWander=this.time+5+this.random()*8;}}
          continue;
        }
        a.expecting=false;
        if(this.lingering(a)){this.rest(a,dt);continue;}
        if(a.spot!=null){a.spot=null;a.parked=false;a.seated=false;}
        if(a.play){if(!roaming)this.stopPlaying(a,ball);else{this.play(a,dt,ball,hoop);continue;}}
        // A robot waiting for its prompt stands still so the capsule lands in its hands.
        const delivery=this.pendingDelivery(a.id);
        if(delivery&&!['wait','error'].includes(a.agent.action)&&!a.agent.parent){if(a.meeting)this.cancel(a.meeting);a.target=null;a.expecting=true;a.facing=this.scene.terminal.x<a.x?-1:1;continue;}
        const siblings=groups.get(a.agent.parent);
        if(siblings&&!['wait','error'].includes(a.agent.action)){
          if(a.meeting)this.cancel(a.meeting);a.target=null;
          const parent=this.actors.get(a.agent.parent),slot=siblings.indexOf(a),ring=Math.floor(slot/6),count=Math.min(6,siblings.length-ring*6),b=this.bounds;
          const rx=Math.min(42+ring*23,Math.max(10,(b.right-b.left)/2-6)),ry=Math.min(32+ring*18,Math.max(8,(b.bottom-b.top)/2-6));
          const cx=clamp(parent.x,b.left+rx,b.right-rx),cy=clamp(parent.y,b.top+ry,b.bottom-ry),angle=this.time*.19+(slot%6)*Math.PI*2/count+ring*.7;
          const destination={x:cx+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry};
          this.move(a,destination,dt,Math.max(22,distance(a,destination)/2.5));a.orbiting=true;a.orbitSlot=slot;
          continue;
        }
        if(!roaming||!wanderable(a.agent)){a.target=null;continue;}
        if(!a.meeting&&!a.target&&this.time>=a.nextWander&&this.time>a.waveUntil)a.target=this.point(a.homeSpot,20,55);
        if(a.target&&this.move(a,a.target,dt,a.target.speed||12)){a.target=null;a.nextWander=this.time+5+this.random()*8;}
      }
      this.doorOpening=(this.doorOpening||0)+clamp((this.doorUntil>this.time?1:0)-(this.doorOpening||0),-dt*5,dt*5);
      this.separate(Math.min(1,dt*5));this.ripples=this.ripples.filter(r=>this.time-r.since<2);this.bursts=this.bursts.filter(b=>this.time-b.since<1.3);
      for(const d of this.deliveries){
        const a=this.actors.get(d.id);if(!a){d.arrived=-Infinity;continue;}
        if(d.launched===null){if(a.phase==='outside')d.launched=this.time;continue;}
        if(d.arrived===null&&this.time-d.launched>=FLIGHT){d.arrived=this.time;a.caughtAt=this.time;a.expecting=false;}
      }
      this.deliveries=this.deliveries.filter(d=>d.arrived===null||this.time-d.arrived<CAUGHT_FOR);
    }
    // Progress of every prompt still travelling: 0 while the robot walks out, then 0 -> 1 along the conduit.
    flights(){return this.deliveries.filter(d=>d.arrived===null).map(d=>({id:d.id,provider:d.provider,progress:d.launched===null?0:clamp((this.time-d.launched)/FLIGHT,0,1),launched:d.launched!==null}));}
    invite(x,y,id=null,world){if(world.mode==='live'&&world.connection!=='open')return;this.ripples.push({x:clamp(x,0,this.width),y:clamp(y,0,this.height),since:this.time});const p=this.constrain({x,y}),eligible=a=>a.phase==='outside'&&wanderable(a.agent)&&!this.wantsHome(a)&&!a.agent.resting;if(id){const a=this.actors.get(id);if(a&&eligible(a)){if(a.meeting)this.cancel(a.meeting);a.target=null;a.waveUntil=this.time+2.4;a.nextWander=a.waveUntil+3;}return;}this.outside().filter(eligible).sort((a,b)=>distance(a,p)-distance(b,p)).slice(0,2).forEach((a,i)=>{if(a.meeting)this.cancel(a.meeting);a.target=this.constrain({x:p.x+(i-.5)*36,y:p.y,speed:Math.max(12,distance(a,p)/18)});});}
    visual(a,world){
      if(world.mode==='live'&&world.connection!=='open')return{action:'offline',age:world.time-a.agent.since};
      if(a.play&&a.phase==='outside'){if(a.play.stage==='aim')return{action:'idle',age:this.time-a.play.since,flip:a.facing<0,throwing:true};if(a.play.stage==='watch')return{action:'idle',age:this.time-a.play.since,flip:a.facing<0,watching:true};if(a.walking)return{action:'walk',age:this.time-a.born,flip:a.facing<0,translating:true,holding:true};}
      if(a.phase==='outside'&&a.expecting&&!['wait','error'].includes(a.agent.action))return{action:'idle',age:this.time-a.born,flip:a.facing<0,expecting:true};
      if(a.phase==='outside'&&a.caughtAt!=null&&this.time-a.caughtAt<CAUGHT_FOR&&!['wait','error'].includes(a.agent.action))return{action:'receive',age:this.time-a.caughtAt+CATCH_OFFSET,caught:true,flip:a.facing<0};
      if(a.walking&&!a.orbiting||['leaving','returning'].includes(a.phase))return{action:'walk',age:this.time-a.born,flip:a.facing<0,translating:true};
      if(a.phase==='entering')return{action:'idle',age:0,entering:clamp((this.time-a.enteredAt)/.65,0,1)};
      if(a.meeting?.started!=null)return{action:'idle',age:this.time-a.meeting.started,flip:a.facing<0,social:a.meeting.kind};
      if(this.time<a.waveUntil)return{action:'idle',age:2.4-(a.waveUntil-this.time),social:'hello',flip:a.facing<0};
      if(a.agent.reaction&&a.agent.reaction.kind!=='prompt'&&world.time-a.agent.reaction.since<4.4)return{action:'receive',age:world.time-a.agent.reaction.since};
      if(a.cheerUntil>this.time&&a.cheer==='miss')return{action:'idle',age:this.time-a.born,flip:a.facing<0,mood:'grumpy'};
      if(this.lingering(a))return{action:'idle',age:world.time-a.agent.since,flip:a.parked?false:a.facing<0,delivered:true,seated:!!a.seated};
      return{action:a.agent.action==='archive'?'idle':a.agent.action,age:world.time-a.agent.since,flip:a.orbiting&&a.facing<0,social:a.orbiting&&wanderable(a.agent)&&(this.time+a.orbitSlot*2)%14<1.7?'hello':undefined};
    }
    snapshot(){return{seed:this.seed,stats:{...this.stats},house:{...this.scene.house,resting:[...this.actors.values()].filter(a=>a.phase==='home').length,doorOpen:this.doorUntil>this.time},encounters:this.encounters.map(e=>({kind:e.kind,ids:e.ids,started:e.started})),actors:[...this.actors.values()].map(a=>({id:a.id,parent:a.agent.parent,x:a.x,y:a.y,phase:a.phase,walking:a.walking,orbiting:a.orbiting,target:a.target?{...a.target}:null,action:a.agent.action,expecting:!!a.expecting,play:a.play?.stage||null,lingering:this.lingering(a),spot:a.spot??null,seated:!!a.seated})),deliveries:this.flights(),player:this.player,bounds:{...this.bounds}};}
  }
  root.TransitLife={Life,random,compose};
})(globalThis);
