import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {fileURLToPath} from 'node:url';

export function createAudioHub({python,pythonPath}){
  const clients=new Set();let child=null,stopTimer=null,latest={status:'idle',bands:[]},lastAt=0;
  function publish(data){
    latest=data;lastAt=Date.now();const frame='data: '+JSON.stringify(data)+'\n\n';
    for(const client of clients){if(client.writableLength>32768){client.end();clients.delete(client);}else client.write(frame);}
  }
  function stop(){clearTimeout(stopTimer);stopTimer=null;if(child){const old=child;child=null;old.kill();}latest={status:'idle',bands:[]};}
  function start(){
    clearTimeout(stopTimer);if(child)return;
    publish({status:'connecting',bands:[]});
    const process=spawn(python,['-u',fileURLToPath(new URL('./audio-spectrum.py',import.meta.url)),'--watch-parent'],{windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...globalThis.process.env,...(pythonPath?{PYTHONPATH:pythonPath}:{}),OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1'}});
    child=process;
    createInterface({input:process.stdout}).on('line',line=>{
      if(line.length>4096)return;
      try{const data=JSON.parse(line);if(data.status==='live'&&data.bands?.length===48&&data.bands.every(v=>Number.isFinite(v)&&v>=0&&v<=1))publish(data);else if(data.status==='unavailable')publish({status:'unavailable',bands:[]});}catch{}
    });
    // A capture failure used to be silent; keep the relay log informative but bounded.
    let lastReport=0;
    createInterface({input:process.stderr}).on('line',line=>{
      if(Date.now()-lastReport<30000||!line.trim())return;lastReport=Date.now();
      console.error('[audio] '+line.slice(0,300));
    });
    const failed=()=>{if(child!==process)return;child=null;publish({status:'unavailable',bands:[]});};
    process.on('error',failed);process.on('exit',failed);
  }
  return {
    add(req,res){
      if(clients.size>=20){res.writeHead(503);res.end();return;}
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive'});
      res.write('retry: 5000\n\n');clients.add(res);start();res.write('data: '+JSON.stringify(latest)+'\n\n');
      req.on('close',()=>{clients.delete(res);if(!clients.size){clearTimeout(stopTimer);stopTimer=setTimeout(stop,10000);stopTimer.unref();}});
    },
    status(){return{status:child&&Date.now()-lastAt>4000?'unavailable':latest.status,clients:clients.size,running:!!child,bands:48,minHz:40,maxHz:20000};},
    close(){for(const client of clients)client.end();clients.clear();stop();}
  };
}
