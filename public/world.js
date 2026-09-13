(function (root) {
  const { ACTIONS } = root.TransitAnimations;
  const key = (provider, id) => `${provider}:${id}`;
  const activeStates = new Set(['think','read','search','type','tool','test','send','receive','spawn','wait','compact','error']);
  function layout(width, height, count=0) {
    const portrait = height > width * 1.15;
    const edge = Math.max(12, Math.min(22, width * .05));
    const maxColumns=Math.max(1,Math.floor((width-20)/76));
    let columns=Math.min(Math.max(1,count),portrait?(count<=8?2:3):Math.max(2,Math.ceil(Math.sqrt(count*2))),maxColumns);
    while(Math.ceil(count/columns)*64>height-90&&columns<maxColumns)columns++;
    const rows=Math.max(1,Math.ceil(count/columns)),gap=Math.min(78,(height-90)/rows),bottom=height-47;
    const contentWidth=Math.min(width-24,columns*100),left=(width-contentWidth)/2;
    const stations=Array.from({length:count},(_,i)=>{const row=Math.floor(i/columns),remaining=Math.min(columns,count-row*columns),cell=contentWidth/columns;return{x:left+(columns-remaining)*cell/2+(i%columns+.5)*cell,y:bottom-(rows-1-row)*gap,index:i,row,side:i%columns<columns/2?0:1};});
    const dock={x:width*.2,y:height-15};
    return {width,height,portrait,edge,stations,dock,columns,rows,gap,hub:{x:width/2,y:height-16},top:stations[0]?.y-46||height-70,bottom:height-17};
  }
  function route(l, from, to) {
    const fx=from.x<l.width/2?l.edge:l.width-l.edge, tx=to.x<l.width/2?l.edge:l.width-l.edge;
    const points=[{x:from.x,y:from.y+6},{x:fx,y:from.y+6}];
    if(fx!==tx) points.push({x:fx,y:l.top},{x:tx,y:l.top});
    points.push({x:tx,y:to.y+6},{x:to.x,y:to.y+6});
    return points;
  }
  function atPath(points, progress) {
    const lengths=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
    let d=Math.max(0,Math.min(1,progress))*lengths.reduce((a,b)=>a+b,0);
    for(let i=0;i<lengths.length;i++){
      if(d<=lengths[i]||i===lengths.length-1){const f=lengths[i]?d/lengths[i]:1;return {x:points[i].x+(points[i+1].x-points[i].x)*f,y:points[i].y+(points[i+1].y-points[i].y)*f};}d-=lengths[i];
    }
    return points[0];
  }
  class World {
    constructor(){this.agents=new Map();this.packets=[];this.log=[];this.time=0;this.connection='connecting';this.mode='demo';this.events=0;this.overflow=0;this.sequence=0;this.seen=new Set();this.demoCursor=0;this.demoCycle=-1;this.demoPopulation=6;this.idleDelay=300;this.archiveDelay=480;}
    reset(mode=this.mode){this.agents.clear();this.packets=[];this.log=[];this.seen.clear();this.events=0;this.overflow=0;this.time=0;this.mode=mode;this.demoCursor=0;this.demoCycle=-1;}
    setAction(a,action,next=null){a.action=action;a.since=this.time;a.next=next;}
    getAgent(e,id=e.agentId||e.sessionId){
      const k=key(e.provider,id);let a=this.agents.get(k);
      if(!a){
        if(this.agents.size>=64){const old=[...this.agents.values()].find(v=>!activeStates.has(v.action));if(old)this.agents.delete(old.id);else{this.overflow++;return null;}}
        const used=new Set([...this.agents.values()].filter(v=>!v.retired).map(v=>v.slot));let slot=0;while(used.has(slot))slot++;
        a={id:k,provider:e.provider,name:e.label||`Agent ${++this.sequence}`,parent:null,action:'arrive',since:this.time,next:'idle',last:this.time,pending:new Map(),slot,retired:false};
        this.agents.set(k,a);
      }
      if(a.retired){const used=new Set([...this.agents.values()].filter(v=>v!==a&&!v.retired).map(v=>v.slot));let slot=0;while(used.has(slot))slot++;a.slot=slot;}
      a.last=this.time;a.retired=false;return a;
    }
    packet(from,to,provider,kind='data',delay=0){if(this.packets.length>=80)return;this.packets.push({from,to,provider,kind,start:this.time+delay,duration:kind==='prompt'?3.8:kind==='agent'?3.8:2.8});}
    apply(e){
      if(!e||!['codex','claude'].includes(e.provider)||!e.sessionId)return;
      if(e.id&&this.seen.has(e.id))return;
      if(e.id){this.seen.add(e.id);if(this.seen.size>512)this.seen.delete(this.seen.values().next().value);}
      const a=this.getAgent(e);if(!a)return;
      const parentId=e.parentId||(e.agentId&&e.agentId!==e.sessionId?e.sessionId:null);
      if(e.type!=='subagent_start'&&parentId&&key(e.provider,parentId)!==a.id){a.parent=key(e.provider,parentId);if(e.label)a.name=e.label;}
      if(['session_start','prompt','tool_start','tool_end','wait','error','compact_start','compact_end','subagent_start','message'].includes(e.type))a.resting=false;
      this.events++;this.log.unshift({time:this.time,provider:e.provider,type:e.type,label:e.label||a.name});this.log.length=Math.min(this.log.length,30);
      switch(e.type){
        case 'session_start': this.setAction(a,'arrive','idle');this.packet('dock',a.id,a.provider,'agent');break;
        case 'prompt': a.pending.clear();this.setAction(a,['sleep','archive'].includes(a.action)?'wake':'think','think');this.packet('hub',a.id,a.provider,'prompt');break;
        case 'tool_start': a.pending.set(e.toolId||'tool',e.action==='spawn'?'tool':e.action||'tool');this.setAction(a,e.action==='spawn'?'tool':e.action||'tool');break;
        case 'tool_end': a.pending.delete(e.toolId||'tool');if(e.error)this.setAction(a,'error',a.pending.size?[...a.pending.values()].at(-1):'think');else this.setAction(a,a.pending.size?[...a.pending.values()].at(-1):'receive',a.pending.size?null:'think');this.packet('hub',a.id,a.provider);if(e.action==='send'&&e.target&&e.success===true){const target=key(e.provider,e.target);if(this.agents.has(target))this.packet(a.id,target,a.provider,'mail',.3);}break;
        case 'wait': this.setAction(a,'wait');break;
        case 'error': a.pending.clear();this.setAction(a,'error');break;
        case 'stop': a.pending.clear();a.resting=true;this.setAction(a,'celebrate','idle');this.packet(a.id,'hub',a.provider,'result');break;
        case 'idle': if(!a.pending.size)this.setAction(a,'idle');break;
        case 'interrupt': a.pending.clear();this.setAction(a,'pause','idle');break;
        case 'compact_start':this.setAction(a,'compact');break;
        case 'compact_end':this.setAction(a,'receive','think');break;
        case 'subagent_start':{
          const parent=this.getAgent(e,e.sessionId);if(!parent||parent===a)break;parent.resting=false;const resumed=a.parent===parent.id;a.parent=parent.id;this.setAction(parent,'spawn',parent.pending.size?[...parent.pending.values()].at(-1):'think');this.setAction(a,resumed?'wake':'arrive','think');if(!resumed)this.packet(parent.id,a.id,a.provider,'agent',2);break;
        }
        case 'subagent_stop':a.pending.clear();a.resting=true;this.setAction(a,'celebrate','idle');this.packet(a.id,a.parent||key(e.provider,e.sessionId),a.provider,'mail',1.8);break;
        case 'session_end':a.pending.clear();a.resting=true;this.setAction(a,'archive','retired');break;
        case 'message':this.setAction(a,'send','think');if(e.target&&e.success===true){const target=key(e.provider,e.target);if(this.agents.has(target))this.packet(a.id,target,a.provider,'mail',2.8);}break;
      }
    }
    update(dt){
      this.time+=Math.max(0,Math.min(dt,.2));
      if(this.mode==='demo')this.demo();
      for(const a of this.agents.values()){
        const age=this.time-a.since;
        if(a.next&&age>=(ACTIONS[a.action]?.duration||4)){
          const next=a.next;if(next==='retired'){a.retired=true;a.action='idle';a.next=null;}else this.setAction(a,next);
        }
        if(!a.retired&&['idle','sleep'].includes(a.action)){
          if(this.time-a.last>this.archiveDelay)this.setAction(a,'archive','retired');
          else if(this.time-a.last>this.idleDelay&&a.action!=='sleep')this.setAction(a,'sleep');
        }
      }
      for(const p of this.packets){if(this.time>=p.start+p.duration&&['mail','prompt'].includes(p.kind)){const recipient=this.agents.get(p.to);if(recipient)recipient.reaction={action:'receive',since:this.time,kind:p.kind};}}
      this.packets=this.packets.filter(p=>this.time<p.start+p.duration);
    }
    visible(){return [...this.agents.values()].filter(a=>!a.retired).sort((a,b)=>a.slot-b.slot).slice(0,64);}
    population(activeOnly=false){const agents=this.visible().filter(a=>!activeOnly||!a.resting&&!['sleep','archive'].includes(a.action));return{conversations:agents.filter(a=>!a.parent).length,subagents:agents.filter(a=>a.parent).length,resting:agents.filter(a=>a.resting||['sleep','archive'].includes(a.action)).length};}
    restore(data,keepEffects=false){
      const packets=keepEffects?this.packets:[],reactions=keepEffects?new Map([...this.agents].map(([id,a])=>[id,a.reaction])):new Map();
      this.agents.clear();this.packets=[];if(!keepEffects)this.seen.clear();this.events=Number(data.eventsCount)||0;
      for(const raw of (data.agents||[]).slice(0,64)){
        if(!raw.id||!['codex','claude'].includes(raw.provider)||!ACTIONS[raw.action])continue;
        const reaction=reactions.get(raw.id);
        this.agents.set(raw.id,{...raw,pending:new Map(raw.pending||[]),since:this.time-Math.max(0,Number(raw.sinceAgo)||0),last:this.time-Math.max(0,Number(raw.lastAgo)||0),reaction:reaction&&this.time-reaction.since<4.4?reaction:null});
      }
      const known=id=>id==='hub'||id==='dock'||this.agents.has(id);
      this.packets=packets.filter(p=>this.time<p.start+p.duration&&known(p.from)&&known(p.to));
    }
    demo(){
      const cycle=Math.floor(this.time/112), t=this.time%112;
      if(cycle!==this.demoCycle){
        this.demoCycle=cycle;this.demoCursor=0;this.agents.clear();this.packets=[];
        const names=['Atlas','Miette','Pixel','Nougat','Echo','Biscotte'];
        Array.from({length:this.demoPopulation},(_,i)=>names[i]||`Mini ${i+1}`).forEach((name,i)=>{const e={provider:i%2?'claude':'codex',sessionId:`demo-${i}`,type:'session_start',label:name};this.apply(e);if(i>5){const a=this.agents.get(key(e.provider,e.sessionId));this.setAction(a,['read','type','search','test','think','tool'][i%6],'idle');a.since=this.time-i*.4;}});
      }
      const scenes=[
        [5,0,'read'],[5,1,'type'],[7,2,'search'],[8,3,'tool'],[9,4,'think'],[10,5,'sleep'],
        [17,0,'send'],[17,1,'test'],[20,2,'read'],[20,3,'compact'],[22,4,'wait'],[23,5,'wake'],
        [28,0,'spawn'],[30,1,'celebrate'],[32,2,'tool'],[34,3,'receive'],[36,5,'type'],
        [41,0,'type'],[42,1,'clean'],[44,2,'error'],[45,3,'read'],[47,4,'receive'],[48,5,'search'],
        [55,0,'test'],[56,1,'read'],[58,2,'tool'],[60,3,'send'],[60,4,'compact'],[61,5,'wait'],
        [69,0,'celebrate'],[70,1,'pause'],[72,2,'celebrate'],[73,3,'celebrate'],[75,4,'sleep'],[77,5,'receive'],
        [84,0,'archive'],[86,1,'sleep'],[87,2,'clean'],[88,3,'archive'],[90,5,'celebrate'],
        [98,1,'wake'],[98,2,'archive'],[100,4,'wake'],[102,5,'sleep']
      ];
      while(this.demoCursor<scenes.length&&scenes[this.demoCursor][0]<=t){
        const [at,i,action]=scenes[this.demoCursor++];const a=this.agents.get(key(i%2?'claude':'codex',`demo-${i}`));if(!a)continue;
        a.retired=false;a.resting=['celebrate','archive','sleep'].includes(action);a.last=this.time;this.setAction(a,action,action==='archive'?'retired':['sleep','wait'].includes(action)?null:'idle');
        this.events++;this.log.unshift({time:this.time,provider:a.provider,type:action,label:a.name});this.log.length=Math.min(this.log.length,30);
        if(['read','search','type','tool','test','compact'].includes(action)){this.packet(a.id,'hub',a.provider,'data',1);this.packet('hub',a.id,a.provider,'data',3.5);}
        if(action==='send'){const target=this.agents.get(key(a.provider,`demo-${(i+2)%6}`));this.packet(a.id,target?.id||'hub',a.provider,'mail',2.9);if(target)this.setAction(target,'receive');}
        if(action==='spawn'){
          const child=this.getAgent({provider:a.provider,sessionId:'demo-mini',label:'Petit Pixel'});child.parent=a.id;this.setAction(child,'arrive','idle');this.packet(a.id,child.id,a.provider,'agent',2.1);
        }
      }
      const child=this.agents.get('codex:demo-mini');if(child&&t>74&&!child.retired&&child.action!=='archive')this.setAction(child,'archive','retired');
    }
  }
  root.TransitWorld={World,layout,route,atPath,key};
})(globalThis);
