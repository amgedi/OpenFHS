const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('../prototype/core.js');
test('repeated downloads preserve extensions and never reuse a filename even at the same instant',()=>{
 const context={window:{},crypto:require('node:crypto').webcrypto,Date:class extends Date{constructor(){super('2026-09-29T12:30:00.000Z');}}};
 vm.runInNewContext(fs.readFileSync('prototype/backup.js','utf8'),context);
 const names=Array.from({length:100},()=>context.window.OpenFHSBackup.uniqueFilename('openfhs-complete-backup.json'));
 assert.equal(new Set(names).size,100);
 for(const name of names){assert.match(name,/^openfhs-complete-backup-2026-09-29T12-30-00-000Z-.+\.json$/);assert.doesNotMatch(name,/[<>:"/\\|?*]/);}
 assert.match(context.window.OpenFHSBackup.uniqueFilename('openfhs-report.html'),/\.html$/);
 assert.match(context.window.OpenFHSBackup.uniqueFilename('openfhs-feedback.txt'),/\.txt$/);
});
test('pixel meadow never changes to arcade scenery between sessions; arcade always uses its own world',()=>{
 const source=fs.readFileSync('prototype/app.js','utf8');
 const landscape=source.slice(source.indexOf('function companionLandscape(){'),source.indexOf('  function catScene(){'));
 for(const seed of [0,1,2,999])for(const theme of ['pixel','arcade']){
  const context={X:{settings:{theme}},companionIndex:seed};
  const result=vm.runInNewContext(landscape+';companionLandscape()',context);
  assert.equal(result.includes('pixel-arcade'),theme==='arcade');
  if(theme==='pixel')assert.match(result,/scene-ground/);
 }
});
test('adding an unclassified fictional cat stays compatible with existing data',()=>{
 const state=C.demo('2026-09-29'),existing=JSON.stringify(state.animals);
 const html=fs.readFileSync('prototype/index.html','utf8');
 const scenario=html.match(/name="scenario" value="([^"]+)"/)[1];
 assert.doesNotMatch(html,/<select name="scenario"/);
 const result=C.save(state,'animals',{name:'Maple',scenario});
 assert.equal(result.animals.at(-1).name,'Maple');
 assert.equal(JSON.stringify(result.animals.slice(0,-1)),existing);
});
test('new tester wording is translated in all priority languages and license is available offline',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync('prototype/languages.js','utf8'),context);
 for(const language of ['es','fr','zh','ar','tr'])for(const text of ['Breezy park','Pixel arcade (8-bit)','Time difference from UTC (optional)','Leave blank if unsure']){
  assert.notEqual(context.window.OpenFHSLanguages.translate(text,language),text);
 }
 const license=fs.readFileSync('LICENSE','utf8');
 const html=fs.readFileSync('prototype/index.html','utf8');
 assert.equal(require('../package.json').license,'AGPL-3.0-only');
 assert.match(license,/13\. Remote Network Interaction/);
 assert.match(html,/13\. Remote Network Interaction/);
 assert.match(html,/Corresponding source and build instructions/);
});
