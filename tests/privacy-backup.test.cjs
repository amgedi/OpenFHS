const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const C=require('../prototype/core.js'),P=require('../prototype/privacy.js'),A=require('../prototype/avatars.js'),F=require('../prototype/features.js');
const off={research:false,training:false,public:false};
test('research, training, and publication preferences are independent and fail closed',()=>{
 let state=C.demo('2026-09-24');const id=state.animals[0].id, video={id:'v',animal_id:id,consent:{local_storage:true}};
 assert.equal(P.organized(state,[video]).research.cats.length,0);
 state=P.set(state,'cat',id,{...off,research:true});
 assert.equal(P.organized(state,[video]).research.videos.length,0);
 state=P.set(state,'video','v',{...off,research:true});
 assert.equal(P.organized(state,[video]).research.videos.length,1);
 assert.equal(P.organized(state,[video]).training.videos.length,0);
 assert.equal(P.organized(state,[video]).public.cats.length,0);
 assert.equal(P.organized(state,[{...video,consent:{local_storage:false}}]).research.videos.length,0);
 state=P.set(state,'cat',id,off);
 assert.equal(P.organized(state,[video]).research.videos.length,0);
 assert.equal(state.privacy.history.at(-1).previous.research,true);
 assert.throws(()=>P.set(state,'cat',id,{research:'true'}),/explicit/);
});
test('avatar presets support varied markings, independent eyes, hairless cats and safe colors',()=>{
 for(const preset of Object.values(A.presets))assert.match(A.svg(preset),/<svg/);
 const v=A.normalize({coat:'black',pattern:'tuxedo',eyes:'blue',rightEye:'gold',pupil:'slate',fur:'hairless'});
 assert.equal(v.rightEye,'gold');assert.match(A.svg(v),/#639dcc/);
 assert.throws(()=>A.normalize({pattern:'<script>'}),/valid/);
});
test('selected-cat exports exclude other cats permissions and global import archives',()=>{
 let state=C.demo('2026-09-24');const [a,b]=state.animals;
 state=P.set(state,'cat',a.id,{...off,research:true});state=P.set(state,'cat',b.id,{...off,training:true});
 state=P.set(state,'video','a-video',{...off,research:true});state=P.set(state,'video','b-video',{...off,research:true});
 state.import_history=[{original_privacy:state.privacy}];
 const selected=F.scope(state,a.id,[{id:'a-video',animal_id:a.id},{id:'b-video',animal_id:b.id}]);
 assert.equal(selected.privacy.decisions.length,2);
 assert.equal(selected.privacy.history.length,2);
 assert.equal(selected.import_history,undefined);
 assert.doesNotMatch(JSON.stringify(selected.privacy),/b-video/);
 assert.equal(F.scope(state,null).import_history.length,1);
});
function backupHarness(){
 const video={id:'video-1',animal_id:'fictional-1',episode_id:null,title:'Synthetic test clip',file_name:'sample.webm',media_type:'video/webm',size_bytes:4,created_at:'2026-09-24T12:00:00.000Z',synthetic:true,consent:{local_storage:true}};
 class Reader {readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:video/webm;base64,'+Buffer.from(b).toString('base64');this.onload();});}}
 const context={window:{},crypto:require('node:crypto').webcrypto,TextEncoder,Blob,Uint8Array,FileReader:Reader,atob,OpenFHS:C,OpenFHSFeatures:F,OpenFHSMedia:{get:async()=>({...video,blob:new Blob(['test'],{type:'video/webm'})})}};
 vm.runInNewContext(fs.readFileSync('prototype/backup.js','utf8'),context);
 return {B:context.window.OpenFHSBackup,video};
}
test('complete backup restores records and bytes as copies with sharing off',async()=>{
 const {B,video}=backupHarness();let state=C.demo('2026-09-24');state=P.set(state,'cat',state.animals[0].id,{...off,research:true});
 const content=await B.create(state,{theme:'dark'},[video]);
 const inspected=await B.inspect(new Blob([content]));
 assert.equal(await inspected.files[0].blob.text(),'test');
 const imported=B.prepareImport(C.empty(),inspected);
 assert.equal(imported.state.animals.length,2);assert.notEqual(imported.state.animals[0].id,state.animals[0].id);
 assert.equal(imported.files[0].animal_id,imported.state.animals[0].id);
 assert.equal(P.organized(imported.state,imported.files).research.cats.length,0);
 assert.equal(imported.state.import_history.length,1);
 assert.equal(imported.state.episodes[0].animal_id,imported.state.animals[0].id);
});
test('backup integrity failure and invalid references are rejected before import',async()=>{
 const {B}=backupHarness(),content=await B.create(C.demo('2026-09-24'),{},[]);
 const changed=JSON.parse(content);changed.payload.state.animals[0].name='Altered';
 await assert.rejects(()=>B.inspect(new Blob([JSON.stringify(changed)])),/integrity/);
 const state=C.demo('2026-09-24');state.episodes[0].animal_id='missing';
 await assert.rejects(()=>B.inspect(new Blob(['not JSON'])),/readable/);
 const invalid=await B.create(state,{},[]);await assert.rejects(()=>B.inspect(new Blob([invalid])),/missing cat/);
});
test('backup drafts restore under copied cats without becoming submitted records',async()=>{
 const {B}=backupHarness(),state=C.demo('2026-09-24');
 const drafts=[{animal_id:state.animals[0].id,type:'daily_reports',record_id:null,fields:{notes:'Unfinished only',local_date:'2026-09-24'},updated:'2026-09-24T12:00:00Z'}];
 const inspected=await B.inspect(new Blob([await B.create(state,{},[],drafts)]));
 const restored=B.prepareImport(C.empty(),inspected).state;
 assert.equal(restored.daily_reports.length,state.daily_reports.length);
 assert.equal(restored.recovered_drafts[0].animal_id,restored.animals[0].id);
 assert.equal(restored.recovered_drafts[0].fields.notes,'Unfinished only');
 assert.equal(F.scope(restored,null).recovered_drafts,undefined);
 await assert.rejects(()=>B.create(state,{},[],[{...drafts[0],animal_id:'absent'}]),/draft/);
 await assert.rejects(()=>B.create(state,{},[],[...drafts,...drafts]),/draft/);
});
test('older backup without draft payload remains recoverable',async()=>{
 const {B}=backupHarness(),state=C.demo('2026-09-24');
 const pack=JSON.parse(await B.create(state,{},[]));delete pack.payload.drafts;
 pack.sha256=require('node:crypto').createHash('sha256').update(JSON.stringify(pack.payload)).digest('hex');
 const inspected=await B.inspect(new Blob([JSON.stringify(pack)]));
 assert.equal(inspected.drafts.length,0);
 assert.equal(B.prepareImport(C.empty(),inspected).state.animals.length,2);
});
test('repeated imports keep distinct copies without overwriting existing identities',async()=>{
 const {B}=backupHarness(),original=C.demo('2026-09-24');
 const pack=await B.inspect(new Blob([await B.create(original,{},[])]));
 const first=B.prepareImport(original,pack).state,second=B.prepareImport(first,pack).state;
 assert.equal(second.animals.length,6);
 assert.equal(new Set(second.animals.map(a=>a.id)).size,6);
 assert.equal(JSON.stringify(second.animals.slice(0,2)),JSON.stringify(original.animals));
 assert.equal(second.daily_reports.length,3);
});
test('backup import rejects malformed timestamps and coerced record shapes before persistence',async()=>{
 const {B}=backupHarness();
 for(const mutate of [s=>s.episodes[0].created_at=0,s=>s.episodes[0].updated_at={},s=>s.daily_reports[0].local_date=['2026-09-24'],s=>s.animals[0].name=['Juniper']]){
  const state=C.demo('2026-09-24');mutate(state);
  const content=await B.create(state,{},[]);
  await assert.rejects(()=>B.inspect(new Blob([content])),/Invalid backup/);
 }
});
test('backup timestamp checks also cover correction snapshots and video metadata',async()=>{
 const {B,video}=backupHarness();
 let state=C.demo('2026-09-24');
 const cat=state.animals[0];
 state=C.save(state,'animals',cat,{id:cat.id,reason:'Fictional correction'});
 const control=await B.inspect(new Blob([await B.create(state,{},[video])]));
 assert.equal(control.state.animals[0].revisions.length,1);
 for(const change of [s=>s.animals[0].revisions[0].previous.created_at=[],s=>s.animals[0].revisions[0].changed_at=null]){
  const bad=JSON.parse(JSON.stringify(state));change(bad);
  const content=await B.create(bad,{},[]);
  await assert.rejects(()=>B.inspect(new Blob([content])),/Invalid backup/);
 }
 const badVideo=await B.create(state,{},[{...video,created_at:{date:'2026-09-24'}}]);
 await assert.rejects(()=>B.inspect(new Blob([badVideo])),/Invalid backup timestamp/);
});


test('backup rejects missing required stored fields while preserving legacy optional snapshots',async()=>{
 const {B}=backupHarness();
 for(const mutate of [s=>delete s.episodes[0].duration.value,s=>delete s.daily_reports[0].observation_minutes,s=>delete s.episodes[0].behaviors.skin_rippling]){
  const state=C.demo('2026-09-24');mutate(state);
  await assert.rejects(async()=>B.inspect(new Blob([await B.create(state,{},[])])));
 }
 const older=C.demo('2026-09-24');delete older.animals[0].avatar;delete older.baselines[0].diet;delete older.baselines[0].routine;
 const restored=await B.inspect(new Blob([await B.create(older,{},[])]));
 assert.equal(restored.state.animals[0].name,'Juniper');
});


test('pre-attribution backups recover as copies without mutating originals or adding sharing permission',async()=>{
 const {B}=backupHarness(),state=C.demo('2026-09-24');for(const cat of state.animals)delete cat.attribution;
 const original=JSON.stringify(state),content=await B.create(state,{},[]),pack=await B.inspect(new Blob([content]));
 const restored=B.prepareImport(state,pack).state;
 assert.equal(JSON.stringify(state),original);assert.deepEqual(JSON.parse(JSON.stringify(restored.animals.slice(0,2))),state.animals);
 assert.equal(P.organized(restored,[]).public.cats.length,0);
});

test('import storage failures preserve existing records and clean up only staged media',async()=>{
 const {B}=backupHarness(),prepared={state:{saved:true},files:[{id:'new-video'}]};
 const run=async({addError=false,saveError=false,changed=false,cleanupError=false}={})=>{
  let saved=false,removed=[];
  const media={addBatch:async()=>{if(addError)throw Error('Quota exceeded');},removeBatch:async ids=>{removed.push(...ids);if(cleanupError)throw Error('Cleanup failed');}};
  let error;try{await B.commitImport(prepared,{media,persist:()=>{if(saveError)throw Error('Records storage full');saved=true;},unchanged:()=>!changed});}catch(e){error=e;}
  return {saved,removed,error};
 };
 const mediaFailure=await run({addError:true});assert.equal(mediaFailure.saved,false);assert.deepEqual(mediaFailure.removed,[]);
 const recordFailure=await run({saveError:true});assert.equal(recordFailure.saved,false);assert.deepEqual(recordFailure.removed,['new-video']);assert.match(recordFailure.error.message,/storage full/);
 const conflict=await run({changed:true});assert.equal(conflict.saved,false);assert.deepEqual(conflict.removed,['new-video']);
 const failedCleanup=await run({saveError:true,cleanupError:true});assert.match(failedCleanup.error.message,/cleanup could not finish/);
 const success=await run();assert.equal(success.saved,true);assert.deepEqual(success.removed,[]);assert.equal(success.error,undefined);
});

test('durable import journal recovers interruptions before and after record commit',async()=>{
 const {B}=backupHarness();
 for(const committed of [false,true]){
  const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:()=>{throw Error('Interrupted cleanup');}};
  let saved=C.empty(),removed=[];
  const prepared={state:C.demo('2026-09-24'),files:[{id:'new-video'}]};
  const media={addBatch:async()=>{if(!committed)throw Error('Interrupted before records');},removeBatch:async ids=>removed.push(...ids)};
  try{await B.commitImport(prepared,{storage,media,persist:s=>{saved=s;},unchanged:()=>true});}catch(error){assert.match(error.message,/Interrupted/);}
  assert.equal(B.recoveryStatus(storage),true);
  storage.removeItem=k=>values.delete(k);
  const message=await B.recoverImport({storage,media,readState:()=>saved});
  assert.equal(B.recoveryStatus(storage),false);
  if(committed){assert.deepEqual(removed,[]);assert.match(message,/finished saving/);assert.equal(saved.animals.length,2);}
  else{assert.deepEqual(removed,['new-video']);assert.match(message,/rolled back/);assert.equal(saved.animals.length,0);}
  assert.match(await B.recoverImport({storage,media,readState:()=>saved}),/No interrupted/);
 }
});

test('recovery refuses to remove media when saved diary cannot be read',async()=>{
 const {B}=backupHarness();const values=new Map();const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 let removed=false;const media={addBatch:async()=>{throw Error('Stopped');},removeBatch:async()=>{removed=true;}};
 await assert.rejects(()=>B.commitImport({state:C.empty(),files:[]},{storage,media,persist:()=>{},unchanged:()=>true}));
 await assert.rejects(()=>B.recoverImport({storage,media,readState:()=>null}),/unavailable/);
 assert.equal(removed,false);assert.equal(B.recoveryStatus(storage),true);
});
