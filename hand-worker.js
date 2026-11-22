// Classic worker: MediaPipe's WASM loader needs importScripts support.
let detector;
self.onmessage=async({data})=>{
if(data.type==='init'){try{const {createHands}=await import('./vision-loader.js');detector=await createHands({mobile:data.mobile,onProgress:text=>postMessage({type:'progress',text})});postMessage({type:'ready'});}catch(e){postMessage({type:'error',message:e.message})}return;}
if(data.type==='frame'){try{const result=detector.detectForVideo(data.bitmap,data.time);postMessage({type:'result',epoch:data.epoch,result:{landmarks:result.landmarks,handedness:result.handedness}})}catch(e){postMessage({type:'frameError',message:e.message})}finally{data.bitmap.close()}}
};
