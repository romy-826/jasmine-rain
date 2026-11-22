const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'dist'),build='jasmine-rain-v3';
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.m4a':'audio/mp4'};
function serve(req,res){
let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
if(name==='/__jasmine_health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({build,root}));return}
const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
fs.stat(file,(err,stat)=>{
if(err||!stat.isFile()){res.writeHead(404).end();return}
const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-store'};
let start=0,end=stat.size-1,status=200;
if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return}if(!m[1])start=Math.max(0,stat.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`}
headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start,end}).pipe(res);
});}
function ready(port,reused=false){const url=`http://localhost:${port}/`;console.log(`${reused?'已连接':'已启动'}茉莉雨：${url}`);console.log('请保留此窗口；关闭窗口后，下次双击 start.cmd 即可重新打开。');if(process.argv.includes('--open'))require('node:child_process').spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{stdio:'ignore',windowsHide:true}).unref();}
function listen(port,tries=0){const server=http.createServer(serve);server.once('error',async e=>{if(e.code!=='EADDRINUSE'||tries>=10){console.error(e);process.exitCode=1;return}try{const health=await(await fetch(`http://127.0.0.1:${port}/__jasmine_health`,{signal:AbortSignal.timeout(1500)})).json();if(health.build===build&&health.root===root){ready(port,true);return}}catch{}listen(port+1,tries+1)});server.listen(port,'127.0.0.1',()=>ready(port));}
listen(Number(process.env.PORT)||4188);
