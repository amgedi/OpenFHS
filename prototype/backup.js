window.OpenFHSBackup = (()=>{
 const LIMIT=150*1024*1024;
 const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 let downloadSequence=0;
 function uniqueFilename(name){
  const dot=name.lastIndexOf('.'),stem=dot>0?name.slice(0,dot):name,extension=dot>0?name.slice(dot):'';
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const random=new Uint32Array(1);crypto.getRandomValues(random);
  return `${stem}-${stamp}-${(++downloadSequence).toString(36)}-${random[0].toString(36)}${extension}`;
 }
 function download(content,name,type='application/json'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=uniqueFilename(name);document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
 async function create(state,preferences,media,drafts=[]){
  validateDrafts(drafts,state);
  if(media.length>200||['animals','baselines','episodes','daily_reports'].some(k=>state[k].length>10000))throw Error('This diary exceeds the prototype backup record limit. Export technical records and keep original videos; larger archival backups need a dedicated release.');
  const files=[];let size=0;
  for(const meta of media){if(!state.animals.some(a=>a.id===meta.animal_id)||meta.episode_id&&!state.episodes.some(e=>e.id===meta.episode_id&&e.animal_id===meta.animal_id))throw Error('A video refers to a missing cat or episode. Backup stopped so the problem can be repaired before recovery is needed.');}
  for(const meta of media){const clip=await OpenFHSMedia.get(meta.id);if(!clip?.blob)throw Error('A video is unavailable; backup stopped rather than omitting it.');size+=clip.blob.size;if(size>100*1024*1024)throw Error('This prototype supports full backups up to 100 MB of videos. Keep original clips; smaller selective backups are planned.');const bytes=await clip.blob.arrayBuffer();const base64=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=()=>reject(Error('Could not read a video.'));r.readAsDataURL(clip.blob);});files.push({metadata:meta,sha256:await hash(bytes),base64});}
  const payload={state,preferences,files,drafts};const serialized=JSON.stringify(payload);
  const packed=JSON.stringify({format:'openfhs-local-backup-v1',created_at:new Date().toISOString(),sha256:await hash(new TextEncoder().encode(serialized)),payload});
  if(new Blob([packed]).size>LIMIT)throw Error('The complete backup exceeds this prototype’s 150 MB recovery limit. Keep original clips and export technical records.');
  return packed;
 }
 async function inspect(file){
  if(!file||file.size>LIMIT)throw Error('Choose an OpenFHS backup smaller than 150 MB.');
  let pack;try{pack=JSON.parse(await file.text());}catch{throw Error('This file is not a readable backup.');}
  if(pack.format!=='openfhs-local-backup-v1'||!pack.payload)throw Error('Choose a complete OpenFHS backup, not a technical export.');
  if(await hash(new TextEncoder().encode(JSON.stringify(pack.payload)))!==pack.sha256)throw Error('Backup integrity check failed. Keep the file and try a different copy.');
  const {state,files}=pack.payload;
  if(state?.synthetic_only!==true||state.schema_version!==OpenFHS.VERSION||!Array.isArray(files)||files.length>200)throw Error('Unsupported backup version or non-fictional data.');
  const ids=new Set();
  for(const type of ['animals','baselines','episodes','daily_reports']){
   if(!Array.isArray(state[type])||state[type].length>10000)throw Error('Invalid record collection.');
   for(const r of state[type]){if(typeof r.id!=='string'||!r.id||ids.has(r.id)||r.synthetic!==true||!Number.isInteger(r.revision)||r.revision<1||!Array.isArray(r.revisions))throw Error('Invalid or duplicate record.');ids.add(r.id);if(type!=='animals'&&!state.animals.some(a=>a.id===r.animal_id))throw Error('A record refers to a missing cat.');validateRecord(type,r);for(const prior of r.revisions){if(!prior.previous||prior.previous.id!==r.id)throw Error('Invalid correction history.');validateTimestamp(prior.changed_at);validateRecord(type,prior.previous);}}
  }
  const dailyKeys=new Set();for(const r of state.daily_reports){const key=r.animal_id+'|'+r.local_date;if(dailyKeys.has(key))throw Error('Duplicate daily report.');dailyKeys.add(key);}
  let size=0;const decoded=[];
  for(const item of files){const m=item.metadata;if(!m||typeof m.id!=='string'||ids.has(m.id)||!state.animals.some(a=>a.id===m.animal_id)||m.consent?.local_storage!==true)throw Error('Invalid video reference or storage permission.');validateTimestamp(m.created_at);ids.add(m.id);if(m.episode_id&&!state.episodes.some(e=>e.id===m.episode_id&&e.animal_id===m.animal_id))throw Error('Video episode does not belong to its cat.');if(typeof item.base64!=='string'||!/^[A-Za-z0-9+/]*={0,2}$/.test(item.base64))throw Error('Invalid video encoding.');let bytes;try{bytes=Uint8Array.from(atob(item.base64),c=>c.charCodeAt(0));}catch{throw Error('Invalid video encoding.');}size+=bytes.length;if(size>100*1024*1024||bytes.length!==m.size_bytes)throw Error('Video size check failed.');OpenFHSFeatures.validateVideo({type:m.media_type,size:bytes.length},true);if(await hash(bytes)!==item.sha256)throw Error('Video integrity check failed.');decoded.push({...m,blob:new Blob([bytes],{type:m.media_type})});}
  validateDrafts(pack.payload.drafts||[],state);
  return {state,files:decoded,preferences:pack.payload.preferences,drafts:pack.payload.drafts||[]};
 }
 function validateDrafts(drafts,state){
  if(!Array.isArray(drafts)||drafts.length>1000)throw Error('Invalid draft collection.');
  const keys=new Set();
  for(const d of drafts){
   const key=[d.animal_id,d.type,d.record_id].join('|');
   if(!d||!state.animals.some(a=>a.id===d.animal_id)||!['episodes','daily_reports'].includes(d.type)||d.record_id!==null&&!state[d.type].some(r=>r.id===d.record_id&&r.animal_id===d.animal_id)||keys.has(key)||!d.fields||Array.isArray(d.fields)||typeof d.fields!=='object'||Object.keys(d.fields).length>100||Object.entries(d.fields).some(([k,v])=>!/^\w{1,80}$/.test(k)||['__proto__','constructor','prototype'].includes(k)||typeof v!=='string'||v.length>4000))throw Error('Invalid draft or draft reference.');
   keys.add(key);
  }
 }
 function validateRecord(type,r){
  if(!r||typeof r!=='object'||Array.isArray(r))throw Error('Invalid backup record.');
  validateTimestamp(r.created_at);validateTimestamp(r.updated_at);
  const input={...r,evidence_type:r.provenance?.evidence_type};
  if(type==='episodes')Object.assign(input,{event_date:r.event_local?.slice(0,10),event_time:r.event_local?.slice(11,16),duration_status:r.duration?.value==null?r.duration?.missing_reason:'known',duration_value:r.duration?.value??'',duration_basis:r.duration?.basis});
  if(type==='baselines')Object.assign(input,{diet:r.diet?.text||'',routine:r.routine?.text||''});
  validateShape(OpenFHS.normalize(type,input),r);
 }
 function validateTimestamp(value){if(typeof value!=='string'||value.length>40||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error('Invalid backup timestamp.');}
 // The form normalizer accepts text inputs; stored records must retain typed values.
 function validateShape(expected,actual,path=''){
  if(expected===null){if(actual!==null)throw Error('Invalid backup field type.');return;}
  if(typeof actual!==typeof expected||Array.isArray(expected)!==Array.isArray(actual)||actual===null)throw Error('Invalid backup field type.');
  if(typeof expected==='object')for(const key of Object.keys(expected)){
   const field=path?path+'.'+key:key;
   // Older correction snapshots can predate decorative avatars and optional context.
   const legacyOptional=['attribution','avatar','avatar.rightEye','avatar.pattern','avatar.pupil','diet','routine'];
   if(actual[key]===undefined&&legacyOptional.includes(field))continue;
   validateShape(expected[key],actual[key],field);
  }
 }
 function prepareImport(current,pack){
  const next=JSON.parse(JSON.stringify(current)),mapping=new Map();
  for(const type of ['animals','baselines','episodes','daily_reports'])for(const r of pack.state[type])mapping.set(r.id,crypto.randomUUID());
  for(const f of pack.files)mapping.set(f.id,crypto.randomUUID());
  const remap=value=>{if(Array.isArray(value))return value.map(remap);if(value&&typeof value==='object'){const out={};for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Unsupported backup property.');out[key]=['id','animal_id','episode_id','subject_id'].includes(key)&&mapping.has(v)?mapping.get(v):remap(v);}return out;}return value;};
  for(const type of ['animals','baselines','episodes','daily_reports'])next[type].push(...pack.state[type].map(r=>{const out=remap(r);if(type==='animals')out.name=(out.name.slice(0,45)+' (imported)');return out;}));
  // Imported choices are archived, never treated as fresh consent.
  next.import_history ||= [];next.import_history.push({at:new Date().toISOString(),original_privacy:pack.state.privacy||null,original_preferences:pack.preferences||null,notice:'Imported subjects start with all future-use preferences off.'});
  const files=pack.files.map(({blob,...meta})=>({...remap(meta),blob}));
  next.recovered_drafts ||= [];
  next.recovered_drafts.push(...(pack.drafts||[]).map(d=>({...d,animal_id:mapping.get(d.animal_id),record_id:d.record_id?mapping.get(d.record_id):null})));
  return {state:next,files};
 }
 const JOURNAL='openfhs-import-recovery-v1';
 function recoveryStatus(storage){return storage.getItem(JOURNAL)!==null;}
 async function recoverImport({storage,media,readState}){
  const raw=storage.getItem(JOURNAL);if(raw===null)return 'No interrupted import needs recovery.';
  let journal;try{journal=JSON.parse(raw);}catch{throw Error('Recovery information is unreadable. Keep your backup and contact support.');}
  if(journal.version!==1||typeof journal.id!=='string'||!Array.isArray(journal.files)||journal.files.length>200||journal.files.some(id=>typeof id!=='string'))throw Error('Unsupported import recovery information. Keep your backup.');
  const saved=readState();
  if(!saved||!Array.isArray(saved.animals))throw Error('Saved diary is unavailable. Recovery stopped without removing videos.');
  const committed=saved.import_history?.some(entry=>entry.operation_id===journal.id);
  if(!committed)await media.removeBatch(journal.files);
  storage.removeItem(JOURNAL);
  return committed?'The import finished saving. Its records and videos were kept.':'The unfinished import was rolled back. Existing records were kept. You can import your backup again.';
 }
 async function commitImport(prepared,{media,persist,unchanged,storage}){
  if(storage){
   if(recoveryStatus(storage))throw Error('An earlier import needs recovery. Use Check import recovery before retrying.');
   const id=crypto.randomUUID();
   prepared.state.import_history ||= [];
   prepared.state.import_history.push({operation_id:id,at:new Date().toISOString(),notice:'Local import commit marker.'});
   storage.setItem(JOURNAL,JSON.stringify({version:1,id,files:prepared.files.map(file=>file.id)}));
  }
  await media.addBatch(prepared.files);
  try {
   if(!unchanged())throw Error('Diary changed during import. Please retry.');
   persist(prepared.state);
  } catch(error) {
   try {await media.removeBatch(prepared.files.map(v=>v.id));}
   catch {throw Error(error.message+' Imported video cleanup could not finish. Keep the original backup and report this error before retrying.');}
   if(storage)storage.removeItem(JOURNAL);
   throw error;
  }
  // Once committed, cleanup failure must never roll back saved media.
  if(storage)try{storage.removeItem(JOURNAL);}catch{}
 }
 return {create,inspect,prepareImport,commitImport,recoverImport,recoveryStatus,download,uniqueFilename};
})();
