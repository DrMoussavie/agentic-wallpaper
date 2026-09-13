/* Locked model shared by every frame. Only gestures.js may move the joints. */
(function(root){
  const colors={codex:'#73d8e8',claude:'#edb56d',white:'#e4edec',shade:'#8da4b0',dark:'#35434e',ink:'#060b10',error:'#ed8582'};
  const MODEL=Object.freeze({headWidth:18,headHeight:14,bodyWidth:8,bodyHeight:9,
    codex:Object.freeze({shell:'#e4edec',light:'#fbfcf3',rim:'#96afbb',joint:'#597383',boot:'#7693a3',glove:'#f1f4ea',accent:colors.codex,antennae:1}),
    claude:Object.freeze({shell:'#525f70',light:'#8b9baa',rim:'#354553',joint:'#ac916b',boot:'#435666',glove:'#c9c8b9',accent:colors.claude,antennae:2})});
  function robot(ctx,x,y,provider='codex',action='idle',time=0,opt={}){
    const skin=MODEL[provider]||MODEL.codex, spec=root.TransitAnimations.ACTIONS[action]||root.TransitAnimations.ACTIONS.idle;
    const p=((time%spec.duration)+spec.duration)%spec.duration/spec.duration;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));if(opt.scale)ctx.scale(opt.scale,opt.scale);if(opt.flip)ctx.scale(-1,1);
    const r=(x,y,w,h,c=skin.shell)=>{if(w<=0||h<=0)return;ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
    const line=(x0,y0,x1,y1,c=skin.rim,width=1)=>{x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,e=dx+dy;for(let n=0;n<180;n++){r(x0,y0,width,width,c);if(x0===x1&&y0===y1)break;const e2=2*e;if(e2>=dy){e+=dy;x0+=sx;}if(e2<=dx){e+=dx;y0+=sy;}}};
    const text=(s,x,y,c=skin.accent)=>{ctx.font='5px monospace';ctx.fillStyle=c;ctx.fillText(s,Math.round(x),Math.round(y));};
    const pose={x:0,y:0,l:[-8,-7],r:[8,-7],gaze:0,eyes:'normal',walk:0,headY:0,feetX:0,behind:()=>{},front:()=>{},over:()=>{}};
    root.TransitGestures.animate(action,p,time,pose,{r,line,text,skin,colors,ctx,robot,provider,opt});
    if(['idle','think'].includes(action)&&!opt.translating){
      if(opt.mood==='grumpy'){pose.eyes='flat';pose.l=[3,-10];pose.r=[-3,-10];pose.walk=0;}
      if(opt.mood==='listening'){pose.r=[8,-25];pose.eyes='wink';pose.walk=0;}
    }
    // Garden situations reuse the same joints: no extra sprite sheet is needed for them.
    if(opt.expecting){pose.eyes='up';pose.gaze=1;pose.walk=0;pose.x=0;pose.headY=0;pose.l=[-8,-8];pose.r=[9,-15];}
    if(opt.throwing){const wind=Math.floor(time*6)%2;pose.eyes='up';pose.gaze=0;pose.walk=0;pose.x=0;pose.y=wind;pose.l=[-4,-30+wind];pose.r=[4,-30+wind];}
    if(opt.watching){pose.eyes='up';pose.gaze=1;pose.walk=0;pose.x=0;pose.l=[-8,-7];pose.r=[8,-7];}
    if(opt.holding){pose.keepHands=true;pose.l=[-8,-7];pose.r=[9,-10];}
    // The finished answer is shown as a small letter held up until it is read or the robot goes home.
    if(opt.delivered&&!opt.translating&&!opt.social){const front=pose.front;pose.r=[10,-19];pose.eyes=pose.eyes==='blink'?'blink':'normal';pose.front=()=>{front();const [hx,hy]=pose.r,lx=hx-4,ly=hy-10;r(lx,ly,9,7,skin.accent);r(lx+1,ly+1,7,5,colors.white);r(lx+1,ly+1,1,1,skin.accent);r(lx+7,ly+1,1,1,skin.accent);r(lx+2,ly+2,2,1,skin.accent);r(lx+5,ly+2,2,1,skin.accent);r(lx+4,ly+3,1,1,skin.accent);};}
    // Sitting on the bench: body lowered, hands on the knees, the letter stays up if there is one.
    if(opt.seated){pose.walk=0;pose.x=0;pose.y+=4;pose.headY=0;pose.feetX=5;pose.l=[-6,-4];pose.r=opt.delivered?[9,-17]:[6,-4];}
    if(opt.dance&&['idle','think'].includes(action)&&!opt.translating&&!opt.social){const beat=Math.floor(time*4)%2,hop=Math.floor(time*8)%2;pose.walk=0;pose.x=0;pose.eyes='happy';pose.headY=beat?1:0;pose.y=hop?-1:0;pose.l=[-9,beat?-19:-8];pose.r=[9,beat?-8:-19];}
    let lf=0,rf=0;if(pose.walk){const s=Math.sin(time*9);lf=Math.round(s*3*pose.walk);rf=-lf;pose.y+=Math.abs(s)>.7?-1:0;if(!pose.keepHands){pose.l=[-8,-7-s*3];pose.r=[8,-7+s*3];}}
    pose.behind();ctx.save();ctx.translate(Math.round(pose.x),Math.round(pose.y));
    if(action==='archive'){ctx.beginPath();ctx.rect(-50,-80,100,80-pose.y);ctx.clip();}
    const fx=pose.feetX;r(-5-lf+fx,-3-(lf<0?1:0),4,3,skin.boot);r(2-rf+fx,-3-(rf<0?1:0),4,3,skin.boot);r(-5-lf+fx,-3-(lf<0?1:0),3,1,skin.light);r(2-rf+fx,-3-(rf<0?1:0),3,1,skin.light);
    if(fx)r(-3,-4,fx+4,2,skin.joint);
    r(-4,-12,8,8,skin.rim);r(-3,-11,6,7);r(-2,-10,4,1,skin.light);r(-1,-8,2,2,skin.accent);r(-3,-4,6,1,skin.joint);
    const arm=(hand,side)=>{const sx=side*5,sy=-10,ex=(sx+hand[0])/2+side,ey=(sy+hand[1])/2+1;line(sx,sy,ex,ey,skin.joint,2);line(ex,ey,hand[0],hand[1],skin.shell,2);r(sx-1,sy-1,3,3,skin.rim);};
    arm(pose.l,-1);arm(pose.r,1);
    ctx.save();ctx.translate(0,pose.headY);
    // No animation branch can substitute another head, body or skin.
    r(-6,-27,12,1,skin.rim);r(-8,-26,16,13,skin.rim);r(-9,-24,18,9,skin.rim);r(-7,-26,14,12);r(-8,-24,16,9);r(-6,-26,12,1,skin.light);r(-8,-23,1,6,skin.light);
    r(-6,-23,12,8,colors.ink);r(-5,-24,10,1,skin.joint);r(-7,-22,1,6,skin.joint);
    if(skin.antennae===2){r(-6,-31,1,5,skin.joint);r(5,-31,1,5,skin.joint);r(-7,-32,3,2,skin.accent);r(4,-32,3,2,skin.accent);}else{r(0,-31,1,4,skin.joint);r(-1,-33,3,3,skin.accent);r(-1,-33,2,1,skin.light);}
    const e=pose.eyes,c=skin.accent,g=pose.gaze;
    if(['closed','blink','flat'].includes(e)){r(-4,-19,3,1,c);r(2,-19,3,1,c);}else if(e==='happy'){line(-4,-18,-3,-20,c);line(-3,-20,-2,-18,c);line(2,-18,3,-20,c);line(3,-20,4,-18,c);}else if(e==='sad'){r(-4,-20,2,2,c);r(2,-20,2,2,c);r(-4,-21,1,1,c);r(3,-21,1,1,c);}else{r(-4+g,-21,2,e==='surprise'?4:3,c);r(2+g,-21,2,e==='wink'?1:e==='surprise'?4:3,c);if(e==='yawn')r(-1,-17,2,2,c);}
    ctx.restore();pose.front();
    const mitten=([hx,hy])=>{r(hx-1,hy-2,3,5,skin.joint);r(hx-2,hy-1,5,3,skin.joint);r(hx-1,hy-1,3,3,skin.glove);r(hx-1,hy-1,2,1,skin.light);};mitten(pose.l);mitten(pose.r);
    ctx.restore();pose.over();ctx.restore();
  }
  function pet(ctx,x,y,time=0,opt={}){
    ctx.save();ctx.translate(Math.round(x),Math.round(y));if(opt.flip)ctx.scale(-1,1);
    const r=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(a,b,w,h);};
    const step=opt.moving===false?0:Math.floor(time*6)%2,tail=Math.floor(time*(opt.alert||opt.happy?9:4))%2;
    if(opt.happy)ctx.translate(0,-(Math.floor(time*6)%2));
    r(-5,-7,10,5,'#afc0c8');r(-4,-8,8,1,'#e4edec');r(4,-10,5,6,'#dce8e9');r(7,-8,2,2,'#73d8e8');r(4,-12,2,3,'#6b8190');r(-6,-4,2,4-step,'#829aa8');r(2,-4,2,3+step,'#829aa8');r(-8,-8-tail,4,2,'#afc0c8');
    if(opt.alert)r(4,-5,4,1,opt.alert==='error'?'#ed8582':'#edb56d');
    ctx.restore();
  }
  root.TransitSprites={robot,pet,colors,MODEL};
})(globalThis);
