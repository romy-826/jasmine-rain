// Cache complete downloads, retry interruptions, and report actual byte progress.
const CACHE='jasmine-vision-0.10.21-v1';
async function download(url,label,onProgress){
let cache;try{cache=await caches.open(CACHE);const hit=await cache.match(url);if(hit){onProgress(`${label}：读取已缓存文件`);return new Uint8Array(await hit.arrayBuffer());}}catch{}
for(let attempt=0;attempt<2;attempt++){
const abort=new AbortController();let timer;const reset=()=>{clearTimeout(timer);timer=setTimeout(()=>abort.abort(),45000)};
try{reset();const response=await fetch(url,{signal:abort.signal});if(!response.ok)throw new Error(`${label}下载失败（HTTP ${response.status}），请确认资源目录完整`);
const reader=response.body?.getReader(),total=Number(response.headers.get('Content-Length'))||0;let bytes;
if(reader){const chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;reset();chunks.push(value);size+=value.byteLength;onProgress(`${label}：${(size/1048576).toFixed(1)}${total?` / ${(total/1048576).toFixed(1)}`:''} MB`)}bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}}else bytes=new Uint8Array(await response.arrayBuffer());
if(bytes.byteLength<1000000||(total&&!response.headers.get('Content-Encoding')&&bytes.byteLength!==total))throw new Error(`${label}文件不完整，请检查上传的资源或重试下载`);
if(label==='识别引擎'&&!(bytes[0]===0&&bytes[1]===97&&bytes[2]===115&&bytes[3]===109))throw new Error('识别引擎文件内容不正确');
try{await cache?.put(url,new Response(bytes,{headers:{'Content-Type':label==='识别引擎'?'application/wasm':'application/octet-stream'}}));}catch{}
return bytes;
}catch(e){if(attempt===1)throw new Error(e.name==='AbortError'?`${label}下载中断，请换用稳定网络后重试`:e.message);onProgress(`${label}连接中断，正在重试…`);await new Promise(r=>setTimeout(r,600));}finally{clearTimeout(timer)}
}}
export async function createHands({mobile=false,onProgress=()=>{}}={}){
onProgress('载入手势组件…');
const {HandLandmarker,FilesetResolver}=await import('./assets/mediapipe/vision_bundle.mjs');
const files=await FilesetResolver.forVisionTasks(new URL('./assets/mediapipe/wasm',import.meta.url).href);
const wasm=await download(files.wasmBinaryPath,'识别引擎',onProgress);
const model=await download(new URL('./assets/mediapipe/hand_landmarker.task',import.meta.url).href,'手部模型',onProgress);
const objectURL=URL.createObjectURL(new Blob([wasm],{type:'application/wasm'}));
const options={baseOptions:{modelAssetBuffer:model,delegate:'GPU'},runningMode:'VIDEO',numHands:mobile?1:2,minHandDetectionConfidence:.55,minTrackingConfidence:.5};
try{onProgress('文件已就绪，正在初始化手势识别…');try{return await HandLandmarker.createFromOptions({...files,wasmBinaryPath:objectURL},options)}catch(e){console.warn('GPU unavailable; falling back to CPU',e);onProgress('切换兼容模式…');options.baseOptions.delegate='CPU';return await HandLandmarker.createFromOptions({...files,wasmBinaryPath:objectURL},options)}}finally{URL.revokeObjectURL(objectURL)}
}
