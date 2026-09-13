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
  class Sky {
    constructor(seed=1){this.random=root.TransitLife.random(seed^0x751af);this.key='';this.stars=[];this.clouds=[];this.meteor=null;this.nextMeteor=0;this.wasNight=false;this.events=0;}
    update(time,width,height,light){
      const key=width+':'+height,random=this.random;
      if(key!==this.key){
        this.key=key;this.meteor=null;this.stars=[];this.clouds=[];
        const count=clamp(Math.round(width*height/1600),18,110);
        for(let i=0;i<count;i++)this.stars.push({x:12+random()*(width-24),y:10+random()*(height-20),
          phase:random()*Math.PI*2,speed:.35+random()*1.6,period:16+random()*45,
          size:random()<.18?2:1,warm:random()<.3});
        for(let i=0;i<clamp(Math.round(width/230),2,10);i++)this.clouds.push({
          x:random()*(width+120),y:22+random()*Math.max(2,height-44),w:28+random()*42,
          speed:.8+random()*2.2,phase:random()*6,kind:random()<.5?1:2,opacity:.2+random()*.22});
      }
      const night=light<.9;
      if(!night){this.meteor=null;this.wasNight=false;return;}
      if(!this.wasNight){this.nextMeteor=time+4+random()*6;this.wasNight=true;}
      if(this.meteor&&time>this.meteor.start+this.meteor.duration+.5)this.meteor=null;
      if(!this.meteor&&time>=this.nextMeteor){
        const direction=random()<.5?-1:1,length=Math.min(width*.6,90+random()*190);
        const x=direction<0?width-12-random()*Math.max(1,width-length-24):12+random()*Math.max(1,width-length-24);
        const y=12+random()*Math.max(1,height*.32-12);
        this.meteor={x,y,dx:direction*length,dy:Math.min(height-y-8,18+random()*height*.3),start:time,duration:.65+random()*.65};
        this.events++;this.nextMeteor=time+14+random()*24;
      }
    }
    brightness(star,time){
      // Independent slow visibility envelopes and quick glints: positions stay still.
      const envelope=.5+.5*(.5+.5*Math.sin(time*Math.PI*2/star.period+star.phase));
      const glint=Math.pow(.5+.5*Math.sin(time*star.speed+star.phase),6);
      return (.28+glint*.65)*envelope;
    }
    snapshot(){return{stars:this.stars.length,clouds:this.clouds.length,events:this.events,meteor:this.meteor?{...this.meteor}:null,nextMeteor:this.nextMeteor};}
  }
  class Footprints {
    constructor(){this.marks=[];this.last=new Map();this.time=-1;this.size='';}
    update(time,walkers,width,height){
      const size=width+':'+height;
      if(size!==this.size||time<this.time){this.marks=[];this.last.clear();this.size=size;this.time=-1;}
      if(time===this.time)return;
      this.time=time;this.marks=this.marks.filter(m=>time-m.time<8);
      const present=new Set();
      for(const w of walkers){
        present.add(w.id);const old=this.last.get(w.id),d=old?Math.hypot(w.x-old.x,w.y-old.y):0;
        if(!old||!w.walking||d>40){this.last.set(w.id,{x:w.x,y:w.y,side:old?.side||1});continue;}
        if(d<(w.dog?5:7))continue;
        const ux=(w.x-old.x)/d,uy=(w.y-old.y)/d,side=-old.side;
        this.marks.push({x:Math.round(w.x-ux*4-uy*side*2),y:Math.round(w.y-uy*4+ux*side*2),angle:Math.atan2(uy,ux)+Math.PI/2,time,dog:!!w.dog});
        this.last.set(w.id,{x:w.x,y:w.y,side});
      }
      for(const id of this.last.keys())if(!present.has(id))this.last.delete(id);
      if(this.marks.length>128)this.marks.splice(0,this.marks.length-128);
    }
  }
  function skyTone(hour){
    const h=((hour%24)+24)%24;
    const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
    const light=smooth((h-6)/2)*(1-smooth((h-19)/2));
    const warm=Math.max(0,1-Math.abs(h-7)/1.5,1-Math.abs(h-19.5)/1.5);
    const mix=(a,b,k)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k));
    const rgb=a=>'rgb('+a.join(',')+')';
    return{light,sky:rgb(mix(mix([18,42,94],[48,98,145],light),[82,65,79],warm*.38)),
      horizon:rgb(mix(mix([22,43,79],[55,88,111],light),[101,77,68],warm*.4)),
      ground:rgb(mix([5,9,11],[22,29,29],light))};
  }
  root.TransitVisitors={Visitors,Sky,Footprints,isNight,skyTone};
})(globalThis);
