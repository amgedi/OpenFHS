const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../prototype/core.js');
test('timezone entry supports cities and explicit offsets without inventing seasonal offsets',()=>{
 const base={local_date:'2026-09-28',coverage:'none',details_complete:'unknown',count_precision:'unknown',count_status:'not_observed',evidence_type:'direct_observation'};
 for(const [input,expected] of [['America/Edmonton','America/Edmonton'],['MDT','UTC-06:00'],['MST - 7:00','UTC-07:00'],['UTC+05:45','UTC+05:45'],['unknown','unknown']])assert.equal(C.normalize('daily_reports',{...base,timezone:input}).timezone,expected);
 assert.throws(()=>C.normalize('daily_reports',{...base,timezone:'MDT - 7:00'}),/disagree/);
 assert.throws(()=>C.normalize('daily_reports',{...base,timezone:'UTC+15:00'}));
});

test('older timezone spellings retain their stored form for backup compatibility',()=>{
 const base={local_date:'2026-09-28',coverage:'none',details_complete:'unknown',count_precision:'unknown',count_status:'not_observed',evidence_type:'direct_observation'};
 for(const zone of ['UTC','GMT','MST','America/Edmonton'])assert.equal(C.normalize('daily_reports',{...base,timezone:zone}).timezone,zone);
});
