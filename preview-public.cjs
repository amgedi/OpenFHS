'use strict';
// Local-only inspection of the exact static upload directory and its headers.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {build}=require('./build-public.cjs');
const {output,files}=build();
const allowed=new Set(files.map(f=>f.name));
const headers=Object.fromEntries(fs.readFileSync(path.join(output,'_headers'),'utf8').split('\n').filter(line=>line.startsWith('  ')).map(line=>{const colon=line.indexOf(':');return [line.slice(0,colon).trim(),line.slice(colon+1).trim()];}));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.txt':'text/plain','.json':'application/json'};
http.createServer((req,res)=>{const route=(req.url||'').split('?')[0],name=route==='/'?'index.html':route.slice(1);if(req.method!=='GET'||!allowed.has(name)||name==='_headers'){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{...headers,'Content-Type':(types[path.extname(name)]||'text/plain')+'; charset=utf-8'});fs.createReadStream(path.join(output,name)).on('error',()=>res.destroy()).pipe(res);}).listen(4319,'127.0.0.1',()=>console.log('Public artifact preview: http://127.0.0.1:4319'));
