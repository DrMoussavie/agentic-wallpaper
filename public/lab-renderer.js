(function(root){
  const {robot,pet,colors}=root.TransitSprites,{layout,atPath}=root.TransitWorld;
  const bubbles={think:'...',read:'READ',search:'?',type:'>_',tool:'>_',test:'TEST',wait:'!',error:'!',celebrate:'OK',compact:'ZIP',pause:'II',sleep:'z',spawn:'+'};
  function createRenderer(canvas,world){
    const ctx=canvas.getContext('2d',{alpha:false});let W=0,H=0,scale=2,scene,signature='',previousTime=0;let positions=new Map();
    const settings={labels:true,tubes:true,background:'black',scale:1,pet:false};
    const box=(x,y,w,h,c)=>{if(w<=0||h<=0)return;ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
    const text=(s,x,y,c='#637c89',size=5,align='left')=>{ctx.font=`${size}px monospace`;ctx.fillStyle=c;ctx.textAlign=align;ctx.fillText(s,Math.round(x),Math.round(y));ctx.textAlign='left';};
    const path=(pts,c,w=1)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineJoin='bevel';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(Math.round(p.x)+.5,Math.round(p.y)+.5):ctx.moveTo(Math.round(p.x)+.5,Math.round(p.y)+.5));ctx.stroke();};
    function resize(){const b=canvas.getBoundingClientRect();const n=world.visible().length;scale=Math.max(1,Math.min(Math.floor(b.width/180),Math.round((b.width<600?2:b.width<1400?3:4)*settings.scale)));let trial;do{W=Math.max(140,Math.floor(b.width/scale));H=Math.max(140,Math.floor(b.height/scale));trial=layout(W,H,n);if(trial.gap>=58||scale===1)break;scale--;}while(scale>=1);if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;positions.clear();}ctx.imageSmoothingEnabled=false;scene=trial;signature=world.visible().map(a=>a.id).join('|');}
    function bubble(a,pos,t){const val=bubbles[a.action];if(!val)return;const width=val.length*3+8,x=Math.max(2,Math.min(W-width-2,pos.x-width/2)),y=Math.max(26,pos.y-45);box(x+1,y,width-2,10,'#cbdadd');box(x,y+1,width,8,'#cbdadd');box(x+width/2,y+10,2,2,'#cbdadd');text(val,x+width/2,y+7,a.action==='error'?'#ac4948':'#1a343f',5,'center');}
    function draw(){
      const agents=world.visible(),sig=agents.map(a=>a.id).join('|');if(!scene||sig!==signature)resize();const t=world.time,dt=Math.max(0,t-previousTime);previousTime=t;const blend=1-Math.exp(-Math.min(dt,.2)*7);
      ctx.fillStyle=settings.background==='night'?'#03080c':'#000';ctx.fillRect(0,0,W,H);if(settings.background==='grid')for(let x=12;x<W;x+=22)for(let y=30;y<H;y+=22)box(x,y,1,1,'#0d151a');
      const current=new Map();agents.forEach((a,i)=>{const target=scene.stations[i],prior=positions.get(a.id);current.set(a.id,prior?{x:prior.x+(target.x-prior.x)*blend,y:prior.y+(target.y-prior.y)*blend}:{x:target.x,y:target.y});});positions=current;
      const lookup=id=>id==='hub'?scene.hub:id==='dock'?scene.dock:positions.get(id);
      const tubeRoute=(from,to)=>{const fx=from.x<W/2?scene.edge:W-scene.edge,tx=to.x<W/2?scene.edge:W-scene.edge;const pts=[{x:from.x+22,y:from.y+7},{x:fx,y:from.y+7}];if(fx!==tx)pts.push({x:fx,y:scene.bottom},{x:tx,y:scene.bottom});pts.push({x:tx,y:to.y+7},{x:to.x+22,y:to.y+7});return pts;};
      if(settings.tubes&&agents.length){
        // Only occupied modules produce connections; no permanent perimeter or empty desks.
        for(const side of [0,1]){const points=agents.map(a=>positions.get(a.id)).filter(p=>(p.x<W/2?0:1)===side);if(points.length){const x=side?W-scene.edge:scene.edge,minY=Math.min(...points.map(p=>p.y));path([{x,y:minY+7},{x,y:scene.bottom},{x:scene.hub.x,y:scene.bottom}],'#1a2d38',2);path([{x,y:minY+7},{x,y:scene.bottom},{x:scene.hub.x,y:scene.bottom}],'#78929d',1);}}
        agents.forEach(a=>{const p=positions.get(a.id),edge=p.x<W/2?scene.edge:W-scene.edge;path([{x:edge,y:p.y+7},{x:p.x+22,y:p.y+7}],'#36505d');});
      }
      agents.forEach((a,i)=>{
        const pos=positions.get(a.id),c=colors[a.provider];box(pos.x-21,pos.y+4,49,2,'#c3d1d7');box(pos.x-19,pos.y+6,45,2,'#647c89');box(pos.x-14,pos.y+8,31,1,'#13232c');
        // Small white ceramic connector with an exposed cyan/amber status window.
        box(pos.x+23,pos.y-6,6,10,'#cbd8db');box(pos.x+24,pos.y-5,4,6,'#0c1b22');box(pos.x+25,pos.y-4,2,3,c);
        if(a.parent&&positions.has(a.parent)){box(pos.x-20,pos.y+1,3,2,c);if(settings.labels)text('↳',pos.x-28,pos.y+3,c,5);}
      });
      // Shared arrival hatch + compact router; small equipment anchored below the population.
      box(scene.hub.x-9,scene.hub.y-3,18,7,'#bdcdd4');box(scene.hub.x-7,scene.hub.y-2,14,4,'#13252e');for(let k=0;k<3;k++)box(scene.hub.x-5+k*4,scene.hub.y-1,2,1,k===Math.floor(t*2)%3?'#83dce5':'#3e606e');
      const bx=W*.82;box(bx, H-22,10,11,'#91a8b4');box(bx-1,H-24,12,2,'#d6e1e2');box(bx+2,H-19,1,6,'#3d5665');box(bx+6,H-19,1,6,'#3d5665');
      if(settings.pet)pet(ctx,W*.32+Math.sin(t*.35)*12,H-12,t);
      for(const p of world.packets){if(t<p.start)continue;const from=lookup(p.from),to=lookup(p.to);if(!from||!to)continue;const pts=tubeRoute(from,to),q=(t-p.start)/p.duration,pos=atPath(pts,q),tail=atPath(pts,Math.max(0,q-.025)),c=colors[p.provider];box(tail.x-1,tail.y-1,2,2,'#567888');if(p.kind==='agent'){box(pos.x-3,pos.y-4,7,9,'#d2e0e2');box(pos.x-2,pos.y-3,5,7,'#0d202b');box(pos.x-1,pos.y-1,3,2,c);}else{box(pos.x-2,pos.y-1,p.kind==='mail'?5:4,3,c);box(pos.x-1,pos.y,2,1,'#e4f5f4');}}
      agents.forEach(a=>{const pos=positions.get(a.id),offline=world.mode==='live'&&world.connection==='offline';let action=offline?'offline':a.action,age=t-a.since;if(a.reaction&&t-a.reaction.since<4.4&&!offline){action='receive';age=t-a.reaction.since;}const travelling=world.packets.find(p=>p.kind==='agent'&&p.to===a.id&&t>=p.start&&t<p.start+p.duration);if(travelling)return;robot(ctx,pos.x-6,pos.y,a.provider,action,age,{scale:a.parent?.78:1,showMini:false});if(!a.parent)bubble({...a,action}, {x:pos.x-6,y:pos.y},t);if(settings.labels)text(a.name.slice(0,13),pos.x,pos.y+16,'#839aa6',4,'center');});
      text('AGENT / TRANSIT',scene.edge,17,'#7c939e',5);text(world.mode==='demo'?'DÉMO':world.connection==='open'?'LIVE':world.connection==='offline'?'HORS LIGNE':'CONNEXION',W-scene.edge,17,world.mode==='demo'?'#af9d7f':'#82a5a4',4,'right');
      if(settings.labels)text(`${agents.length} AGENT${agents.length>1?'S':''}`,scene.edge,H-4,'#486574',4);
      if(!agents.length&&world.mode==='live'){text('LE LABO ATTEND TES AGENTS',W/2,H*.65,'#8299a5',5,'center');text(world.connection==='open'?'PONT CONNECTÉ · AUCUN ÉVÉNEMENT REÇU':'DÉMARRER LE PONT LOCAL',W/2,H*.65+10,'#455e6d',4,'center');}
    }
    return{draw,resize,settings,clear(){positions.clear();previousTime=0;signature='';},get scene(){return scene;},get positions(){return positions;},hit(x,y){return [...positions].find(([,p])=>Math.abs(p.x-x/scale)<15&&Math.abs(p.y-y/scale)<32)?.[0];}};
  }
  root.TransitRenderer={createRenderer};
})(globalThis);
