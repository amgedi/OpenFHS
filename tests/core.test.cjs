const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../prototype/core.js');
const day = '2026-09-24';
const episode = overrides => ({ event_time_precision: 'minute', event_date: day, event_time: '01:30', time_basis: 'estimate', timezone: 'America/Edmonton', utc_offset: '-06:00', observed_portion: 'whole', duration_status: 'known', duration_value: '20', duration_basis: 'estimated', behaviors: {}, video_exists: 'unknown', evidence_type: 'direct_observation', ...overrides });
const daily = overrides => ({ local_date: day, timezone: 'unknown', coverage: 'intermittent', count_status: 'known', observed_episode_count: '0', count_precision: 'exact', details_complete: 'yes', evidence_type: 'direct_observation', ...overrides });
function fixture() { let i = 0; const state = C.save(C.empty(), 'animals', { name: 'Test fictional cat', scenario: 'comparison' }, { newId: () => 'animal-1' }); return { state, opts: { animalId: 'animal-1', newId: () => 'record-' + (++i) } }; }
test('all response states survive persistence and JSON export without collapsing', () => {
  const f = fixture(); let s = f.state;
  for (const response of C.RESPONSES) s = C.save(s, 'episodes', episode({ behaviors: { skin_rippling: response } }), f.opts);
  const restored = JSON.parse(JSON.stringify(C.exportJSON(s)));
  assert.deepEqual(restored.episodes.map(r => r.behaviors.skin_rippling), C.RESPONSES);
  assert.equal(restored.episodes[0].behaviors.responsiveness, 'not_asked');
  assert.match(C.exportCSV(s, 'episodes'), /not_observed/);
});
test('missing report, zero observed, and no observation remain different', () => {
  const f = fixture(); assert.equal(C.reconcile(f.state, 'animal-1', day).status, 'missing');
  const s = C.save(f.state, 'daily_reports', daily(), f.opts);
  assert.equal(C.reconcile(s, 'animal-1', day).count, 0);
  const absent = C.save(f.state, 'daily_reports', daily({ coverage: 'none', count_status: 'not_observed', observed_episode_count: '' }), f.opts);
  assert.equal(absent.daily_reports[0].observed_episode_count, null);
  assert.throws(() => C.save(f.state, 'daily_reports', daily({ coverage: 'none' }), f.opts), /No observation/);
  assert.throws(() => C.normalize('daily_reports', daily({ count_status: 'unknown', observed_episode_count: 0 })), /cannot have a number/);
});
test('daily counts never add episode details and discrepancies remain intact', () => {
  const f = fixture(); let s = C.save(f.state, 'episodes', episode(), f.opts);
  s = C.save(s, 'daily_reports', daily({ observed_episode_count: '2', details_complete: 'no' }), f.opts);
  assert.deepEqual([C.reconcile(s, 'animal-1', day).count, C.reconcile(s, 'animal-1', day).details], [2, 1]);
  assert.equal(C.reconcile(s, 'animal-1', day).status, 'reported');
  s = C.save(s, 'daily_reports', daily({ observed_episode_count: '0' }), { ...f.opts, id: s.daily_reports[0].id, reason: 'Deliberate conflict example' });
  assert.equal(C.reconcile(s, 'animal-1', day).status, 'review'); assert.equal(s.episodes.length, 1);
});
test('no-coverage report alongside an episode is flagged without inventing a count', () => {
  const f = fixture(); let s = C.save(f.state, 'episodes', episode(), f.opts);
  s = C.save(s, 'daily_reports', daily({ coverage: 'none', count_status: 'not_observed', observed_episode_count: '' }), f.opts);
  const result = C.reconcile(s, 'animal-1', day);
  assert.equal(result.status, 'review'); assert.equal(result.count, null);
  assert.equal(s.daily_reports[0].observed_episode_count, null); assert.equal(s.episodes.length, 1);
});
test('date-only and unknown onset are not invented timestamps; DST offsets remain explicit', () => {
  const dateOnly = C.normalize('episodes', episode({ event_time_precision: 'date', event_time: '' }));
  assert.equal(dateOnly.event_local, day); assert.equal(dateOnly.event_time_precision, 'date');
  assert.equal(C.normalize('episodes', episode({ event_time_precision: 'unknown', event_date: '' })).event_local, null);
  for (const offset of ['-06:00', '-07:00']) assert.equal(C.normalize('episodes', episode({ event_date: '2026-11-01', utc_offset: offset })).utc_offset, offset);
  assert.equal(C.normalize('episodes', episode({ utc_offset: '' })).utc_offset, 'unknown');
});
test('invalid dates, negative duration, fractions in counts, and partial full duration are rejected', () => {
  for (const overrides of [{ duration_value: '-1' }, { event_date: '2026-02-30' }, { observed_portion: 'part' }, { timezone: 'Not/AZone' }, { utc_offset: '+19:00' }]) assert.throws(() => C.normalize('episodes', episode(overrides)));
  assert.throws(() => C.normalize('daily_reports', daily({ observed_episode_count: '1.5' })));
  assert.throws(() => C.normalize('episodes', episode({ duration_status: 'unknown', duration_value: '0' })));
  assert.equal(C.normalize('episodes', episode({ observed_portion: 'part', duration_status: 'not_observed', duration_value: '' })).duration.value, null);
});
test('corrections require reasons, preserve immutable input and original provenance', () => {
  const f = fixture(); const first = C.save(f.state, 'episodes', episode(), f.opts);
  const original = JSON.stringify(first);
  assert.throws(() => C.save(first, 'episodes', episode({ duration_value: '30' }), { ...f.opts, id: first.episodes[0].id }), /Explain why/);
  const second = C.save(first, 'episodes', episode({ duration_value: '30', evidence_type: 'historical_recollection' }), { ...f.opts, id: first.episodes[0].id, reason: 'Reviewed fictional notes' });
  assert.equal(JSON.stringify(first), original);
  assert.equal(second.episodes[0].revision, 2);
  assert.equal(second.episodes[0].revisions[0].previous.duration.value, 20);
  assert.equal(second.episodes[0].revisions[0].previous.provenance.evidence_type, 'direct_observation');
});
test('references and one report per cat per date are enforced', () => {
  const f = fixture(); assert.throws(() => C.save(f.state, 'episodes', episode(), { ...f.opts, animalId: 'missing' }), /existing fictional cat/);
  const s = C.save(f.state, 'daily_reports', daily(), f.opts);
  assert.throws(() => C.save(s, 'daily_reports', daily(), f.opts), /already exists/);
  assert.throws(() => C.save(s, 'daily_reports', daily(), { ...f.opts, id: 'missing' }), /could not be found/);
});
test('CSV quotes embedded text, protects formula cells, and JSON retains literal text', () => {
  const f = fixture(); const notes = '=HYPERLINK("fictional")\nsecond,line';
  const s = C.save(f.state, 'daily_reports', daily({ notes }), f.opts);
  const csv = C.exportCSV(s, 'daily_reports');
  assert.ok(csv.includes('"\'=HYPERLINK(""fictional"")\nsecond,line"'));
  assert.equal(C.exportJSON(s).daily_reports[0].notes, notes);
});
test('exports mark synthetic scope and cannot pretend to be research releases', () => {
  const f = fixture(); const data = C.exportJSON(f.state);
  assert.equal(data.export_metadata.is_research_release, false); assert.equal(data.synthetic_only, true);
  assert.throws(() => C.exportJSON({ ...f.state, synthetic_only: false }));
  assert.throws(() => C.exportCSV({ ...f.state, synthetic_only: false }, 'animals'));
});
test('demo provides comparison observations without assigning diagnoses', () => {
  const s = C.demo(day); assert.equal(s.animals.length, 2); assert.equal(s.episodes.length, 1);
  assert.equal(s.animals[1].scenario, 'comparison');
  assert.equal(s.animals[1].scenario_is_clinical_assessment, false);
  assert.equal(C.reconcile(s, s.animals[0].id, day).status, 'missing');
  assert.equal(C.reconcile(s, s.animals[1].id, day).count, 0);
});
