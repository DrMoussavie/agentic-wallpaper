(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // One toy, one body, no timers or DOM nodes. Time follows the wallpaper pause.
  class Ball {
    constructor(){this.radius=6;this.time=0;this.state='hidden';this.x=0;this.y=0;this.vx=0;this.vy=0;this.lastPlay=0;this.stillSince=null;this.pointer=null;this.bumpAt=-1;this.spin=0;this.enabled=true;this.bounds={left:8,right:300,top:35,bottom:500};}
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
        this.state='held';this.x=x;this.y=y;this.vx=0;this.vy=0;this.confine();this.touch();this.pointer={x,y,stamp,seenAt:this.time};return true;
      }
      return false;
    }
    move(x,y,stamp){
      const prev=this.pointer;this.pointer={x,y,stamp,seenAt:this.time};
      if(!this.enabled)return;
      if(this.state==='held'){
        const dt=prev?clamp((stamp-prev.stamp)/1000,.008,.12):.03;
        this.vx=clamp((x-this.x)/dt,-480,480);this.vy=clamp((y-this.y)/dt,-480,480);
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
    release(stamp,cancel=false){
      if(this.state==='held'){
        if(cancel||!this.pointer||stamp-this.pointer.stamp>120){this.vx=0;this.vy=cancel?0:-125;}
        this.state='free';this.touch();
      }
      if(cancel)this.pointer=null;
    }
    update(dt,life,enabled,dogAvailable){
      this.enabled=enabled;this.layout(life);this.time+=clamp(dt,0,.2);
      if(!enabled){this.state='hidden';this.pointer=null;return;}
      if(!['free','fetch'].includes(this.state))return;
      // Bounded substeps keep collisions stable when a frame is late.
      let remaining=clamp(dt,0,.2);
      while(remaining>0){
        const step=Math.min(remaining,1/60);remaining-=step;
        this.vy+=420*step;this.x+=this.vx*step;this.y+=this.vy*step;this.spin+=this.vx*step/18;
        const b=this.bounds;
        if(this.x<b.left||this.x>b.right){this.x=clamp(this.x,b.left,b.right);this.vx*=-.74;}
        if(this.y<b.top){this.y=b.top;this.vy=Math.abs(this.vy)*.7;}
        if(this.y>b.bottom){this.y=b.bottom;this.vy=Math.abs(this.vy)<40?0:-Math.abs(this.vy)*.62;this.vx*=Math.pow(.08,step);if(Math.abs(this.vx)<1)this.vx=0;}
        this.vx*=Math.pow(.84,step);
        if(this.pointer&&this.time-this.pointer.seenAt<1.5&&this.vy>0)this.bounceCursor(this.pointer.x,this.pointer.y);
      }
      if(this.vx===0&&this.vy===0)this.stillSince??=this.time;
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
        if(Math.hypot(guide.x-this.basket.x,guide.y-this.basket.y)<12){this.state='hidden';this.vx=0;this.vy=0;}
      }
    }
    snapshot(){return{state:this.state,x:this.x,y:this.y,vx:this.vx,vy:this.vy,stillFor:this.stillSince===null?0:this.time-this.stillSince,basket:this.basket};}
  }
  root.TransitToy={Ball};
})(globalThis);
