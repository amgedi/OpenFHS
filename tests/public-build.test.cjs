const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {build,assets}=require('../build-public.cjs');
test('public build contains only approved static files and disables support networking',()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'openfhs-public-test-'));
 const result=build(output),names=fs.readdirSync(output);
 assert.deepEqual(names.sort(),[...assets,'_headers','robots.txt','tester-guide.html','release-manifest.json'].sort());
 assert.match(fs.readFileSync(path.join(output,'index.html'),'utf8'),/name="openfhs-support" content="disabled"/);
 const headers=fs.readFileSync(path.join(output,'_headers'),'utf8');
 assert.match(headers,/connect-src 'none'/);assert.match(headers,/frame-ancestors 'none'/);assert.match(headers,/script-src 'self'/);
 for(const file of result.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file.name))).digest('hex'),file.sha256);
 assert.equal(names.includes('support-service.cjs'),false);
});
test('public build refuses unexpected files rather than publishing them',()=>{
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'openfhs-public-test-'));
 fs.writeFileSync(path.join(output,'private-export.json'),'fictional fixture');
 assert.throws(()=>build(output),/Unexpected public output file/);
});
