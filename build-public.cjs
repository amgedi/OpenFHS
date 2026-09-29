'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname;
const assets=['avatars.js','privacy.js','backup.js','languages.js','logo.svg','index.html','styles.css','core.js','features.js','media.js','experience.js','app.js'];
function build(output=path.join(root,'dist','public-tester-alpha')){
 const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
 fs.mkdirSync(output,{recursive:true});
 // Fail rather than accidentally publishing an unrelated file from an old output folder.
 const allowed=new Set([...assets,'_headers','robots.txt','tester-guide.html','release-manifest.json']);
 for(const name of fs.readdirSync(output))if(!allowed.has(name))throw Error('Unexpected public output file: '+name);
 for(const asset of assets){let bytes=fs.readFileSync(path.join(root,'prototype',asset));if(asset==='index.html')bytes=Buffer.from(bytes.toString().replace('<head>','<head>\n  <meta name="openfhs-support" content="disabled">\n  <meta name="robots" content="noindex, nofollow">').replace('<strong>Practice mode</strong>','<strong>Tester alpha · fictional data only</strong>').replace('<div class="footer-links">','<div class="footer-links"><a href="tester-guide.html">Tester & researcher guide</a>'));fs.writeFileSync(path.join(output,asset),bytes);}
 fs.writeFileSync(path.join(output,'_headers'),`/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-cache
`);
 fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
 fs.copyFileSync(path.join(root,'public-assets','tester-guide.html'),path.join(output,'tester-guide.html'));
 const files=[...allowed].filter(name=>name!=='release-manifest.json').sort().map(name=>({name,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(output,name))).digest('hex')}));
 fs.writeFileSync(path.join(output,'release-manifest.json'),JSON.stringify({version,license:'AGPL-3.0-only',purpose:'Fictional-data tester alpha',supportSending:false,files},null,2));
 return {output,version,files};
}
if(require.main===module)console.log(JSON.stringify(build(),null,2));
module.exports={build,assets};
