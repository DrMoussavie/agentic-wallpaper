(function(root){
  function sheet(factory,id,family){
    const a=root.TransitAnimations.ACTIONS[id],canvas=factory(1280,760),ctx=canvas.getContext('2d');ctx.fillStyle='#080e12';ctx.fillRect(0,0,1280,760);ctx.fillStyle=family==='codex'?'#73d8e8':'#edb56d';ctx.font='16px monospace';ctx.fillText(`AGENT TRANSIT  /  ${family.toUpperCase()}  /  MODÈLE 01`,40,40);ctx.fillStyle='#e4edec';ctx.font='30px sans-serif';ctx.fillText(a.name,40,85);ctx.fillStyle='#879ca8';ctx.font='14px sans-serif';ctx.fillText(`${a.duration.toFixed(1)} secondes · 8 étapes · même tête, même corps, mêmes proportions`,40,114);
    for(let i=0;i<8;i++){
      const x=32+i%4*308,y=145+Math.floor(i/4)*285;ctx.fillStyle='#000';ctx.fillRect(x,y,292,265);ctx.fillStyle='#233640';ctx.fillRect(x+16,y+206,259,1);
      root.TransitSprites.robot(ctx,x+106,y+203,family,id,a.duration*(i+.36)/8,{scale:4});
      ctx.fillStyle=family==='codex'?'#73d8e8':'#edb56d';ctx.font='12px monospace';ctx.fillText(String(i+1).padStart(2,'0'),x+15,y+228);ctx.fillStyle='#c1d0d8';ctx.font='13px sans-serif';ctx.fillText(a.steps[i],x+41,y+228);
    }
    ctx.fillStyle='#5f7a89';ctx.font='12px monospace';ctx.fillText('Les transitions intermédiaires sont animées par le même modèle articulé.',40,741);return canvas;
  }
  function atlas(factory,family){const specs=Object.values(root.TransitAnimations.ACTIONS),cellW=96,cellH=80,columns=16,canvas=factory(cellW*columns,cellH*specs.length),ctx=canvas.getContext('2d'),animations={};for(const [row,a] of specs.entries()){animations[a.id]={row,frames:columns,duration:a.duration,steps:a.steps};for(let col=0;col<columns;col++)root.TransitSprites.robot(ctx,col*cellW+38,row*cellH+61,family,a.id,a.duration*col/columns);}return{canvas,manifest:{model:'agent-transit-model-01',provider:family,cellWidth:cellW,cellHeight:cellH,columns,rows:specs.length,animations}};}
  root.TransitSheets={sheet,atlas};
})(globalThis);
