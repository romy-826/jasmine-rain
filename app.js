const $=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),video=$('camera'),music=$('music');
let W=innerWidth,H=innerHeight,ac,analyser,bins,landmarker,stream,busy=false,lastVideo=-1,lastDetect=0,last=0,energy=0,pulse=0,previousBass=0,meanBass=0,lastAccent=-1,handState=new Map();
const flowers=[],particles=[],types=['star','round','ball','bud'],reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function resize(){W=innerWidth;H=innerHeight;const d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);resize();
function message(t){$('message').textContent=t}
function begin(){document.body.classList.replace('landing','playing');$('welcome').hidden=true;flowers.length=particles.length=0;$('play').focus();}
function goHome(){if(busy)return;music.pause();stopCamera();$('cameraHelp').hidden=true;flowers.length=particles.length=0;document.body.classList.replace('playing','landing');$('welcome').hidden=false;seedFlowers();$('experience').focus();}
$('back').onclick=goHome;
function audioGraph(){if(ac)return;ac=new AudioContext();analyser=ac.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.55;ac.createMediaElementSource(music).connect(analyser);analyser.connect(ac.destination);bins=new Uint8Array(analyser.frequencyBinCount)}
music.volume=.7;
async function togglePlay(){try{audioGraph();await ac.resume();if(music.paused){await music.play()}else music.pause()}catch{message('音乐未能播放，请再次点击播放。')}}
$('play').onclick=togglePlay;$('experience').onclick=begin;
music.onplay=()=>{$('play').textContent='暂停';$('play').setAttribute('aria-label','暂停音乐');$('musicState').textContent='花瓣随重音舒展'};
music.onpause=()=>{$('play').textContent='播放';$('play').setAttribute('aria-label','播放音乐');$('musicState').textContent=music.ended?'播放结束':'已暂停'};
music.onended=()=>{$('musicState').textContent='播放结束';pulse=0};
music.onerror=()=>message('配乐加载失败，请确认 assets 文件夹完整，并通过本地服务器打开。');
const format=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
function progress(){const d=music.duration||0;$('time').textContent=`${format(music.currentTime)} / ${format(d)}`;$('seek').value=d?music.currentTime/d*100:0}
music.ontimeupdate=progress;music.onloadedmetadata=progress;
$('seek').oninput=e=>{if(Number.isFinite(music.duration)){music.currentTime=music.duration*Number(e.target.value)/100;lastAccent=-1;previousBass=meanBass=0;pulse=0;}};
$('volume').oninput=e=>music.volume=Number(e.target.value);
$('clear').onclick=()=>{flowers.length=particles.length=0};
function bloom(x,y,{size=36,type=$('flowerType').value}={}){if(type==='mix')type=types[Math.floor(Math.random()*types.length)];flowers.push({x,y,size,type,born:performance.now(),age:0,open:0,rotation:Math.random()*6.28,drift:(Math.random()-.5)*14,life:3+Math.random()*2});if(flowers.length>75)flowers.shift();}
function scatter(x,y,n=5){if(reduced)return;for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*75,vy:-20-Math.random()*55,born:performance.now(),age:0,life:2+Math.random()*2,angle:Math.random()*6.28});while(particles.length>180)particles.shift()}
let lastPointer=0;
canvas.onpointerdown=e=>{if(!document.body.classList.contains('playing'))return;canvas.setPointerCapture(e.pointerId);bloom(e.clientX,e.clientY,{size:42});scatter(e.clientX,e.clientY);lastPointer=performance.now()};
canvas.onpointermove=e=>{if(document.body.classList.contains('playing')&&e.buttons&&performance.now()-lastPointer>135){bloom(e.clientX,e.clientY,{size:22+Math.random()*14});lastPointer=performance.now()}};
// Mirror and crop landmarks exactly like the object-fit: cover video underneath.
function project(p){const vw=video.videoWidth||W,vh=video.videoHeight||H,s=Math.max(W/vw,H/vh);return{x:W-(p.x*vw*s-(vw*s-W)/2),y:p.y*vh*s-(vh*s-H)/2}}
async function loadHands(){
const {HandLandmarker,FilesetResolver}=await import('./assets/mediapipe/vision_bundle.mjs');
const files=await FilesetResolver.forVisionTasks(new URL('./assets/mediapipe/wasm',import.meta.url).href);
const options={baseOptions:{modelAssetPath:new URL('./assets/mediapipe/hand_landmarker.task',import.meta.url).href,delegate:'GPU'},runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.55,minTrackingConfidence:.5};
try{return await HandLandmarker.createFromOptions(files,options)}catch(gpuError){console.warn('GPU 手势初始化失败，尝试 CPU',gpuError);options.baseOptions.delegate='CPU';return await HandLandmarker.createFromOptions(files,options)}
}
async function refreshCameras(){try{const current=$('cameraSelect').value,devices=await navigator.mediaDevices?.enumerateDevices();$('cameraSelect').replaceChildren(new Option('系统默认摄像头',''));for(const [i,d] of (devices||[]).filter(d=>d.kind==='videoinput').entries())if(d.deviceId)$('cameraSelect').add(new Option(d.label||`摄像头 ${i+1}`,d.deviceId));if([...$('cameraSelect').options].some(o=>o.value===current))$('cameraSelect').value=current;}catch(e){console.warn('无法列出摄像头',e)}}
async function requestCamera(){
const chosen=$('cameraSelect').value;
const constraints=chosen?{deviceId:{exact:chosen}}:{facingMode:{ideal:'user'},width:{ideal:1280},height:{ideal:720}};
try{return await navigator.mediaDevices.getUserMedia({video:constraints,audio:false})}
catch(e){if(!chosen&&['NotReadableError','OverconstrainedError','AbortError'].includes(e.name)){
await new Promise(r=>setTimeout(r,350));return await navigator.mediaDevices.getUserMedia({video:true,audio:false});}throw e;}
}
$('refreshCameras').onclick=refreshCameras;
$('retryCamera').onclick=()=>{if(busy)return;if(stream)stopCamera();startCamera()};
$('cameraSettings').onclick=async()=>{
const track=stream?.getVideoTracks()[0];
$('cameraHelpText').textContent=track?`当前设备：${track.label||'系统默认摄像头'}。如果画面只有划线相机图标，请检查电脑键盘上带划线相机的隐私按键（有些机型需配合 Fn），以及屏幕摄像头旁的滑盖。网页无法解除设备的隐私关闭状态。也可选择其他摄像头后点击“重试开启”。`:'尚未连接摄像头。选择设备后点击“重试开启”，并允许浏览器访问。';
$('cameraHelp').hidden=false;await refreshCameras();};
$('dismissHelp').onclick=()=>{$('cameraHelp').hidden=true;message('可以先点击、拖动画面开花，稍后再开启摄像头。')};
async function startCamera(){if(busy)return;if(stream&&landmarker){stopCamera();return}busy=true;$('cameraButton').disabled=true;let stage='camera';
try{
$('cameraHelp').hidden=true;$('retryCamera').disabled=true;$('back').disabled=true;
if(!stream){message('正在请求摄像头权限…');if(!navigator.mediaDevices?.getUserMedia)throw new Error('context');stream=await requestCamera();video.srcObject=stream;await video.play();document.body.classList.add('live');await refreshCameras();}
stage='model';message('摄像头已开启，正在载入本地手势模型…');if(!landmarker)landmarker=await loadHands();
$('cameraButton').textContent='关闭摄像头';message('手势识别已就绪。若未显示人物、只有关闭图标，请点“检查画面”查看设备与隐私开关。');}
catch(e){console.error(`启动失败：${stage}`,e);if(stage==='model'){$('cameraButton').textContent='重试手势';message('摄像头已开启，但手势模型加载失败。点击“重试手势”；请确认 assets/mediapipe 文件夹完整。');}
else{stopCamera();const detail=e.name==='NotAllowedError'?'浏览器没有获得摄像头权限。请在地址栏的网站权限中允许摄像头，然后重试。':e.name==='NotFoundError'?'没有找到可用摄像头。请连接设备，或在下方选择其他摄像头。':e.name==='NotReadableError'?'浏览器无法读取摄像头。可能是设备被占用、系统隐私设置、虚拟摄像头不可用或驱动问题。请先选择其他摄像头；也可以关闭视频会议等占用程序后重试。':!isSecureContext?'请通过本地启动入口打开网页，再请求摄像头权限。':`摄像头启动失败（${e.name||'未知错误'}）。请检查设备与浏览器权限后重试。`;
message(`摄像头尚未就绪（${e.name||'未知错误'}），可在检查面板中选择设备并重试。`);$('cameraHelpText').textContent=detail;$('cameraHelp').hidden=false;await refreshCameras();}}
finally{busy=false;$('cameraButton').disabled=false;$('retryCamera').disabled=false;$('back').disabled=false}}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;document.body.classList.remove('live');handState.clear();lastVideo=-1;$('cameraButton').textContent='开启摄像头';message('摄像头已关闭，可点击或拖动画面开花。')}
$('cameraButton').onclick=startCamera;addEventListener('pagehide',()=>stream?.getTracks().forEach(t=>t.stop()));
function hands(result,now){const seen=new Set();for(let i=0;i<result.landmarks.length;i++){const hand=result.landmarks[i],key=result.handedness[i]?.[0]?.categoryName||String(i);seen.add(key);const palm=project(hand[9]),wrist=hand[0],scale=distance(wrist,hand[9])||.1;const tips=[8,12,16,20],open=tips.filter(id=>distance(hand[id],wrist)>distance(hand[id-2],wrist)*1.17).length>=3;let s=handState.get(key);if(!s){s={palm,points:tips.map(id=>project(hand[id])),open:false,lastBloom:now-1500,lastTrail:now,lastPoint:now,time:now};handState.set(key,s)}
const dt=Math.max(.015,(now-s.time)/1000),speed=distance(palm,s.palm)/dt;
if(open&&!s.open&&now-s.lastBloom>1000){for(let j=0;j<5;j++){const a=j*2.4;bloom(palm.x+Math.cos(a)*30,palm.y+Math.sin(a)*26,{size:30+Math.random()*20})}scatter(palm.x,palm.y,10);s.lastBloom=now;}
if(open&&speed>110&&now-s.lastTrail>160){bloom(palm.x,palm.y,{size:20+Math.random()*12});scatter(palm.x,palm.y,2);s.lastTrail=now}
tips.forEach((id,k)=>{const p=project(hand[id]),old=s.points[k];if((p.y-old.y)/dt>250&&now-s.lastPoint>260&&distance(hand[id],wrist)>scale*1.1){bloom(p.x,p.y,{size:32});s.lastPoint=now}ctx.beginPath();ctx.arc(p.x,p.y,2.5,0,Math.PI*2);ctx.fillStyle='#f5f5dccc';ctx.fill();s.points[k]=p});s.palm=palm;s.open=open;s.time=now;}
for(const key of handState.keys())if(!seen.has(key))handState.delete(key)}
function petal(length,width,angle,alpha){ctx.save();ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,3);ctx.bezierCurveTo(-width,-length*.24,-width*.65,-length,0,-length);ctx.bezierCurveTo(width*.65,-length,width,-length*.24,0,3);const g=ctx.createLinearGradient(0,0,0,-length);g.addColorStop(0,`rgba(221,224,182,${alpha})`);g.addColorStop(.45,`rgba(236,247,241,${alpha*.83})`);g.addColorStop(1,`rgba(250,255,254,${alpha})`);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=`rgba(185,221,230,${alpha*.75})`;ctx.lineWidth=.7;ctx.stroke();ctx.restore()}
function drawFlower(f,dt){f.age=(performance.now()-f.born)/1000;f.open+=(1-f.open)*Math.min(1,dt*(2.6+pulse*7));if(!reduced){f.y-=dt*(5+energy*7);f.x+=Math.sin(f.age+f.rotation)*dt*5+f.drift*dt*.2}const fade=Math.min(1,f.age*5)*clamp((f.life-f.age)/.9,0,1),unfold=.28+.72*f.open,size=f.size*unfold*(1+pulse*.09);ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.rotation+(reduced?0:Math.sin(f.age*.4)*.12));ctx.globalAlpha=fade;ctx.shadowBlur=9+pulse*9;ctx.shadowColor='#c2edf344';
if(f.type==='bud'){for(let i=-1;i<=1;i++)petal(size*.8,size*.22,i*.27,.94)}else{const layers=f.type==='ball'?4:f.type==='round'?2:1;for(let layer=0;layer<layers;layer++){const n=f.type==='star'?5:7+layer*2,l=size*(1-layer*.18),w=l*(f.type==='star'?.32:.66);for(let j=0;j<n;j++)petal(l,w,j/n*Math.PI*2+layer*.44,.92)}ctx.shadowBlur=0;ctx.fillStyle='#e7d59a';for(let j=0;j<7;j++){const a=j/7*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(a)*size*.09,Math.sin(a)*size*.09,1.4,0,6.28);ctx.fill()}}
ctx.restore()}
// Adaptive low-frequency attacks: reacts to accents, not a claimed BPM/beat grid.
function musicReaction(){if(!analyser||music.paused){energy*=.94;return}analyser.getByteFrequencyData(bins);let bass=0,total=0;const low=Math.max(2,Math.floor(230/(ac.sampleRate/analyser.fftSize)));for(let i=1;i<bins.length;i++){total+=bins[i];if(i<=low)bass+=bins[i]}bass/=low*255;energy=total/(bins.length*155);meanBass=meanBass*.96+bass*.04;const t=music.currentTime;if(bass>meanBass*1.13&&bass-previousBass>.018&&bass>.12&&t-lastAccent>.28){pulse=1;lastAccent=t;for(const f of flowers.slice(-6))scatter(f.x,f.y,2)}previousBass=bass}
function frame(now){const dt=Math.min(.04,(now-(last||now))/1000);last=now;ctx.clearRect(0,0,W,H);musicReaction();pulse=Math.max(0,pulse-dt*2.4);
if(stream&&landmarker&&video.readyState>=2&&video.currentTime!==lastVideo&&now-lastDetect>40){lastVideo=video.currentTime;lastDetect=now;try{hands(landmarker.detectForVideo(video,now),now)}catch{message('手势识别暂时中断，请关闭并重新开启摄像头。')}}
for(let i=flowers.length-1;i>=0;i--){drawFlower(flowers[i],dt);if(flowers[i].age>flowers[i].life)flowers.splice(i,1)}for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.age=(now-p.born)/1000;p.vy+=dt*22;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+p.age);ctx.globalAlpha=Math.max(0,1-p.age/p.life);petal(7,3,0,.8);ctx.restore();if(p.age>=p.life)particles.splice(i,1)}requestAnimationFrame(frame)}
function seedFlowers(){/* The welcome screen uses a persistent botanical lifecycle image. */}
seedFlowers();requestAnimationFrame(frame);
