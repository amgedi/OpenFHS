const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('../prototype/core.js'),F=require('../prototype/features.js');
function languages(){const ctx={window:{}};vm.runInNewContext(fs.readFileSync('prototype/languages.js','utf8'),ctx);return ctx.window.OpenFHSLanguages;}
test('first-run appearance persists once and existing preferences are retained',()=>{
 const values=new Map(),localStorage={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,v)};
 const open=()=>{const ctx={window:{},localStorage};vm.runInNewContext(fs.readFileSync('prototype/experience.js','utf8'),ctx);return ctx.window.OpenFHSExperience.settings;};
 const first=open();assert.equal(first.panelStyle,'glass');assert.equal(first.motion,'gentle');assert.ok(['light','dark','ocean','lavender','sand','rose','midnight','park'].includes(first.theme));assert.equal(open().theme,first.theme);
 values.set('openfhs-preferences-v1',JSON.stringify({theme:'midnight',motion:'reduced',panelStyle:'normal'}));
 const saved=open();assert.equal(saved.theme,'midnight');assert.equal(saved.motion,'reduced');assert.equal(saved.panelStyle,'normal');
 values.set('openfhs-preferences-v1',JSON.stringify({theme:'light',motion:'system',glass:false}));assert.equal(open().panelStyle,'normal');
 values.set('openfhs-preferences-v1','invalid');open();assert.equal(values.get('openfhs-preferences-v1'),'invalid');
});
test('all five languages cover episode and daily question labels without changing stored option codes',()=>{
 const L=languages(),source=fs.readFileSync('prototype/app.js','utf8');
 const block=source.slice(source.indexOf('  function episodeForm()'),source.indexOf('  function settingsPage()'));
 const labels=[...block.matchAll(/(?:input|select|textarea)\('[^']+',\s*'([^']+)'/g)].map(m=>m[1]);
 for(const language of ['es','fr','zh','ar','tr']){
  for(const label of labels)assert.notEqual(L.translate(label,language),label,language+': '+label);
  assert.notEqual(L.translate('Question 3 of 21',language),'Question 3 of 21');
 }
 const s=C.demo('2026-09-24'),before=JSON.stringify(s);
 for(const language of ['es','fr','zh','ar','tr'])F.reportHTML(s,{language,translate:v=>L.translate(v,language)});
 assert.equal(JSON.stringify(s),before);
});
test('bilingual reports retain English reference, uncertainty and literal escaped owner notes',()=>{
 const L=languages(),s=C.demo('2026-09-24');s.episodes[0].context_facts='<img src=x onerror=alert(1)> Unknown owner_note_yes';
 const html=F.reportHTML(s,{language:'fr',translate:v=>L.translate(v,'fr')});
 assert.match(html,/lang="fr"/);assert.match(html,/English reference/);assert.match(html,/Inconnu/);
 assert.match(html,/&lt;img src=x onerror=alert\(1\)&gt; Unknown/);assert.doesNotMatch(html,/<img src=x/);
 assert.match(html,/Zero means zero observed/);
 assert.match(html,/owner_note_yes/);
});
test('new demo cats differ and editing an old cat preserves records while adding optional credit',()=>{
 let s=C.demo('2026-09-24');assert.notDeepEqual(s.animals[0].avatar,s.animals[1].avatar);
 delete s.animals[0].attribution;const original=JSON.stringify(s),cat=s.animals[0];
 const changed=C.save(s,'animals',{...cat,credit_name:'Fictional helper',credit_accounts:'Example: @fictional'},{id:cat.id,reason:'Optional credit'});
 assert.equal(JSON.stringify(s),original);assert.equal(changed.animals[0].attribution.display_name,'Fictional helper');
 assert.equal(changed.animals[0].revisions.at(-1).previous.attribution,undefined);
 assert.deepEqual(changed.episodes,s.episodes);assert.deepEqual(changed.daily_reports,s.daily_reports);
 assert.equal(changed.privacy,undefined);
});
