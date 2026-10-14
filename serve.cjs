const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
http.createServer((req,res)=>{
  const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!p.startsWith(root)){res.writeHead(403);return res.end()}
  const file=fs.statSync(p,{throwIfNoEntry:false})?.isDirectory()?path.join(p,'index.html'):p;
  fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)})
}).listen(3000,'127.0.0.1',()=>console.log('Local URL: http://127.0.0.1:3000'));
