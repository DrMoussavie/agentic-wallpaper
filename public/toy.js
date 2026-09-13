(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const GRAVITY=420,DRAG=.84;
  // One toy, one body, no timers or DOM nodes. Time follows the wallpaper pause.
  class Ball {
    constructor(){this.radius=6;this.time=0;this.state='hidden';this.x=0;this.y=0;this.vx=0;this.vy=0;this.lastPlay=0;this.stillSince=null;this.pointer=null;this.bumpAt=-1;this.spin=0;this.enabled=true;this.bounds={left:8,right:300,top:35,bottom:500};this.carrier=null;this.shot=null;this.samples=[];}
    layout(life){
      this.bounds={left:9,right:Math.max(9,life.width-9),top:35,bottom:Math.max(35,life.bounds.bottom-2)};
      this.basket={x:clamp(life.scene.house.x+life.scene.house.width*.68,15,life.width-15),y:life.scene.gate.y-8};
      this.confine();
    }
    confine(){const b=this.bounds;this.x=clamp(this.x,b.left,b.right);this.y=clamp(this.y,b.top,b.bottom);}
    hit(x,y){return this.enabled&&this.state!=='hidden'&&Math.hypot(x-this.x,y-this.y)<this.radius+7;}
    basketHit(x,y){return this.enabled&&this.basket&&Math.abs(x-this.basket.x)<14&&Math.abs(y-this.basket.y)<13;}
    touch(){this.lastPlay=this.time;this.stillSince=null;if(this.state==='fetch')this.state='free';}
    press(x,y,stamp){
      if(!this.enabled)return false;
      if(this.state==='hidden'||this.hit(x,y)||this.basketHit(x,y)){
        this.state='held';this.carrier=null;this.shot=null;this.x=x;this.y=y;this.vx=0;this.vy=0;this.confine();this.touch();this.pointer={x,y,stamp,seenAt:this.time};this.samples=[{x,y,stamp}];return true;
      }
      return false;
    }
    move(x,y,stamp){
      const prev=this.pointer;this.pointer={x,y,stamp,seenAt:this.time};
      if(!this.enabled)return;
      if(this.state==='held'){
        // Keep the last 160 ms of cursor positions: the throw uses the whole flick, not the last two events.
        this.samples.push({x,y,stamp});while(this.samples.length>2&&stamp-this.samples[0].stamp>160)this.samples.shift();
        this.x=x;this.y=y;this.confine();this.touch();return;
      }
      if(!prev||!['free','fetch'].includes(this.state))return;
      // Swept cursor collision also catches a fast swipe between pointer events.
      const dx=x-prev.x,dy=y-prev.y,len2=dx*dx+dy*dy;
      const q=len2?clamp(((this.x-prev.x)*dx+(this.y-prev.y)*dy)/len2,0,1):0;
      this.bounceCursor(prev.x+q*dx,prev.y+q*dy,dy);
    }
    bounceCursor(x,y,dy=0){
      if(this.time-this.bumpAt<.14||Math.hypot(x-this.x,y-this.y)>this.radius+5)return;
      this.bumpAt=this.time;this.vy=-Math.min(350,190+Math.abs(dy)*4);this.vx=clamp(this.vx+(this.x-x)*18,-320,320);
      this.y=Math.min(this.y,y-this.radius-5);this.touch();
    }
    // Release velocity comes from the flick window; a cursor that stopped simply drops the ball. Hosts that
    // forward mouse moves at a low rate (Wallpaper Engine) no longer lose the throw to a stale last event.
    release(stamp,cancel=false){
      if(this.state==='held'){
        const last=this.samples.at(-1),first=this.samples[0];
        if(cancel||!last||!first||stamp-last.stamp>250||last===first){this.vx=0;this.vy=cancel?0:-60;}
        else{const dt=Math.max(.016,(last.stamp-first.stamp)/1000);this.vx=clamp((last.x-first.x)/dt,-560,560);this.vy=clamp((last.y-first.y)/dt,-620,560);}
        this.state='free';this.samples=[];this.touch();if(!cancel)this.shot={by:'you',at:this.time,scored:false};
      }
      if(cancel)this.pointer=null;
    }
    // A robot picks the ball up, from the ground or straight out of the toy box.
    take(carrier){
      if(!this.enabled||!['free','fetch','hidden'].includes(this.state))return false;
      if(this.state==='hidden'){this.x=this.basket.x;this.y=this.basket.y-6;}
      this.state='robot';this.carrier=carrier;this.vx=0;this.vy=0;this.shot=null;this.touch();return true;
    }
    followRobot(actor,facing=1,raised=false,scale=1){
      if(this.state!=='robot')return;
      this.x=actor.x+(raised?0:facing*9*scale);this.y=actor.y-(raised?31:9)*scale;this.touch();
    }
    drop(){if(this.state==='robot'){this.state='free';this.carrier=null;this.vy=-60;this.confine();this.touch();}}
    // Solve the launch so the ball crosses the target while falling; drag on vx is integrated exactly.
    throwAt(target,seconds=.85,errorX=0){
      if(this.state!=='robot')return false;
      const k=-Math.log(DRAG),reach=(1-Math.exp(-k*seconds))/k;
      this.vx=(target.x+errorX-this.x)/reach;this.vy=(target.y-this.y)/seconds-.5*GRAVITY*seconds;
      this.state='free';this.shot={by:this.carrier,at:this.time,scored:false};this.carrier=null;this.stillSince=null;this.touch();return true;
    }
    update(dt,life,enabled,dogAvailable,hoop=null){
      this.enabled=enabled;this.layout(life);this.time+=clamp(dt,0,.2);
      if(!enabled){this.state='hidden';this.carrier=null;this.shot=null;this.pointer=null;return;}
      if(this.state==='robot'){this.stillSince=null;return;}
      if(!['free','fetch'].includes(this.state))return;
      // Bounded substeps keep collisions stable when a frame is late.
      let remaining=clamp(dt,0,.2);
      while(remaining>0){
        const step=Math.min(remaining,1/60);remaining-=step;const prevX=this.x,prevY=this.y;
        this.vy+=GRAVITY*step;this.x+=this.vx*step;this.y+=this.vy*step;this.spin+=this.vx*step/18;
        if(hoop?.active)hoop.collide(this,prevX,prevY);
        const b=this.bounds;
        if(this.x<b.left||this.x>b.right){this.x=clamp(this.x,b.left,b.right);this.vx*=-.74;}
        if(this.y<b.top){this.y=b.top;this.vy=Math.abs(this.vy)*.7;}
        if(this.y>b.bottom){this.y=b.bottom;this.vy=Math.abs(this.vy)<40?0:-Math.abs(this.vy)*.62;this.vx*=Math.pow(.08,step);if(Math.abs(this.vx)<1)this.vx=0;}
        this.vx*=Math.pow(DRAG,step);
        if(this.pointer&&this.time-this.pointer.seenAt<1.5&&this.vy>0)this.bounceCursor(this.pointer.x,this.pointer.y);
      }
      if(this.vx===0&&this.vy===0){
        this.stillSince??=this.time;
        if(this.shot){if(!this.shot.scored)hoop?.missed(this.shot);this.shot=null;}
      }
      else {this.stillSince=null;if(this.state==='fetch')this.state='free';}
      if(!dogAvailable&&this.time-this.lastPlay>25)this.state='hidden';
    }
    dogDestination(guide,life,available){
      if(!available||!this.enabled){
        if(this.state==='carried'){this.state='free';this.vx=0;this.vy=0;this.stillSince=null;this.confine();}
        if(this.state==='fetch')this.state='free';
        return null;
      }
      if(this.state==='free'&&this.stillSince!==null&&this.time-this.stillSince>=4)this.state='fetch';
      if(this.state==='fetch')return{x:this.x,y:this.y+5};
      if(this.state==='carried')return this.basket;
      return null;
    }
    followDog(guide){
      if(this.state==='fetch'&&Math.hypot(guide.x-this.x,guide.y-this.y)<16)this.state='carried';
      if(this.state==='carried'){
        this.x=guide.x+guide.facing*10;this.y=guide.y-8;
        if(Math.hypot(guide.x-this.basket.x,guide.y-this.basket.y)<12){this.state='hidden';this.vx=0;this.vy=0;this.shot=null;}
      }
    }
    snapshot(){return{state:this.state,x:this.x,y:this.y,vx:this.vx,vy:this.vy,stillFor:this.stillSince===null?0:this.time-this.stillSince,basket:this.basket,carrier:this.carrier,shot:this.shot?{...this.shot}:null};}
  }
  // A basketball hoop that visits the garden at a random spot, stays a while, then moves on.
  class Hoop {
    constructor(seed=1){this.random=root.TransitLife.random(seed^0x5a17);this.time=0;this.state='away';this.x=null;this.y=null;this.facing=1;this.nextAt=0;this.relocateAt=null;this.relocate=true;this.score=0;this.streak=0;this.best=0;this.netUntil=-9;this.flashUntil=-9;this.rimUntil=-9;this.lastShot=null;this.appearedAt=0;}
    get active(){return this.state==='up';}
    // Rim centre and half width; the rim sticks out from the backboard towards the open side (screen centre).
    rim(){return{x:this.x+this.facing*11,y:this.y-27,half:9};}
    board(){return{x:this.x,top:this.y-42,bottom:this.y-22};}
    // `loose` keeps only the hard rules (screen, house, toy box) so a crowded garden still gets its hoop.
    clear(p,life,ball,loose=false){
      const s=life.scene,b=life.bounds;
      if(p.x<b.left+34||p.x>b.right-34||p.y<b.top+52||p.y>b.bottom)return false;
      if(p.x<s.house.x+s.house.width/2+46&&p.y<s.gate.y+56)return false;
      if(ball?.basket&&Math.hypot(p.x-ball.basket.x,p.y-ball.basket.y)<40)return false;
      if(loose)return true;
      if(Math.abs(p.y-s.busY)<24)return false;
      if(Math.hypot(p.x-s.bench.x,p.y-s.bench.y)<46||Math.hypot(p.x-s.terminal.x,p.y-s.terminal.y)<46)return false;
      return s.plants.every(plant=>Math.abs(p.x-plant.x)>plant.width+16||Math.abs(p.y-plant.y)>plant.width+14);
    }
    // A new spot is picked away from the previous one so a made basket visibly moves the hoop.
    spawn(life,ball){
      const b=life.bounds,previous=this.x===null?null:{x:this.x,y:this.y};let best=null,score=-1;
      for(const loose of [false,true]){
        for(let i=0;i<90;i++){const p={x:b.left+this.random()*(b.right-b.left),y:b.top+this.random()*(b.bottom-b.top)};if(!this.clear(p,life,ball,loose))continue;const away=previous?Math.hypot(p.x-previous.x,p.y-previous.y):999;if(away>score){best=p;score=away;}if(away>Math.min(220,(b.right-b.left)*.4))break;}
        if(best)break;
      }
      if(!best){if(previous)return false;best={x:(b.left+b.right)/2,y:Math.max(b.top+52,b.bottom-40)};}
      this.x=Math.round(best.x);this.y=Math.round(best.y);this.facing=this.x>life.width/2?-1:1;this.state='up';this.appearedAt=this.time;this.relocateAt=null;return true;
    }
    update(dt,life,enabled,ball){
      this.time+=clamp(dt,0,.2);
      if(!enabled){if(this.state==='up'){this.state='away';this.nextAt=this.time+1;}return;}
      if(this.state==='away'&&this.time>=this.nextAt){if(!this.spawn(life,ball))this.nextAt=this.time+5;}
      if(this.state==='up'){
        const b=life.bounds;
        // The hoop never leaves the screen: an impossible spot after a resize is replaced at once.
        if(this.x<b.left+20||this.x>b.right-20||this.y<b.top+40||this.y>b.bottom+2){this.state='away';this.nextAt=this.time;return;}
        if(this.relocateAt!==null&&this.time>=this.relocateAt&&!(ball&&ball.state==='robot'))this.spawn(life,ball);
      }
    }
    // Gentle assist: a ball dropping close to the rim is nudged over its centre.
    assist(ball){
      const r=this.rim(),dx=r.x-ball.x,dy=r.y-ball.y;
      if(ball.vy>0&&dy>0&&dy<32&&Math.abs(dx)<r.half+8)ball.vx+=dx*3.5*(1/60);
    }
    // Rim ends and backboard bounce the ball; a downward crossing inside the rim scores.
    collide(ball,prevX,prevY){
      const r=this.rim(),board=this.board(),radius=ball.radius;this.assist(ball);
      if(prevY<r.y&&ball.y>=r.y&&ball.vy>0&&Math.abs(ball.x-r.x)<r.half-1){
        this.scored(ball);ball.vx*=.45;ball.vy*=.55;return;
      }
      // The rim is welded to the backboard: only its free tip can be hit.
      {
        const px=r.x+this.facing*r.half,dx=ball.x-px,dy=ball.y-r.y,d=Math.hypot(dx,dy);
        if(d<radius+1.5&&d>0){const nx=dx/d,ny=dy/d,dot=ball.vx*nx+ball.vy*ny;if(dot<0){ball.vx-=1.55*dot*nx;ball.vy-=1.55*dot*ny;}ball.x=px+nx*(radius+1.6);ball.y=r.y+ny*(radius+1.6);this.rimUntil=this.time+.35;}
      }
      const inBoard=ball.y+radius>board.top&&ball.y-radius<board.bottom,crossed=(prevX-board.x)*(ball.x-board.x)<=0,near=Math.abs(ball.x-board.x)<radius+1;
      if(inBoard&&(crossed||near)){
        const side=prevX!==board.x?Math.sign(prevX-board.x):ball.vx>0?-1:1;
        ball.x=board.x+side*(radius+1.5);if(Math.sign(ball.vx)===-side)ball.vx=-ball.vx*.62;this.rimUntil=this.time+.25;
      }
    }
    scored(ball){
      this.score++;this.streak++;this.best=Math.max(this.best,this.streak);this.netUntil=this.time+1.3;this.flashUntil=this.time+2.2;
      if(this.relocate)this.relocateAt=this.time+1.5;this.lastShot={by:ball.shot?.by||'you',scored:true,at:this.time};if(ball.shot)ball.shot.scored=true;
    }
    missed(shot){this.streak=0;this.lastShot={by:shot?.by||'you',scored:false,at:this.time};}
    snapshot(){return{state:this.state,x:this.x,y:this.y,facing:this.facing,score:this.score,streak:this.streak,best:this.best,lastShot:this.lastShot?{...this.lastShot}:null,relocateAt:this.relocateAt};}
  }
  root.TransitToy={Ball,Hoop};
})(globalThis);
