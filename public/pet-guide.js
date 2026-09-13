(function(root){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class Guide {
    constructor(){this.x=null;this.y=null;this.time=0;this.targetId=null;this.reason=null;this.selectedAt=0;this.focusUntil=0;this.walking=false;this.facing=1;this.patrol=null;this.patrolIndex=0;this.restUntil=0;}
    update(dt,life,world,enabled,toy){
      this.enabled=enabled;this.walking=false;
      if(!enabled||world.mode==='live'&&world.connection!=='open'&&world.agents.size>0){this.targetId=null;this.reason=null;this.focusUntil=0;this.job=null;toy?.dogDestination(this,life,false);return;}
      this.time+=clamp(dt,0,.2);
      if(this.patrol){this.patrol.x=clamp(this.patrol.x,life.bounds.left,life.bounds.right);this.patrol.y=clamp(this.patrol.y,life.bounds.top,life.bounds.bottom);}
      const outside=life.outside(),priority=a=>a.agent.action==='wait'?0:1;
      const needs=outside.filter(a=>a.phase==='outside'&&!a.agent.resting&&!a.agent.retired&&['wait','error'].includes(a.agent.action))
        .sort((a,b)=>priority(a)-priority(b)||a.agent.since-b.agent.since||a.id.localeCompare(b.id));
      let target=needs.find(a=>a.id===this.targetId);
      if(!target||needs[0]&&priority(needs[0])<priority(target))target=needs[0];
      else if(needs.length>1&&this.time-this.selectedAt>12&&this.time>this.focusUntil&&Math.hypot(this.x-target.x,this.y-target.y)<48)target=needs[(needs.indexOf(target)+1)%needs.length];
      if((target?.id||null)!==this.targetId){this.targetId=target?.id||null;this.selectedAt=this.time;this.focusUntil=0;}
      this.reason=target?.agent.action||null;this.targetName=target?.agent.name||null;
      const toyTarget=toy?.dogDestination(this,life,!target);this.job=toyTarget?toy.state:null;
      const b=life.bounds;
      if(!target&&!toyTarget){
        if(this.patrol&&Math.hypot(this.x-this.patrol.x,this.y-this.patrol.y)<3){this.patrol=null;this.restUntil=this.time+2;}
        if(!this.patrol&&this.time>=this.restUntil){const i=++this.patrolIndex;this.patrol={x:b.left+(b.right-b.left)*(.12+((i*.61803398875)%1)*.76),y:b.top+(b.bottom-b.top)*(.12+((i*.41421356237)%1)*.76)};}
      }
      const destination=target?{x:target.x+(target.x+28>b.right?-24:24),y:target.y+10}:toyTarget?{...toyTarget}:this.patrol?{...this.patrol}:{x:this.x??life.scene.bench.x,y:this.y??life.scene.bench.y};
      const limitY=b.bottom;
      destination.x=clamp(destination.x,18,life.width-18);destination.y=clamp(destination.y,30,limitY);
      if(this.x===null){this.x=life.scene.bench.x-10;this.y=life.scene.bench.y+15;}
      this.x=clamp(this.x,18,life.width-18);this.y=clamp(this.y,30,life.height-20);
      const dx=destination.x-this.x,dy=destination.y-this.y,d=Math.hypot(dx,dy),speed=Math.max(28,Math.hypot(life.width,life.height)/(target?9:toyTarget?10:28)),step=Math.min(d,speed*clamp(dt,0,.2));
      if(d>1&&step>0){this.x+=dx/d*step;this.y+=dy/d*step;this.walking=true;if(Math.abs(dx)>1)this.facing=dx<0?-1:1;}
      if(toyTarget)toy.followDog(this);
    }
    hit(x,y){return this.enabled&&this.x!==null&&Math.abs(x-this.x)<15&&y>this.y-18&&y<this.y+6;}
    point(){if(this.targetId)this.focusUntil=this.time+7;return this.targetId;}
    snapshot(){return{x:this.x,y:this.y,targetId:this.targetId,reason:this.reason,targetName:this.targetName,job:this.job,walking:this.walking,focused:this.focusUntil>this.time};}
  }
  root.TransitPet={Guide};
})(globalThis);
