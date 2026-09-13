(function(root){
  const clamp=v=>Math.max(0,Math.min(1,v));const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
  const part=(p,a,b)=>clamp((p-a)/(b-a));
  const track=(p,keys)=>{for(let i=1;i<keys.length;i++)if(p<=keys[i][0]){const [a,av]=keys[i-1],[b,bv]=keys[i];return av+(bv-av)*ease((p-a)/(b-a));}return keys.at(-1)[1];};
  function animate(action,p,t,s,d){
    const {r,line,text,skin,colors,ctx,robot,provider,opt}=d,c=skin.accent,beat=Math.floor(t*8)%2;
    const capsule=(x,y,opening=0)=>{r(x-4,y-3,9,7,skin.rim);r(x-3,y-2,7,5,colors.ink);r(x-2,y-1,5,3,c);if(opening)line(x+4,y-3,x+4+opening*4,y-3-opening*5,skin.rim,2);};
    switch(action){
      case 'idle':s.gaze=p<.2?-1:p<.43?1:0;s.headY=p>.46&&p<.64?1:0;if(p>.65&&p<.9)s.r=[track(p,[[.65,8],[.73,3],[.82,3],[.9,8]]),track(p,[[.65,-7],[.73,-28],[.82,-28],[.9,-7]])];s.eyes=p>.30&&p<.35?'blink':'normal';break;
      case 'walk':s.walk=1;s.x=Math.sin(p*Math.PI*2)*6;break;
      case 'arrive':{
        s.x=track(p,[[0,-19],[.18,-19],[.56,0],[1,0]]);s.walk=p>.18&&p<.57?1:0;if(p>.61&&p<.91)s.r=[10+beat,-21+beat];s.eyes=p>.63?'happy':'normal';
        if(!opt.mini)s.behind=()=>{r(-28,-30,17,31,skin.rim);r(-26,-28,13,28,colors.ink);r(-24,-26,9,2,c);const opening=track(p,[[0,0],[.2,1],[.72,1],[.95,0],[1,0]]);r(-26,-23,6*(1-opening),24,skin.shell);r(-20+6*opening,-23,7*(1-opening),24,skin.shell);};break;
      }
      case 'think':if(p<.24)s.r=[8+Math.sin(t*6),-24];if(p>.25&&p<.68){s.walk=1;s.x=Math.sin(part(p,.25,.68)*Math.PI*2)*8;s.gaze=s.x<0?-1:1;}if(p>.72){s.eyes='happy';s.r=[9,-15];}s.front=()=>{if(p>.72){r(10,-35,4,5,c);r(11,-29,2,1,skin.light);if(p<.87){line(7,-34,5,-35,c);line(17,-34,19,-35,c);r(11,-39,1,2,c);}}};break;
      case 'read':{
        const lift=track(p,[[0,0],[.08,0],[.24,1],[.82,1],[.98,0],[1,0]]),open=track(p,[[0,0],[.24,0],[.38,1],[.76,1],[.88,0],[1,0]]);
        const x=Math.round(10*(1-lift)),y=Math.round(-4-7*lift),w=2+Math.round(open*7),turn=p>.43&&p<.72?part(p,.43,.72):0,px=turn?Math.cos(turn*Math.PI)*7:7,py=turn?-Math.sin(turn*Math.PI)*9:0;
        s.gaze=turn?(turn<.5?1:-1):0;s.headY=p>.38&&p<.77?1:0;s.l=[x-w,y+1];s.r=turn?[x+px,y-5+py]:[x+w,y+1];
        s.front=()=>{r(x-w,y-5,w*2+1,9,c);r(x-w,y+4,w*2+1,1,skin.joint);if(open>.15){r(x-w+1,y-4,w-1,7,colors.white);r(x+1,y-4,w-1,7,colors.white);r(x,y-5,1,10,skin.joint);line(x-w+2,y-2,x-2,y-2,skin.rim);line(x+2,y-2,x+w-2,y-2,skin.rim);if(turn){for(let j=0;j<6;j++)line(x,y-4+j,x+px,y-5+py+j,colors.white);line(x+px,y-5+py,x+px,y+py+1,skin.rim);}}else r(x-w+1,y-4,Math.max(1,w*2-1),1,colors.white);};break;
      }
      case 'search':{
        const lift=track(p,[[0,0],[.15,1],[.8,1],[1,0]]),x=9+Math.sin(part(p,.18,.68)*Math.PI*2)*5,y=-8+Math.sin(part(p,.18,.68)*Math.PI)*6;s.y=p>.18&&p<.66?2:0;s.gaze=1;s.r=[x-3,y+5];if(p>.72){s.eyes='happy';s.l=[-7,-14];}
        s.front=()=>{if(lift>.1){const yy=y+(1-lift)*11;line(x-4,yy+6,x-1,yy+3,skin.joint,2);r(x-3,yy-4,7,1,c);r(x-4,yy-3,1,6,c);r(x+4,yy-3,1,6,c);r(x-3,yy+3,7,1,c);r(x-2,yy-2,2,1,colors.white);if(p>.64&&p<.84){r(x+8,yy-5,2,2,c);line(x+9,yy-9,x+9,yy-7,c);}}};break;
      }
      case 'type':{
        const carry=track(p,[[0,0],[.16,1],[.87,1],[1,0]]),lid=track(p,[[0,0],[.19,0],[.35,1],[.77,1],[.9,0],[1,0]]),x=6+Math.round(carry*4),y=-5-Math.round(carry*3),topY=y-2-lid*13,topX=x+12-lid*3;
        s.gaze=1;s.headY=p>.35&&p<.71?1:0;s.l=p>.34&&p<.71?[7,-9-(beat?0:2)]:[x-1,y];s.r=(p>.19&&p<.35)||(p>.77&&p<.9)?[topX,topY]:p>.35&&p<.71?[13,-9-(beat?2:0)]:p>.71&&p<.77?[14,-11]:[x+11,y];
        s.behind=()=>{r(6,-6,24,2,skin.rim);r(8,-4,2,5,colors.dark);r(26,-4,2,5,colors.dark);};
        s.front=()=>{r(x,y,17,2,skin.rim);r(x+2,y,10,1,skin.joint);r(x+5,y,2,1,c);const h=1+Math.round(lid*12);r(topX,topY,13,h,skin.rim);if(lid>.25){r(topX+1,topY+1,11,Math.max(1,h-2),colors.ink);if(lid>.8&&p>.37){const chars=Math.floor(part(p,.37,.7)*22);for(let k=0;k<4;k++)r(topX+2,topY+2+k*2,Math.max(0,Math.min(8,chars-k*5)),1,c);if(p<.71&&beat)r(topX+9,topY+8,1,2,skin.light);if(p>.71&&p<.8){r(topX+1,topY+1,11,h-2,colors.ink);line(topX+3,topY+6,topX+5,topY+8,c);line(topX+5,topY+8,topX+10,topY+3,c);}}}};break;
      }
      case 'tool':{
        const lift=track(p,[[0,0],[.18,1],[.77,1],[1,0]]),wrist=p>.25&&p<.7?Math.sin(t*7)*.8:0;s.r=[10+wrist*3,-7-lift*6];s.gaze=1;s.y=p>.28&&p<.7?beat:0;s.behind=()=>{r(19,-11,10,12,skin.rim);r(21,-8,6,5,colors.ink);r(23,-7,2,3,c);};s.front=()=>{if(lift>.08){const [x,y]=s.r,ex=x+5+wrist*4,ey=y-6+wrist*2;line(x,y,ex,ey,skin.rim,2);r(ex-1,ey-4,5,4,skin.rim);r(ex,ey-4,3,2,colors.ink);if(p>.7&&p<.87){r(28,-17,2,2,c);r(32,-13,1,2,c);}}};break;
      }
      case 'test':{
        const lift=track(p,[[0,0],[.16,1],[.65,1],[.87,0],[1,0]]),pour=p>.28&&p<.55?Math.sin(part(p,.28,.55)*Math.PI):0;s.r=[9+pour*5,-6-lift*12];s.gaze=1;s.eyes=p>.72?'up':'normal';s.behind=()=>{r(12,-1,18,2,colors.dark);r(18,-10,8,10,skin.rim);r(19,-9,6,8,colors.ink);r(20,-5,4,4,c);};s.front=()=>{const x=s.r[0]+1,y=s.r[1]-4;r(x,y,4,9,skin.rim);r(x+1,y+3,2,5,c);if(pour>.4)for(let i=0;i<3;i++)r(x+4+i,y+7+i*3,1,2,c);if(p>.4&&p<.87)for(let k=0;k<4;k++)r(19+k%3*2,-9-((t*7+k*4)%12),k%2+1,k%2+1,c);};break;
      }
      case 'send':{
        const load=track(p,[[0,0],[.42,0],[.68,1],[1,1]]),x=4+load*15,y=-8,fold=part(p,.03,.25);s.l=[x-4,y];s.r=[x+4,y];if(p>.7){s.r=[11,-19];s.l=[-8,-7];}s.behind=()=>{r(23,-15,10,16,skin.rim);r(24,-14,8,10,colors.ink);r(26,-12,4,6,colors.dark);};s.front=()=>{if(p<.3){r(-2,-14,12-fold*5,7-fold*3,colors.white);line(-2,-14,3,-10,c);line(3,-10,9-fold*5,-14,c);}if(p>.23&&p<.78)capsule(x,y,p<.42?1-part(p,.23,.42):0);if(p>.77&&p<.93){const q=part(p,.77,.93);capsule(28,-9-q*23);r(27,-5-q*23,2,2,c);}};break;
      }
      case 'receive':{
        const x=track(p,[[0,27],[.25,10],[.7,8],[1,8]]),y=track(p,[[0,-31],[.25,-12],[.55,-9],[1,-7]]);s.r=[x+3,y];s.l=p>.23?[x-5,y+1]:[-8,-7];s.y=p>.23&&p<.32?2:0;s.gaze=1;s.front=()=>{if(p<.8)capsule(x,y,p>.36?part(p,.36,.5):0);if(p>.52){const up=track(p,[[.52,0],[.68,1],[.85,1],[1,0]]);r(x-2,y-2-up*7,6,7,colors.white);line(x-1,y-up*7,x+2,y-up*7,skin.rim);line(x-1,y+2-up*7,x+1,y+2-up*7,skin.rim);}if(p<.25)r(x+7,y-4,3,1,c);};break;
      }
      case 'spawn':s.r=p<.27?[12,-7]:p>.68?[12,-15]:[8,-8];s.eyes=p>.6?'happy':'normal';s.gaze=1;s.behind=()=>{r(15,-8,8,9,skin.rim);r(17,-11,4,3,p>.18?c:colors.dark);r(28,-21,14,22,skin.rim);r(30,-19,10,18,colors.ink);};s.front=()=>{if(p>.29){const q=part(p,.29,.69);if(q<1)for(let k=0;k<3;k++)r(32+k*3,-4-q*16,1,2,c);if(p>.46&&opt.showMini!==false)robot(ctx,35,-1,provider,p>.74?'walk':'arrive',Math.max(0,p-.46)*8,{scale:.45,mini:true});}};break;
      case 'wait':{const raise=track(p,[[0,0],[.2,1],[.82,1],[1,0]]),wave=p>.2&&p<.8?Math.sin(t*5)*2:0;s.r=[9+wave,-7-raise*13];s.gaze=p>.55?0:1;s.eyes='up';s.front=()=>{const [x,y]=s.r;line(x,y+2,x,y-10,skin.rim);r(x+1,y-10,8,5,c);r(x+4,y-9,1,2,colors.ink);r(x+4,y-6,1,1,colors.ink);};break;}
      case 'error':if(p>.15&&p<.36)s.y=-Math.sin(part(p,.15,.36)*Math.PI)*7;s.r=p>.35&&p<.73?[12,-6]:p<.35?[10,-18]:[8,-7];s.eyes=p<.4?'surprise':p>.76?'sad':'normal';s.gaze=1;s.behind=()=>{r(21,-9,10,10,skin.rim);r(23,-6,3,2,colors.error);};s.front=()=>{if(p<.53)for(let k=0;k<4;k++)r(22+k*2+Math.sin(t*4+k)*2,-10-((t*9+k*4)%17),2,2,skin.rim);if(p>.36&&p<.76){r(11,-10,5,8,c);for(let k=0;k<5;k++)r(17+k*2,-9-k%2*2,2,1,colors.white);}if(p>.79)text('!',11,-31,colors.error);};break;
      case 'celebrate':{s.y=p<.2?ease(p/.2)*2:p<.62?-Math.sin(part(p,.2,.62)*Math.PI)*12:0;const lift=track(p,[[0,0],[.2,0],[.3,1],[.7,1],[1,0]]);s.l=[-10,-7-lift*16];s.r=[10,-7-lift*16];s.eyes='happy';s.front=()=>{if(p>.31&&p<.88){const q=part(p,.31,.88);for(let k=0;k<8;k++)r((k-3.5)*(3+q*4),-34+q*22-k%3*3,1+k%2,1,k%2?c:colors.white);}};break;}
      case 'compact':{const press=track(p,[[0,0],[.25,0],[.54,1],[.7,1],[.9,0],[1,0]]);s.l=[4,-16+press*8];s.r=[13,-16+press*8];s.y=press*2;s.gaze=1;s.front=()=>{if(p<.77){const count=Math.min(5,1+Math.floor(p/.05));for(let k=0;k<count;k++)r(4,-2-k*(3-press*2),11,1,k%2?c:colors.white);}else{r(3,-8,13,9,skin.rim);r(4,-7,11,7,colors.dark);r(8,-6,3,2,c);line(3,-9,3+part(p,.77,.91)*13,-9,skin.rim,2);}};break;}
      case 'pause':s.x=track(p,[[0,-5],[.16,2],[.3,0],[1,0]]);s.walk=p<.18?1:0;s.y=track(p,[[0,0],[.35,0],[.58,4],[1,4]]);s.l=p<.3?[-10,-12]:[-5,-5];s.r=p<.3?[10,-12]:[5,-5];s.eyes=p>.5?'flat':'normal';s.front=()=>{if(p<.24)for(let k=0;k<3;k++)r(-13-k*3,0,2,1,skin.rim);if(p>.68)text('II',12,-19,skin.rim);};break;
      case 'sleep':s.y=track(p,[[0,0],[.22,1],[.4,5],[.6,7],[1,7]])+(p>.6?Math.sin(t*2)*.5:0);s.eyes=p<.13?'normal':p<.3?'yawn':'closed';s.l=p>.35?[-6,-4]:[-7,-9];s.r=p>.35?[5,-5]:[5,-14];s.headY=p>.6?1:0;s.behind=()=>r(-10,0,22,2,colors.dark);s.front=()=>{if(p>.55){text('z',11,-17-(t*2)%4,skin.rim);text('z',17,-25-(t*2)%5,c);}};break;
      case 'wake':{s.y=track(p,[[0,7],[.2,7],[.48,0],[1,0]]);s.eyes=p<.15?'closed':p<.3?'wink':'normal';const stretch=track(p,[[0,0],[.37,0],[.55,1],[.75,1],[.95,0],[1,0]]);s.l=[-9-stretch*2,-7-stretch*17];s.r=[9+stretch*2,-7-stretch*17];if(p>.78)s.eyes='happy';break;}
      case 'archive':s.x=track(p,[[0,-7],[.3,12],[1,12]]);s.walk=p<.3?1:0;s.y=track(p,[[0,0],[.45,0],[.73,27],[1,29]]);s.r=p>.28&&p<.48?[11,-16]:[8,-7];s.behind=()=>r(1,-5,25,7,colors.dark);s.over=()=>{r(1,-7,25,9,skin.rim);r(3,-5,21,6,colors.dark);r(10,-4,6,1,skin.rim);const lid=track(p,[[0,0],[.27,0],[.41,1],[.79,1],[.92,0],[1,0]]);line(0,-8,25-25*lid,-8-15*lid,skin.rim,2);};break;
      case 'clean':{s.x=track(p,[[0,-6],[.2,-6],[.75,8],[1,8]]);s.walk=p>.2&&p<.75?.5:0;s.keepHands=true;const sweep=p>.15&&p<.82?Math.sin(t*5)*4:0;s.r=[10+sweep/2,-11];s.l=[3,-9];s.gaze=1;s.front=()=>{const x=13+sweep;line(7,-19,x,0,skin.rim);r(x-3,-3,7,4,c);r(x-2,0,1,2,skin.joint);r(x+1,0,1,2,skin.joint);};s.behind=()=>{for(let k=0;k<4;k++)if(p<.82)r(14+k*4+part(p,.2,.8)*11,0,1+k%2,1,skin.rim);r(31,-11,10,13,colors.dark);r(30,-13,12,2,skin.rim);};break;}
      case 'offline':{const plug=track(p,[[0,0],[.2,1],[.4,1],[.58,0],[.74,1],[1,1]]);s.r=[8+plug*4,-8];s.gaze=1;s.eyes=p>.7?'sad':'normal';s.front=()=>{line(3,-3,6,-1,colors.dark);line(6,-1,s.r[0],s.r[1],skin.rim);r(s.r[0]+1,s.r[1]-2,4,5,skin.rim);r(s.r[0]+5,s.r[1]-2,2,1,c);r(s.r[0]+5,s.r[1]+1,2,1,c);r(23,-11,5,7,colors.dark);if(p>.75)text('?',11,-31,skin.rim);};break;}
    }
    if(opt.free&&action==='arrive'){
      s.behind=()=>{};s.x=0;s.walk=0;s.y=p<.18?-Math.sin((1-p/.18)*Math.PI/2)*8:0;
    }
    if(opt.translating&&action==='walk')s.x=0;
    if(opt.social){
      s.eyes='happy';s.gaze=1;s.headY=0;s.x=0;
      const wave=Math.sin(t*8);
      s.l=[-8,-7];s.r=opt.social==='hello'?[10+wave*1.5,-23+wave]:[12,-14-Math.sin(t*2)*2];
    }
  }
  root.TransitGestures={animate};
})(globalThis);
