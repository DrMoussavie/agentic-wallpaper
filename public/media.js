(function(root){
  const clean=value=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,512):'';
  function createNowPlaying(){
    // `enabled` follows the wallpaper option; `integration` follows Wallpaper Engine's own media setting.
    let enabled=false,integration=true,registered=false,closed=false,title='',artist='',state='unknown';
    const available=typeof root.wallpaperRegisterMediaPropertiesListener==='function';
    // Register with WE only once the option is enabled: WE polls the Windows media sessions for any
    // registered listener, and listeners cannot be removed afterwards.
    function register(){
      if(registered||!available||closed)return;registered=true;
      root.wallpaperRegisterMediaPropertiesListener(event=>{if(closed||!enabled||!integration)return;title=clean(event?.title);artist=clean(event?.artist);});
      root.wallpaperRegisterMediaStatusListener?.(event=>{integration=!!event?.enabled;if(!integration){title='';artist='';state='unknown';}});
      root.wallpaperRegisterMediaPlaybackListener?.(event=>{
        if(closed)return;
        const api=root.wallpaperMediaIntegration||{},playback=api.playback||{};
        const matches=name=>{const value=api['PLAYBACK_'+name]??playback[name];return value!==undefined&&event?.state===value;};
        state=matches('STOPPED')?'stopped':matches('PAUSED')?'paused':matches('PLAYING')?'playing':'unknown';
      });
    }
    function setEnabled(value){
      const next=!!value;if(next===enabled)return;enabled=next;
      if(enabled)register();else{title='';artist='';state='unknown';}
    }
    function fit(ctx,value,width){
      if(ctx.measureText(value).width<=width)return value;
      let lo=0,hi=value.length;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(ctx.measureText(value.slice(0,mid)+'…').width<=width)lo=mid;else hi=mid-1;}
      return ctx.measureText('…').width<=width?value.slice(0,lo)+'…':'';
    }
    return{
      get visible(){return available&&registered&&!closed&&enabled&&integration&&state!=='stopped'&&!!title;},
      get registered(){return registered;},
      setEnabled,
      draw(ctx,width,height,widthPercent=35,audio=true){
        if(!this.visible)return;
        const percent=Math.max(20,Math.min(100,Number(widthPercent)||35)),span=Math.max(1,Math.floor((width-40)*percent/100));
        const y=audio?height-20-Math.min(64,Math.floor(height*.13))-36:height-44;
        ctx.save();ctx.beginPath();ctx.rect(20,y-9,span,27);ctx.clip();ctx.textAlign='left';
        ctx.fillStyle='#83c6b1';
        if(state==='paused'){ctx.fillRect(20,y-6,2,6);ctx.fillRect(24,y-6,2,6);}
        else{ctx.fillRect(20,y-6,2,6);ctx.fillRect(22,y-5,2,4);ctx.fillRect(24,y-4,2,2);}
        ctx.font='8px monospace';ctx.fillStyle='#bbd5c9';ctx.fillText(fit(ctx,title,span-12),32,y);
        ctx.font='7px monospace';ctx.fillStyle='#698b7d';ctx.fillText(fit(ctx,artist,span-12),32,y+11);ctx.restore();
      },
      close(){closed=true;title='';artist='';}
    };
  }
  root.TransitMedia={createNowPlaying};
})(globalThis);
