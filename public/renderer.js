(function(root){
  const {robot,colors}=root.TransitSprites;
  const {layout,route,atPath}=root.TransitWorld;
  const bubbles={think:'...',read:'READ',search:'?',type:'>_',tool:'>_',test:'TEST',wait:'!',error:'!',celebrate:'OK',compact:'ZIP',pause:'II',sleep:'zzz',send:'...',receive:'...',spawn:'+'};
  function createRenderer(canvas,world){
    const ctx=canvas.getContext('2d',{alpha:false});let W=0,H=0,scale=2,scene;
    const settings={labels:true,tubes:true,background:'black',density:1,scale:1};
    let positions=new Map();
    const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
    const text=(s,x,y,color='#6c818d',size=5,align='left')=>{ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.textAlign=align;ctx.fillText(s,Math.round(x),Math.round(y));ctx.textAlign='left';};
    const path=(pts,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(Math.round(p.x)+.5,Math.round(p.y)+.5):ctx.moveTo(Math.round(p.x)+.5,Math.round(p.y)+.5));ctx.stroke();};
    function resize(){const b=canvas.getBoundingClientRect();scale=Math.max(1,Math.round((b.width<600?2:b.width<1300?3:4)*settings.scale));W=Math.max(160,Math.floor(b.width/scale));H=Math.max(160,Math.floor(b.height/scale));if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}ctx.imageSmoothingEnabled=false;scene=layout(W,H);}
    function station(s,i){
      const c=i%2?colors.claude:colors.codex;
      box(s.x-31,s.y+8,62,1,'#25323a');box(s.x-25,s.y+10,50,1,'#10191e');box(s.x-27,s.y+9,2,5,'#1a242b');box(s.x+25,s.y+9,2,5,'#1a242b');
      box(s.x+24,s.y-7,8,14,'#152129');box(s.x+25,s.y-6,6,10,'#080f14');box(s.x+27,s.y-4,2,2,c);box(s.x+26,s.y+2,4,1,'#45525a');
      if(settings.labels)text(`${String(i+1).padStart(2,'0')} / ${['LECTURE','ATELIER','RECHERCHE','OUTILS','COURRIER','REPOS'][i]}`,s.x-28,s.y+21,'#465a66',4);
    }
    function bubble(value,x,y,color,t){
      if(!value)return;const width=Math.max(13,value.length*3+8);const bx=Math.max(2,Math.min(W-width-2,Math.round(x-width/2))),by=Math.max(4,Math.round(y-42-(Math.sin(t*2)>0?1:0)));
      box(bx,by,width,11,'#617782');box(bx+1,by+1,width-2,9,'#060c10');box(bx+width/2-1,by+11,3,2,'#617782');text(value,bx+width/2,by+7,color,5,'center');
    }
    function draw(){
      if(!scene)resize();const t=world.time;
      ctx.fillStyle=settings.background==='night'?'#020508':'#000000';ctx.fillRect(0,0,W,H);
      if(settings.background==='grid'){for(let x=10;x<W;x+=18)for(let y=10;y<H;y+=18)box(x,y,1,1,'#091117');}
      const l=scene;
      if(settings.tubes){
        const loop=[{x:l.edge,y:l.bottom},{x:l.edge,y:l.top},{x:W-l.edge,y:l.top},{x:W-l.edge,y:l.bottom}];path(loop,'#16252e',4);path(loop,'#020508',2);
        l.stations.forEach(s=>{const e=s.x<W/2?l.edge:W-l.edge;path([{x:e,y:s.y+6},{x:s.x+29,y:s.y+6}],'#172731',4);path([{x:e,y:s.y+6},{x:s.x+29,y:s.y+6}],'#020508',2);box(e-2,s.y+3,5,6,'#23343e');box(e-1,s.y+5,3,2,'#080e12');});
        path([{x:l.hub.x,y:l.hub.y+8},{x:l.hub.x,y:l.top}],'#172731',3);
        path([{x:l.edge,y:l.bottom},{x:l.dock.x,y:l.bottom},{x:l.dock.x,y:l.dock.y}],'#172731',3);
      }
      l.stations.forEach(station);
      // Small router / dispatch counter, never a large dashboard in the wallpaper.
      box(l.hub.x-17,l.hub.y-4,34,12,'#192730');box(l.hub.x-16,l.hub.y-3,32,10,'#050b0e');
      for(let k=0;k<4;k++)box(l.hub.x-11+k*7,l.hub.y,3,2,(Math.floor(t*2)+k)%4===0?'#6e9aab':'#29404d');
      if(settings.labels)text('TRANSIT',l.hub.x,l.hub.y-9,'#647c88',5,'center');
      box(l.dock.x-10,l.dock.y-20,19,21,'#24313a');box(l.dock.x-8,l.dock.y-18,15,19,'#070c10');box(l.dock.x-5,l.dock.y-16,9,2,colors.codex);box(l.dock.x-4,l.dock.y-3,8,3,'#1c2a33');
      // Mail shelf and a firmly anchored bin. No dragging or destructive controls.
      box(W*.69,H-31,24,11,'#1a2831');box(W*.69+1,H-30,22,9,'#0a1116');box(W*.69+10,H-28,5,1,'#4c5c66');
      const binx=W*.84;box(binx,H-35,11,14,'#26343c');box(binx-2,H-37,15,2,'#45535c');box(binx+3,H-39,5,2,'#45535c');for(let k=0;k<3;k++)box(binx+2+k*3,H-32,1,9,'#070d11');
      if(settings.labels){text('SAS',l.dock.x,l.dock.y+9,'#4c6571',4,'center');text('DORTOIR',W*.69+12,H-14,'#4c6571',4,'center');}
      positions=new Map();const agents=world.visible();
      agents.forEach((a,i)=>{const index=a.slot<12?a.slot:i,slot=l.stations[index%6],stack=Math.floor(index/6);positions.set(a.id,{x:slot.x+(stack?11:-11),y:slot.y,slot:index%6});});
      const lookup=id=>id==='dock'?l.dock:id==='hub'?l.hub:positions.get(id)||l.hub;
      for(const p of world.packets){if(t<p.start)continue;const progress=(t-p.start)/p.duration;const from=lookup(p.from),to=lookup(p.to),pts=route(l,from,to),pos=atPath(pts,progress);const c=colors[p.provider];
        if(p.kind==='agent'){box(pos.x-4,pos.y-5,8,10,'#3d5663');box(pos.x-3,pos.y-4,6,8,'#071014');box(pos.x-2,pos.y-2,4,3,c);}
        else{const tail=atPath(pts,Math.max(0,progress-.035));box(tail.x-1,tail.y-1,2,2,'#355263');box(pos.x-2,pos.y-2,p.kind==='mail'?6:4,4,c);if(p.kind==='mail')box(pos.x-1,pos.y-1,3,1,'#080c0e');}
      }
      agents.forEach((a,i)=>{
        const pos=positions.get(a.id);let age=t-a.since;
        let action=world.mode==='live'&&world.connection==='offline'?'offline':a.action;
        if(a.reaction&&t-a.reaction.since<4.4&&world.connection!=='offline'){action=a.reaction.action;age=t-a.reaction.since;}
        const arrival=world.packets.find(p=>p.kind==='agent'&&p.to===a.id&&t<p.start+p.duration);
        if(arrival&&t>=arrival.start)return;
        const walk=action==='walk'?Math.sin(age*1.5)*13:0;
        robot(ctx,pos.x+walk,pos.y,a.provider,action,age,{scale:a.parent?.8:1});
        bubble(bubbles[action],pos.x,pos.y,action==='error'?colors.error:colors[a.provider],age);
        if(settings.labels){const label=a.name.length>12?a.name.slice(0,11)+'…':a.name;text(label,pos.x,pos.y+7,'#7b929f',4,'center');}
        if(a.parent)box(pos.x-1,pos.y+13,2,2,colors[a.provider]);
      });
      if(settings.labels){
        text('AGENT / TRANSIT',l.edge,18,'#6f8693',5);text(world.mode==='demo'?'SIMULATION':world.connection==='open'?'EN DIRECT':world.connection==='offline'?'SIGNAL PERDU':'CONNEXION',W-l.edge,18,world.mode==='demo'?'#aa906a':'#61928c',4,'right');
        const count=[...world.agents.values()].filter(a=>!a.retired).length;const extra=Math.max(0,count-agents.length)+world.overflow;
        text(`${count} AGENT${count>1?'S':''}${extra?' / +'+extra+' HORS CHAMP':''}`,l.edge,H-7,'#48606d',4);
      }
      if(!agents.length&&world.mode==='live'){text(world.connection==='open'?'LA STATION ATTEND TES AGENTS':'LE PONT LOCAL EST HORS LIGNE',W/2,H*.51,'#516a77',5,'center');text('LES NOUVELLES SESSIONS APPARAÎTRONT ICI',W/2,H*.51+11,'#31424c',4,'center');}
    }
    return {draw,resize,settings,get scene(){return scene;},hit(x,y){return [...positions].find(([,p])=>Math.abs(p.x-x/scale)<12&&Math.abs(p.y-y/scale)<30)?.[0];}};
  }
  root.TransitRenderer={createRenderer};
})(globalThis);
