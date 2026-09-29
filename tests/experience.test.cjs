const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../prototype/core.js');
const F = require('../prototype/features.js');
test('participation counts honest no-observation reports, deduplicates dates, and isolates cats', () => {
 const reports = ['2026-03-01','2026-02-28','2026-02-27','2026-02-27'].map(local_date => ({animal_id:'a',local_date,coverage:'none'}));
 reports.push({animal_id:'b',local_date:'2026-02-26'},{animal_id:'a',local_date:'2026-03-03'});
 assert.deepEqual(F.participation(reports,'a','2026-03-01'),{streak:3,lastSeven:3,todayDone:true});
 assert.deepEqual(F.participation(reports,'a','2026-03-02'),{streak:3,lastSeven:3,todayDone:false});
 assert.equal(F.participation(reports,'a','2026-03-05').streak,0);
});
test('diet and routine remain optional, dated, and removable from readable reports', () => {
 let s = C.demo('2026-09-24'); const b = s.baselines[0];
 const input = {...b, evidence_type:b.provenance.evidence_type, diet:'Fictional kibble twice daily',routine:'Evening play'};
 s = C.save(s,'baselines',input,{animalId:b.animal_id});
 assert.equal(s.baselines.at(-1).diet.text,input.diet);
 assert.equal(s.baselines.at(-1).not_asked.includes('diet'),false);
 assert.match(F.readable(s),/Fictional kibble twice daily/);
 assert.doesNotMatch(F.readable(s,{includeNotes:false}),/Fictional kibble twice daily/);
 assert.equal(C.normalize('baselines',{...input,diet:''}).diet.missing_reason,'not_answered');
});
test('avatars accept only supported choices and survive correction history', () => {
 let s = C.demo('2026-09-24'); const a = s.animals[0];
 s = C.save(s,'animals',{...a,fur:'long',coat:'ginger',eyes:'blue'},{id:a.id,reason:'Avatar preference'});
 assert.equal(s.animals[0].avatar.coat,'ginger');
 assert.equal(s.animals[0].revisions.length,1);
 assert.throws(()=>C.normalize('animals',{...a,coat:'<script>'}),/coat color/);
});
