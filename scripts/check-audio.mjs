// Probe the real relay. Only aggregate signal levels are reported; no sound is saved.
import http from 'node:http';
const requireSignal=process.argv.includes('--require-signal');
let buffer='',frames=0,nonzero=0,peak=0,changed=0,previous=null,finished=false;
const started=Date.now();
const finish=()=>{
  if(finished)return;finished=true;clearTimeout(timer);request.destroy();
  const result={frames,nonzeroFrames:nonzero,changedFrames:changed,peakLevel:peak,durationMs:Date.now()-started};
  result.ok=frames>=20&&(!requireSignal||nonzero>=10&&changed>=5);
  console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
};
const request=http.get('http://127.0.0.1:49157/audio/stream',response=>{
  if(response.statusCode!==200){finish();return;}
  response.on('data',chunk=>{
    buffer+=chunk;let end;
    while(!finished&&(end=buffer.indexOf('\n\n'))>=0){
      const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);
      const line=frame.split('\n').find(v=>v.startsWith('data: '));if(!line)continue;
      let data;try{data=JSON.parse(line.slice(6));}catch{continue;}
      if(data.status!=='live'||data.bands?.length!==48)continue;
      frames++;const level=Math.max(...data.bands);if(level>0)nonzero++;peak=Math.max(peak,level);
      const serialized=JSON.stringify(data.bands);if(previous&&previous!==serialized)changed++;previous=serialized;
      if(frames>=60)finish();
    }
  });
});
request.on('error',finish);
const timer=setTimeout(finish,6000);
