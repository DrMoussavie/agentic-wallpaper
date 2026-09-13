(function(root){
  // All frequencies use the same level palette: green -> amber -> red.
  const stops=[[0,[92,181,147]],[.45,[186,197,111]],[.72,[231,162,88]],[1,[233,88,91]]];
  function levelColor(level){
    const v=Math.max(0,Math.min(1,level));let a=stops[0],b=stops.at(-1);
    for(let i=1;i<stops.length;i++)if(v<=stops[i][0]){a=stops[i-1];b=stops[i];break;}
    const q=(v-a[0])/(b[0]-a[0]);
    return '#'+a[1].map((n,i)=>Math.round(n+(b[1][i]-n)*q).toString(16).padStart(2,'0')).join('');
  }
  function createSpectrum(){
    const nativeAvailable=typeof root.wallpaperRegisterAudioListener==='function';
    let audioSource='relay',closed=false,nativeRegistered=false;
    let source=null,enabled=true,visible=true,lastAt=0,status='connecting',values=new Float32Array(48),peaks=new Float32Array(48),lastDraw=0;
    function receive(data){
      if(closed||!enabled||!visible)return;
      if(data?.status==='live'&&data.bands?.length===48&&data.bands.every(v=>Number.isFinite(v)&&v>=0&&v<=1)){
        values.set(data.bands);lastAt=performance.now();status='live';
      }else{values.fill(0);status=data?.status||'unavailable';}
    }
    // Register with WE only once the native source is selected: WE keeps its own WASAPI capture
    // running for any registered listener, and it cannot be unregistered afterwards.
    function registerNative(){
      if(nativeRegistered||!nativeAvailable||closed)return;nativeRegistered=true;
      root.wallpaperRegisterAudioListener(samples=>{
      if(audioSource!=='wallpaper-engine'||closed||!enabled||!visible||samples?.length!==128)return;
      const bands=new Array(48).fill(0);
      for(let i=0;i<48;i++)for(let j=Math.floor(i*64/48);j<Math.floor((i+1)*64/48);j++){
        const l=Number(samples[j]),r=Number(samples[j+64]);
        bands[i]=Math.max(bands[i],Number.isFinite(l)?Math.max(0,Math.min(1,l)):0,Number.isFinite(r)?Math.max(0,Math.min(1,r)):0);
      }
      receive({status:'live',bands});
      });
    }
    function connect(){
      if(closed||!enabled||!visible){source?.close();source=null;values.fill(0);peaks.fill(0);status='paused';return;}
      if(audioSource==='wallpaper-engine'){
        registerNative();status=nativeAvailable?(status==='paused'?'connecting':status):'unavailable';return;
      }
      if(source)return;status='connecting';
      const connection=new EventSource((location.protocol==='file:'?'http://127.0.0.1:49157':'')+'/audio/stream');source=connection;
      connection.onmessage=e=>{if(source!==connection||audioSource!=='relay')return;try{receive(JSON.parse(e.data));}catch{}};
      connection.onerror=()=>{if(source!==connection)return;status='unavailable';values.fill(0);peaks.fill(0);};
    }
    return{
      receive,
      get sourceKind(){return audioSource;},
      get nativeRegistered(){return nativeRegistered;},
      setSource(value){const next=value==='wallpaper-engine'?'wallpaper-engine':'relay';if(next===audioSource)return;source?.close();source=null;audioSource=next;values.fill(0);peaks.fill(0);status='connecting';lastAt=0;connect();},
      setEnabled(v){enabled=!!v;connect();},
      setVisible(v){visible=!!v;connect();},
      get status(){return enabled?(status==='live'&&performance.now()-lastAt>3000?'unavailable':status):'disabled';},
      get level(){return this.status==='live'?Math.max(...values):null;},
      draw(ctx,width,height,widthPercent=35){
        if(!enabled)return;
        const nativeAudio=audioSource==='wallpaper-engine';
        const now=performance.now(),dt=Math.min(.2,(now-lastDraw)/1000||0);lastDraw=now;
        const percent=Number.isFinite(Number(widthPercent))?Math.max(20,Math.min(100,Number(widthPercent))):35;
        const live=this.status==='live',margin=20,span=Math.max(1,Math.floor((width-margin*2)*percent/100)),base=height-20,maxHeight=Math.min(64,Math.floor(height*.13));
        const count=Math.min(48,Math.max(1,Math.floor(span/3))),step=span/count;
        ctx.fillStyle='#10231e';ctx.fillRect(margin,base,span,1);
        for(let i=0;i<48;i++){
          const target=live?values[i]:0;peaks[i]+=(target-peaks[i])*(1-Math.exp(-dt*(target>peaks[i]?22:6)));
        }
        // At small widths, group adjacent bands rather than cropping high frequencies.
        for(let i=0;i<count;i++){
          let level=0;for(let j=Math.floor(i*48/count);j<Math.floor((i+1)*48/count);j++)level=Math.max(level,peaks[j]);
          const rows=Math.floor(level*maxHeight/4),x=Math.round(margin+i*step+1),w=Math.max(1,Math.floor(step)-2);
          for(let j=0;j<rows;j++){ctx.fillStyle=levelColor(j/Math.max(1,Math.floor(maxHeight/4)-1));ctx.fillRect(x,base-4-j*4,w,2);}
        }
        ctx.font='6px monospace';ctx.fillStyle='#456258';
        const labels=nativeAudio||span<90?[]:span<140?[[40,'40 Hz'],[20000,'20k Hz']]:span<400?[[40,'40 Hz'],[1000,'1k'],[20000,'20k Hz']]:[[40,'40 Hz'],[100,'100'],[1000,'1k'],[5000,'5k'],[20000,'20k Hz']];
        for(const [hz,label] of labels){ctx.textAlign=hz===40?'left':hz===20000?'right':'center';ctx.fillText(label,Math.round(margin+Math.log(hz/40)/Math.log(500)*span),height-8);}
        ctx.textAlign='left';ctx.fillStyle='#46685a';
        if(nativeAudio&&span>=60){ctx.fillText('GRAVES',margin,height-8);ctx.textAlign='right';ctx.fillText('AIGUS',margin+span,height-8);ctx.textAlign='left';}
        else if(!nativeAudio&&span>=40&&span<90)ctx.fillText('40–20k Hz',margin,height-8);
        ctx.fillText(span<100?(live?'AUDIO':'…'):live?'SON DU PC':this.status==='connecting'?'CONNEXION AUDIO…':audioSource==='relay'?'RELAIS AUDIO DÉCONNECTÉ':'AUDIO INDISPONIBLE',margin,base-maxHeight-8);
      },
      close(){closed=true;source?.close();source=null;values.fill(0);peaks.fill(0);status='paused';}
    };
  }
  root.TransitAudio={createSpectrum,levelColor};
})(globalThis);
