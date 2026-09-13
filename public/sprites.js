/* Pixel-native animation, deliberately independent of imprecise generated-sheet alignment. */
(function (root) {
  const colors = { codex: '#69d7ee', claude: '#efb76c', white: '#dae5eb', shade: '#778c9a', dark: '#263541', ink: '#05090c', error: '#ed8582' };
  const ease = v => Math.max(0, Math.min(1, v)) ** 2 * (3 - 2 * Math.max(0, Math.min(1, v)));
  function robot(ctx, x, y, provider = 'codex', action = 'idle', time = 0, opt = {}) {
    const spec = root.TransitAnimations.ACTIONS[action] || root.TransitAnimations.ACTIONS.idle;
    const p = ((time % spec.duration) + spec.duration) % spec.duration / spec.duration;
    const step = Math.floor(time * 7) % 4;
    const accent = colors[provider] || colors.codex;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (opt.scale) ctx.scale(opt.scale, opt.scale);
    if (opt.flip) ctx.scale(-1, 1);
    const r = (a,b,w,h,c=colors.white) => { ctx.fillStyle=c; ctx.fillRect(Math.round(a),Math.round(b),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))); };
    const line = (a,b,c,d,color=colors.shade) => { ctx.strokeStyle=color; ctx.lineWidth=1; ctx.beginPath();ctx.moveTo(Math.round(a)+.5,Math.round(b)+.5);ctx.lineTo(Math.round(c)+.5,Math.round(d)+.5);ctx.stroke(); };
    const text = (str,a,b,c=accent) => {ctx.fillStyle=c;ctx.font='5px monospace';ctx.fillText(str,Math.round(a),Math.round(b));};
    const parcel = (px,py,open=false) => {r(px,py,9,7,colors.shade);r(px+1,py+1,7,5,colors.dark);r(px+4,py,1,7,accent);if(open){line(px,py,px-2,py-3);line(px+9,py,px+11,py-3);}};
    let bob=0, lean=0, left=0, right=0, crouch=0, eye='normal', walking=false;
    if(action==='walk') walking=true;
    if(action==='arrive') {ctx.globalAlpha=p<.15?ease(p/.15):1;lean=-8*(1-ease(p/.5));right=p>.65?-6:0;}
    if(action==='think'){walking=p>.28&&p<.70;lean=walking?Math.sin(p*16)*7:0;right=p<.28?-5:0;eye=p>.72?'idea':'normal';}
    if(action==='read'){left=p>.13&&p<.86?-2:0;right=left;lean=p>.3&&p<.8?1:0;}
    if(action==='search'){lean=p>.2&&p<.75?3:0;crouch=p>.2&&p<.7?2:0;right=p<.82?-3:0;}
    if(action==='type'){left=p>.15&&p<.73?(step%2?-2:0):0;right=p>.15&&p<.73?(step%2?0:-2):p>.82?-6:0;}
    if(action==='tool'){right=p>.16&&p<.80?Math.sin(time*9)*3-3:0;lean=p>.16&&p<.8?step%2:0;}
    if(action==='test'){right=p>.2&&p<.65?-6+Math.sin(time*5)*2:0;left=-1;}
    if(action==='send'){right=p<.7?-2:p<.9?-6:0;left=p<.5?-2:0;}
    if(action==='receive'){right=p<.6?-5:-2;left=p>.35?-2:0;bob=p>.23&&p<.35?1:0;}
    if(action==='spawn'){right=p<.4?-3:p>.72?-6:0;}
    if(action==='wait'){right=-8+(Math.sin(time*5)>0?1:0);eye='up';}
    if(action==='error'){bob=p>.15&&p<.4?-Math.sin((p-.15)*Math.PI/.25)*6:0;lean=p>.5&&p<.8?Math.sin(time*13)*2:0;eye='error';right=p>.5?-4:0;}
    if(action==='celebrate'){crouch=p<.18?2:0;bob=p>.18&&p<.65?-Math.sin((p-.18)/.47*Math.PI)*10:0;left=p>.18&&p<.75?-7:0;right=left;eye='happy';}
    if(action==='compact'){crouch=p>.32&&p<.7?Math.sin((p-.32)/.38*Math.PI)*3:0;left=-1;right=-1;}
    if(action==='pause'){crouch=ease(p/.5)*4;eye='flat';}
    if(action==='sleep'){crouch=ease(p/.4)*6;eye=p>.22?'closed':'normal';bob=p>.5?Math.sin(time*2)*.5:0;}
    if(action==='wake'){crouch=6*(1-ease(p/.5));left=p>.45&&p<.85?-8:0;right=left;eye=p<.17?'closed':'normal';}
    if(action==='archive'){walking=p<.27;lean=9*ease(p/.32);crouch=p>.5?(p-.5)*36:0;}
    if(action==='clean'){walking=p<.2||p>.85;lean=Math.sin(time*2)*3;right=-2;}
    if(action==='offline'){eye='flat';right=p>.15&&p<.7?-3:0;}
    if(walking){bob=step%2?-1:0;left=step===0?-2:step===2?1:0;right=-left;}
    ctx.save();ctx.translate(Math.round(lean),Math.round(bob+crouch));
    if(action==='archive'&&p>.52){ctx.beginPath();ctx.rect(-50,-60,100,60-crouch);ctx.clip();}
    // Feet articulate separately: four real walk frames, alternating arm swings.
    r(-5,-2,4,2,colors.shade);r(2,-2,4,2,colors.shade);
    if(walking){r(-5-(step===0?2:0),-2-(step===1?1:0),4,2);r(2+(step===2?2:0),-2-(step===3?1:0),4,2);}
    r(-4,-10,8,8,colors.shade);r(-3,-10,6,6);r(-1,-8,2,2,accent);
    r(-8,-22,16,12,colors.shade);r(-7,-23,14,12);r(-8,-21,16,9);r(-5,-20,10,7,colors.ink);
    r(-6,-21,12,1,colors.shade);
    if(provider==='claude'){r(-7,-27,1,4,colors.shade);r(6,-27,1,4,colors.shade);r(-8,-28,2,2,accent);r(6,-28,2,2,accent);}
    else{r(0,-27,1,4,colors.shade);r(-1,-28,3,2,accent);}
    const blink = Math.floor(time*5)%29===1;
    if(eye==='closed'||blink||eye==='flat'){r(-4,-17,3,1,accent);r(2,-17,3,1,accent);}
    else if(eye==='happy'){line(-4,-16,-3,-18,accent);line(-3,-18,-2,-16,accent);line(2,-16,3,-18,accent);line(3,-18,4,-16,accent);}
    else if(eye==='error'){line(-4,-18,-2,-16,colors.error);line(-4,-16,-2,-18,colors.error);r(2,-18,2,3,colors.error);}
    else{r(-4,eye==='up'?-19:-18,2,3,accent);r(2,eye==='up'?-19:-18,2,3,accent);}
    r(-8,-10+left,3,5,colors.shade);r(-9,-7+left,3,3);r(6,-10+right,3,5,colors.shade);r(7,-7+right,3,3);
    if(action==='think'&&p>.73){r(11,-31,3,4,accent);r(12,-26,1,1);line(8,-30,6,-31,accent);line(17,-30,19,-31,accent);}
    if(action==='read'&&p>.08&&p<.94){
      const opening=ease((p-.12)/.12)*(1-ease((p-.82)/.10));
      const width=2+Math.round(opening*7), by=-6+Math.round((1-opening)*3);
      r(-width,by-6,width*2+1,9,accent);r(-width+1,by-5,width-1,7,colors.white);r(1,by-5,width-1,7,colors.white);r(0,by-6,1,9,colors.dark);
      if(opening>.8){line(-width+2,by-3,-2,by-3,colors.shade);line(2,by-3,width-2,by-3,colors.shade);const page=Math.sin(time*4);line(0,by-6,Math.round(page*6),by-8,colors.white);line(Math.round(page*6),by-8,Math.round(page*6),by-1,colors.white);}
    }
    if(action==='search'&&p>.08&&p<.87){const mx=11+Math.sin(time*3)*3,my=-11+Math.sin(time*2)*3;ctx.strokeStyle=accent;ctx.strokeRect(Math.round(mx)-3,Math.round(my)-3,6,6);line(mx-2,my+3,mx-5,my+7);if(p>.64)text('!',mx+4,my-5);}
    if(action==='type'){r(9,-8,15,1,colors.shade);r(11,-19,13,10,colors.shade);r(12,-18,11,8,colors.ink);for(let j=0;j<3;j++){r(13,-16+j*2,2+((step+j)%4),1,accent);}r(10,-7,1,7,colors.dark);r(22,-7,1,7,colors.dark);r(7,-9,6,1,accent);}
    if(action==='tool'&&p>.1&&p<.88){const wy=-15+right;line(10,wy,15,wy-5);r(14,wy-8,4,4,colors.shade);r(15,wy-8,2,2,colors.ink);if(p>.45&&p<.65)r(20,-9,2,2,accent);}
    if(action==='test'){r(10,-2,15,2,colors.dark);for(let k=0;k<3;k++){r(11+k*5,-10-k%2*3,3,9+k%2*3,colors.shade);r(12+k*5,-5,1,3,accent);}if(p>.32&&p<.74){for(let k=0;k<3;k++)r(12+k*4,-12-((time*7+k*3)%9),1,1,accent);}}
    if(action==='send'&&p<.77){const dx=p>.5?10+ease((p-.5)/.27)*9:5;parcel(dx,-8,p<.24);if(p<.3){r(7,-14,6,5);line(7,-14,10,-11,accent);line(10,-11,13,-14,accent);}}
    if(action==='receive'&&p>.15){parcel(9,-12+ease((p-.15)/.3)*4,p>.45);if(p>.65)r(9,-15,5,6);}
    if(action==='spawn'){r(13,-7,8,7,colors.dark);r(14,-9,6,2,p>.22?accent:colors.shade);if(p>.3&&p<.7){r(25,-Math.round((p-.3)*30),5,7,accent);r(26,2-Math.round((p-.3)*30),3,2,colors.ink);}}
    if(action==='wait'){line(10,-12+right,10,-25+right,colors.shade);r(11,-25+right,7,5,accent);}
    if(action==='error'&&p<.7){for(let k=0;k<3;k++)r(13+k*3+Math.sin(time*3+k)*2,-13-(time*8+k*4)%15,2,2,colors.shade);}
    if(action==='celebrate'&&p>.3&&p<.85){for(let k=0;k<6;k++){const q=(p-.3)/.55;r((k-2.5)*(4+q*5),-30+q*18-(k%2)*4,1,2,k%2?accent:colors.white);}}
    if(action==='compact'){const h=p<.35?10:p<.72?10-ease((p-.35)/.37)*6:4;for(let k=0;k<Math.round(h/2);k++)r(10,-3-k*2,11,1,k%2?colors.shade:colors.white);if(p>.74)parcel(10,-7);}
    if(action==='sleep'&&p>.4){text('z',10,-15-Math.floor(time*2)%3,colors.shade);text('z',15,-22-Math.floor(time*2)%4,colors.shade);}
    if(action==='clean'){const bx=12+Math.sin(time*5)*5;line(10,-13,bx,-1);r(bx-3,-2,7,3,accent);for(let k=0;k<4;k++)r(20+k*4-ease(p)*8,-1,k%2+1,1,colors.shade);}
    if(action==='offline'){line(9,-8,17,-2,colors.dark);r(17,-4,4,4,colors.shade);r(21,-4,2,1,accent);r(21,-2,2,1,accent);}
    ctx.restore();
    if(action==='arrive'){r(-24,-27,2,27,colors.dark);r(-24,-28,14,2,colors.dark);r(-12,-27,2,27,colors.dark);r(-20,-23,6,2,accent);}
    if(action==='archive'){r(2,-6,19,6,colors.dark);r(3,-5,17,5,colors.shade);r(9,-4,5,1,colors.ink);if(p>.25&&p<.88)line(2,-7,0,-16,colors.shade);else r(1,-8,21,2,colors.shade);}
    ctx.restore();
  }
  root.TransitSprites = { robot, colors };
})(globalThis);
