// Dependency-free, loopback-only static preview. No participant-data API.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const support=require('./support-service.cjs').createSupportService({apiKey:process.env.OPENFHS_MAIL_API_KEY,sender:process.env.OPENFHS_MAIL_FROM,origin:process.env.OPENFHS_SUPPORT_ORIGIN});
const files = new Map([
  ['/avatars.js', ['avatars.js', 'text/javascript']],
  ['/privacy.js', ['privacy.js', 'text/javascript']],
  ['/backup.js', ['backup.js', 'text/javascript']],
  ['/languages.js', ['languages.js', 'text/javascript']],
  ['/logo.svg', ['logo.svg', 'image/svg+xml']],
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/core.js', ['core.js', 'text/javascript']],
  ['/features.js', ['features.js', 'text/javascript']],
  ['/media.js', ['media.js', 'text/javascript']],
  ['/experience.js', ['experience.js', 'text/javascript']],
  ['/app.js', ['app.js', 'text/javascript']]
]);
const server = http.createServer(async (req, res) => {
  const route=(req.url||'').split('?')[0];
  if(route==='/api/support/config'||route==='/api/support'){
    const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
    if(route==='/api/support/config'&&req.method==='GET')return reply(200,{enabled:support.enabled});
    if(route!=='/api/support'||req.method!=='POST')return reply(405,{error:'Method not allowed.'});
    if(!(req.headers['content-type']||'').startsWith('application/json'))return reply(415,{error:'A JSON support report is required.'});
    try{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>16384)return reply(413,{error:'This report is too large.'});chunks.push(chunk);}let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return reply(400,{error:'The report could not be read.'});}const result=await support.submit(body,{requestOrigin:req.headers.origin,address:req.socket.remoteAddress});return reply(result.status,result.body);}catch{return reply(503,{error:'Support is temporarily unavailable. Keep your report and retry later.'});}
  }
  const file = files.get((req.url || '').split('?')[0]);
  if (req.method !== 'GET' || !file) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, {
    'Content-Type': file[1] + '; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
  });
  fs.createReadStream(path.join(__dirname, 'prototype', file[0])).pipe(res);
});
server.on('error', error => { console.error('Could not open preview:', error.message); process.exitCode = 1; });
const port=Number(process.env.OPENFHS_PORT||4317);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid preview port.');
server.listen(port, '127.0.0.1', () => console.log(`OpenFHS practice diary: http://127.0.0.1:${port} — keep this window open. Ctrl+C stops it.`));
