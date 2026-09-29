const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../prototype/core.js');
const F = require('../prototype/features.js');
const state = () => C.demo('2026-09-24');
test('support reports include only explicitly entered fields and reject unlisted routing', () => {
  const input={kind:F.SUPPORT_KINDS[0],area:'Not sure',detail:'The next button did not work.',state:{private:'secret'},animal:'Private cat',device:''};
  const report=F.supportReport(input);
  assert.match(report,/The next button did not work/);
  assert.doesNotMatch(report,/secret|Private cat/);
  assert.throws(()=>F.supportReport({...input,kind:'Injected\nRecipient: attacker'}),/Choose/);
  assert.throws(()=>F.supportReport({...input,detail:' '}),/Tell us/);
  assert.throws(()=>F.supportReport({...input,detail:'x'.repeat(2001)}),/shorten/);
});
test('temporary submissions retain drafts without accessing unavailable storage', () => {
  const storage={getItem(){throw Error('unavailable');},removeItem(){throw Error('must not remove');}};
  assert.equal(F.removeDraft(storage,'draft','saved answers',false),false);
});
test('draft cleanup preserves a newer draft and reports deletion failures', () => {
  let raw='newer answers';
  const storage={getItem:()=>raw,removeItem(){raw=null;}};
  assert.throws(()=>F.removeDraft(storage,'draft','older answers'),/another tab/);
  assert.equal(raw,'newer answers');
  assert.equal(F.removeDraft(storage,'draft','newer answers'),true);
  assert.equal(raw,null);
  assert.throws(()=>F.removeDraft({getItem:()=>null,removeItem(){throw Error('storage denied');}},'draft',null),/storage denied/);
});
test('readable reports preserve uncertainty and distinguish zero from missing reporting', () => {
  const report = F.readable(state());
  assert.match(report, /Not observed/); assert.match(report, /Not answered/); assert.match(report, /Unknown/);
  assert.match(report, /Episodes observed: 0 \(exact\)/); assert.match(report, /Reporting is missing/);
  assert.match(report, /must not be added together/); assert.doesNotMatch(report, /"animal_id"/);
});
test('selected-cat reports and technical scopes do not leak other cats', () => {
  const s = state(); const selected = s.animals[1].id;
  const report = F.readable(s, { animalId: selected });
  assert.match(report, /Miso/); assert.doesNotMatch(report, /Juniper/);
  const subset = F.scope(s, selected);
  assert.equal(subset.animals.length, 1); assert.equal(subset.episodes.length, 0);
  assert.equal(subset.baselines.length, 0); assert.equal(subset.daily_reports.length, 1);
  assert.equal(s.animals.length, 2); assert.throws(() => F.scope(s, 'missing'));
});
test('readable HTML escapes written content; omitting notes really removes them', () => {
  const s = state(); s.episodes[0].context_facts = '<script>alert("fictional")</script>';
  const html = F.reportHTML(s);
  assert.doesNotMatch(html, /<script>/); assert.match(html, /&lt;script&gt;/);
  const without = F.reportHTML(s, { includeNotes: false });
  assert.doesNotMatch(without, /alert|Room was quiet/);
  assert.match(without, /written notes are omitted/);
});
test('readable report flags contradictory counts without correcting source data', () => {
  const s = state(); s.daily_reports[0].animal_id = s.animals[0].id;
  assert.match(F.readable(s), /Review needed/); assert.equal(s.daily_reports[0].observed_episode_count, 0);
});
test('video storage requires explicit permission, a supported type and bounded size', () => {
  const file = { type: 'video/webm', size: 128, name: 'fictional.webm' };
  assert.throws(() => F.validateVideo(file, false), /permission/);
  assert.throws(() => F.validateVideo({ ...file, type: 'text/html' }, true), /Choose an MP4/);
  assert.throws(() => F.validateVideo({ ...file, size: F.MAX_BYTES + 1 }, true), /50 MB/);
  assert.throws(() => F.validateVideo({ ...file, size: 0 }, true), /nonempty/);
  const record = F.mediaRecord(file, { consent: true, animalId: 'cat', id: 'video', now: '2026-09-24T00:00:00Z' });
  assert.equal(record.consent.text, F.CONSENT_TEXT);
  assert.equal(record.consent.local_storage, true);
  assert.equal(record.consent.research, false); assert.equal(record.consent.model_training, false); assert.equal(record.consent.public_sharing, false);
});
