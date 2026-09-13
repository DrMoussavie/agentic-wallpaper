/* Decorative visitors so an empty garden still breathes: a butterfly by day, fireflies by night. */
(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const isNight=hour=>hour<7||hour>=21;
  class Visitors {
    constructor(seed=1){this.random=root.TransitLife.random(seed^0x3f1d);this.time=0;this.butterfly=null;this.nextButterfly=25;this.fireflies=[];this.night=false;this.hour=12;}
    // Local clock unless a caller injects the hour (tests, previews).
    update(dt,life,enabled,hour=null){
      dt=clamp(dt,0,.2);this.time+=dt;
      this.hour=hour??(typeof Date==='function'?(d=>d.getHours()+d.getMinutes()/60)(new Date()):12);
      const night=isNight(this.hour);
      if(!enabled){this.butterfly=null;this.fireflies=[];this.night=night;return;}
      if(night!==this.night){this.night=night;this.fireflies=[];if(night)this.butterfly=null;}
      if(night)this.updateFireflies(dt,life);else this.updateButterfly(dt,life);
    }
    updateButterfly(dt,life){
      const b=life.bounds,s=life.scene;
      if(!this.butterfly){
        if(this.time<this.nextButterfly)return;
        const fromLeft=this.random()<.5,y=b.top+20+this.random()*Math.max(1,b.bottom-b.top-60);
        const flowers=s.plants.filter(p=>p.type==='flowers'),rest=flowers.length?flowers[Math.floor(this.random()*flowers.length)]:null;
        this.butterfly={x:fromLeft?-12:life.width+12,y,dir:fromLeft?1:-1,phase:this.random()*7,since:this.time,rest:rest?{x:rest.x+(this.random()-.5)*rest.width*.6,y:rest.y-rest.width*.55}:null,resting:0,restUntil:0,visited:false,startled:0,color:this.random()<.5?'#f2c66b':'#9ad0f5'};
        return;
      }
      const v=this.butterfly;
      if(v.resting){
        v.resting=Math.max(0,v.restUntil-this.time);
        if(v.startled>0||!v.resting){v.resting=0;v.visited=true;v.y-=2;}
        return;
      }
      const speed=v.startled>0?52:20,target=v.rest&&!v.visited?v.rest:{x:v.dir>0?life.width+16:-16,y:v.y};
      const dx=target.x-v.x,dy=target.y-v.y,d=Math.hypot(dx,dy),step=Math.min(d,speed*dt);
      if(d>0){v.x+=dx/d*step;v.y+=dy/d*step;}
      v.y+=Math.sin(this.time*5+v.phase)*.35;v.phase+=dt;v.startled=Math.max(0,v.startled-dt);
      if(v.rest&&!v.visited&&d<2&&v.startled<=0){v.resting=2.5+this.random()*2;v.restUntil=this.time+v.resting;}
      if(v.visited||!v.rest){if(v.x<-20||v.x>life.width+20||this.time-v.since>60){this.butterfly=null;this.nextButterfly=this.time+60+this.random()*90;}}
    }
    // Something approaching (the dog) sends the butterfly off, a little faster.
    startle(x,y){const v=this.butterfly;if(!v)return;if(Math.hypot(x-v.x,y-v.y)<22){v.startled=1.6;v.visited=true;v.dir=x<v.x?1:-1;}}
    updateFireflies(dt,life){
      const b=life.bounds,count=clamp(Math.round((b.right-b.left)*(b.bottom-b.top)/70000),3,8);
      while(this.fireflies.length<count)this.fireflies.push({x:b.left+this.random()*(b.right-b.left),y:b.top+this.random()*(b.bottom-b.top),ax:this.random()*7,ay:this.random()*7,blink:this.random()*4,speed:6+this.random()*6});
      this.fireflies.length=count;
      for(const f of this.fireflies){
        f.ax+=dt*.6;f.ay+=dt*.45;f.blink+=dt;
        f.x=clamp(f.x+Math.cos(f.ax)*f.speed*dt,b.left,b.right);f.y=clamp(f.y+Math.sin(f.ay)*f.speed*dt*.7,b.top,b.bottom);
        f.glow=Math.max(0,Math.sin(f.blink*1.7)*.5+.5)*(Math.sin(f.blink*.35)>-.4?1:0);
      }
    }
    snapshot(){return{hour:this.hour,night:this.night,butterfly:this.butterfly?{x:this.butterfly.x,y:this.butterfly.y,resting:this.butterfly.resting>0}:null,fireflies:this.fireflies.length};}
  }
  function skyTone(hour){
    const h=((hour%24)+24)%24;
    const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
    const light=smooth((h-6)/2)*(1-smooth((h-19)/2));
    const warm=Math.max(0,1-Math.abs(h-7)/1.5,1-Math.abs(h-19.5)/1.5);
    const mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
    const rgb=a=>'rgb('+a.join(',')+')';
    return{light,sky:rgb(mix(mix([5,10,24],[39,79,111],light),[82,65,79],warm*.38)),
      horizon:rgb(mix(mix([10,17,28],[47,75,88],light),[101,77,68],warm*.4)),
      ground:rgb(mix([5,9,11],[22,29,29],light))};
  }
  root.TransitVisitors={Visitors,isNight,skyTone};
})(globalThis);
