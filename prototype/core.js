(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenFHS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.1.0-prototype';
  const RESPONSES = ['not_answered', 'yes', 'no', 'unknown', 'not_observed'];
  const BEHAVIORS = {
    skin_rippling: 'Visible skin rippling', tail_chasing: 'Chasing tail',
    body_biting: 'Biting own body', vocalization: 'Vocalization',
    running: 'Running', visible_injury: 'Visible injury'
  };
  const HISTORY = { neurological: 'Neurological history', skin: 'Skin history', pain_mobility: 'Pain or mobility history', behavioral: 'Behavioral history' };
  const DICTIONARY = {
    version: VERSION,
    scope: 'Synthetic local walkthrough; partial implementation of the v0.1 draft.',
    responses: { yes: 'Seen during the observed portion', no: 'Watched for and absent during the observed portion', unknown: 'Cannot determine', not_observed: 'Relevant portion or body area not watched', not_answered: 'Question left unanswered', not_asked: 'Question absent from this form version' },
    behaviors: BEHAVIORS,
    missing_quantities: ['unknown', 'not_observed', 'declined'],
    daily_counts: 'Daily counts overlap episode details. Never add them. Zero means zero observed during stated coverage.',
    time: 'event_local retains entered local date/time; event_time_precision preserves date-only/unknown. No UTC instant is inferred. utc_offset is explicitly entered or unknown.',
    provenance: 'All records are fictional owner/caregiver reports, unverified. Evidence basis is selected per record. Other roles and field overrides are deferred.',
    unasked_episode_fields: ['tail_movement', 'grooming', 'licking', 'scratching', 'pupil_change', 'startle', 'directed_behaviors', 'urination', 'defecation', 'responsiveness', 'recovery_duration'],
    csv: 'Current records only. JSON includes revision history and dictionary. Nested objects are JSON in cells. Potential spreadsheet-formula text is prefixed with an apostrophe; JSON preserves the original.'
  };
  function assert(ok, message) { if (!ok) throw new Error(message); }
  function choice(value, choices, label) { assert(choices.includes(value), 'Choose a valid ' + label + '.'); return value; }
  function text(value, max = 2000) { const s = String(value ?? '').trim(); assert(s.length <= max, 'Text is too long (maximum ' + max + ' characters).'); return s; }
  function date(value, label = 'date') {
    const s = text(value);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(s) && Number(s.slice(0, 4)) >= 1900, 'Enter a valid ' + label + '.');
    const d = new Date(s + 'T00:00:00Z');
    assert(!isNaN(d) && d.toISOString().slice(0, 10) === s, 'Enter a valid ' + label + '.');
    return s;
  }
  function quantity(value, missing, unit, basis) {
    if (missing !== 'known') {
      choice(missing, ['unknown', 'not_observed', 'declined'], 'missing-data reason');
      assert(value === '' || value == null, 'A missing quantity cannot also have a value.');
      return { value: null, unit, basis: null, missing_reason: missing };
    }
    assert(value !== '' && value != null, 'Enter the quantity or choose why it is missing.');
    const n = Number(value);
    assert(Number.isFinite(n) && n >= 0, 'Quantities must be finite and nonnegative.');
    choice(basis, ['timed', 'estimated', 'video'], 'measurement basis');
    return { value: n, unit, basis, missing_reason: null };
  }
  function timezone(value) {
    let s = text(value, 100) || 'unknown';
    const aliases={UTC:'+00:00',GMT:'+00:00',MDT:'-06:00',MST:'-07:00'};
    const combined=s.toUpperCase().match(/^(UTC|GMT|MDT|MST)\s*([+-])\s*(\d{1,2}):(\d{2})$/);
    if(combined){const offset=combined[2]+combined[3].padStart(2,'0')+':'+combined[4];if(!['UTC','GMT'].includes(combined[1])&&aliases[combined[1]]!==offset)throw new Error('Timezone abbreviation and offset disagree. MDT is -06:00; MST is -07:00. Use a city timezone if unsure.');s='UTC'+offset;}
    else {try{new Intl.DateTimeFormat('en',{timeZone:s});return s;}catch{} if(aliases[s.toUpperCase()])s='UTC'+aliases[s.toUpperCase()];}
    if(/^UTC[+-](?:0\d|1[0-3]):[0-5]\d$/.test(s)||/^UTC[+-]14:00$/.test(s))return s;
    if (s !== 'unknown') {
      try { new Intl.DateTimeFormat('en', { timeZone: s }); }
      catch { throw new Error('Enter an IANA timezone such as America/Edmonton, or unknown.'); }
    }
    return s;
  }
  function provenance(basis) {
    choice(basis, ['direct_observation', 'historical_recollection', 'video'], 'evidence basis');
    return { reporter_role: 'owner_caregiver', evidence_type: basis, verification_status: 'unverified', source_ref: null };
  }
  function normalize(type, input) {
    if (type === 'animals') {
      const name = text(input.name, 60); assert(name, 'Give the fictional cat a name.');
      return { name, attribution: {version:'attribution-v1',display_name:text(input.credit_name??input.attribution?.display_name,120),accounts:text(input.credit_accounts??input.attribution?.accounts,500)}, species: 'feline', scenario: choice(input.scenario, ['comparison', 'episode_observations', 'unspecified'], 'practice scenario'), scenario_is_clinical_assessment: false, avatar: (typeof module === 'object' && module.exports ? require('./avatars.js') : globalThis.OpenFHSAvatars).normalize({ ...input.avatar, ...Object.fromEntries(['coat','eyes','rightEye','fur','pattern','pupil'].filter(k=>input[k]!==undefined).map(k=>[k,input[k]])) }) };
    }
    if (type === 'baselines') {
      const histories = {};
      for (const k of Object.keys(HISTORY)) histories[k] = choice(input.histories?.[k] || 'not_answered', ['not_answered', 'reported', 'none_reported', 'unknown'], 'history response');
      return { effective_date: date(input.effective_date), breed: text(input.breed, 100) || null,
        breed_missing_reason: text(input.breed, 100) ? null : 'unknown',
        sex: choice(input.sex, ['unknown', 'female', 'male', 'other'], 'sex'),
        neuter_status: choice(input.neuter_status, ['unknown', 'yes', 'no'], 'neuter status'),
        lifestyle: choice(input.lifestyle, ['unknown', 'indoor', 'outdoor', 'both'], 'lifestyle'), histories,
        notes: text(input.notes), provenance: provenance(input.evidence_type),
        diet: { text: text(input.diet), missing_reason: text(input.diet) ? null : 'not_answered' }, routine: { text: text(input.routine), missing_reason: text(input.routine) ? null : 'not_answered' }, not_asked: ['age', 'weight', 'medications', 'supplements', 'flea_prevention'] };
    }
    if (type === 'episodes') {
      const precision = choice(input.event_time_precision, ['minute', 'date', 'unknown'], 'time precision');
      let local = null;
      if (precision !== 'unknown') {
        const day = date(input.event_date, 'episode date');
        if (precision === 'minute') {
          assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(input.event_time || ''), 'Enter a time, or choose date only / unknown.');
          local = day + 'T' + input.event_time;
        } else local = day;
      }
      const offset = (text(input.utc_offset, 20) || 'unknown').replace(/^([+-])\s*(\d):(\d{2})$/,(_,sign,hour,minute)=>sign+'0'+hour+':'+minute);
      const zone=timezone(input.timezone);
      assert(offset === 'unknown' || /^([+-])(?:0\d|1[0-3]):[0-5]\d$/.test(offset) || /^[+-]14:00$/.test(offset), 'Use an offset such as -06:00, or leave it unknown.');
      const observed = choice(input.observed_portion, ['whole', 'part', 'unknown'], 'observed portion');
      const duration = quantity(input.duration_value, input.duration_status, 's', input.duration_basis);
      assert(observed === 'whole' || duration.value === null, 'Full duration cannot be recorded when the whole episode was not observed. Choose a missing reason.');
      const behaviors = {};
      for (const key of Object.keys(BEHAVIORS)) behaviors[key] = choice(input.behaviors?.[key] || 'not_answered', RESPONSES, 'behavior response');
      for (const key of DICTIONARY.unasked_episode_fields) behaviors[key] = 'not_asked';
      return { module: 'openfhs', event_local: local, event_time_precision: precision,
        time_basis: choice(input.time_basis, ['clock', 'estimate', 'recollection', 'video'], 'time basis'),
        timezone: zone, utc_offset: offset, observed_portion: observed, duration,
        behaviors, preceding_activity: text(input.preceding_activity), body_location: text(input.body_location, 200),
        context_facts: text(input.context_facts), suspected_trigger: text(input.suspected_trigger),
        recovery_observation: text(input.recovery_observation), video_exists: choice(input.video_exists, RESPONSES, 'video response'),
        provenance: provenance(input.evidence_type) };
    }
    if (type === 'daily_reports') {
      const coverage = choice(input.coverage, ['none', 'intermittent'], 'observation coverage');
      const status = choice(input.count_status, ['known', 'unknown', 'not_observed'], 'count status');
      assert(coverage !== 'none' || status === 'not_observed', 'No observation coverage requires “Not observed”, not a zero count.');
      assert(coverage !== 'intermittent' || status !== 'not_observed', 'Choose known or unknown for the count during intermittent observation.');
      let count = null;
      if (status === 'known') {
        assert(input.observed_episode_count !== '' && input.observed_episode_count != null, 'Enter a count, including zero if appropriate.');
        count = Number(input.observed_episode_count);
        assert(Number.isSafeInteger(count) && count >= 0, 'The observed count must be a nonnegative whole number.');
      } else assert(input.observed_episode_count === '' || input.observed_episode_count == null, 'An unknown or unobserved count cannot have a number.');
      return { local_date: date(input.local_date), timezone: timezone(input.timezone), coverage,
        count_status: status, observed_episode_count: count,
        count_precision: status === 'known' ? choice(input.count_precision, ['exact', 'estimated'], 'count precision') : null,
        details_complete: choice(input.details_complete, ['yes', 'no', 'unknown'], 'detail completeness'),
        notes: text(input.notes), provenance: provenance(input.evidence_type), observation_minutes: { value: null, unit: 'min', missing_reason: 'not_asked' } };
    }
    throw new Error('Unknown record type.');
  }
  function empty() { return { schema_version: VERSION, synthetic_only: true, animals: [], baselines: [], episodes: [], daily_reports: [] }; }
  function save(state, type, input, { id = null, animalId = null, reason = '', now = new Date().toISOString(), newId = () => globalThis.crypto.randomUUID() } = {}) {
    assert(state.synthetic_only === true && state.schema_version === VERSION, 'This prototype only accepts its own synthetic practice records.');
    assert(['animals', 'baselines', 'episodes', 'daily_reports'].includes(type), 'Unknown record type.');
    const data = normalize(type, input);
    const next = JSON.parse(JSON.stringify(state));
    const existing = id ? next[type].find(r => r.id === id) : null;
    assert(!id || existing, 'The record to correct could not be found.');
    if (type !== 'animals') {
      assert(next.animals.some(a => a.id === animalId), 'Choose an existing fictional cat.');
      assert(!existing || existing.animal_id === animalId, 'A correction cannot move a record to a different cat.');
      data.animal_id = animalId;
    }
    if (type === 'daily_reports') assert(!next.daily_reports.some(r => r.id !== id && r.animal_id === animalId && r.local_date === data.local_date), 'A check-in already exists for this cat and date. Correct that entry instead.');
    if (existing) {
      assert(text(reason, 500), 'Explain why you are correcting this entry.');
      const { revisions, ...snapshot } = existing;
      const record = { ...data, id: existing.id, schema_version: VERSION, form_version: '0.4.0-prototype',
        synthetic: true, created_at: existing.created_at, created_by: existing.created_by,
        updated_at: now, revision: existing.revision + 1,
        revisions: [...revisions, { previous: snapshot, changed_at: now, changed_by: 'practice_caregiver', reason: text(reason, 500) }] };
      next[type][next[type].findIndex(r => r.id === id)] = record;
    } else next[type].push({ ...data, id: newId(), schema_version: VERSION, form_version: '0.4.0-prototype',
      synthetic: true, created_at: now, created_by: 'practice_caregiver', updated_at: now, revision: 1, revisions: [] });
    return next;
  }
  function reconcile(state, animalId, day) {
    const report = state.daily_reports.find(r => r.animal_id === animalId && r.local_date === day);
    const details = state.episodes.filter(r => r.animal_id === animalId && r.event_local?.slice(0, 10) === day).length;
    if (!report) return { status: 'missing', details, message: 'No daily report. This is missing reporting, not zero episodes.' };
    if (report.count_status === 'not_observed' && details > 0) return { status: 'review', count: null, details, message: 'Review this day: the report says no observation coverage, but episode details exist. Neither has been changed.' };
    if (report.count_status !== 'known') return { status: report.count_status, details, message: report.count_status === 'not_observed' ? 'No observation coverage reported.' : 'Observed count is unknown.' };
    const conflict = details > report.observed_episode_count || (report.details_complete === 'yes' && details !== report.observed_episode_count);
    return { status: conflict ? 'review' : 'reported', count: report.observed_episode_count, details,
      message: conflict ? 'Review this day: the daily count and episode details disagree. Neither has been changed.' : 'Daily count and episode details overlap; they are not added together.' };
  }
  function exportJSON(state, now = new Date().toISOString()) {
    assert(state.synthetic_only === true, 'Only fictional practice data can be exported here.');
    return { export_metadata: { exported_at: now, schema_version: VERSION, purpose: 'synthetic_walkthrough', eligibility_policy_version: 'synthetic-only-v1', includes_revision_history: true, is_research_release: false }, dictionary: DICTIONARY, ...JSON.parse(JSON.stringify(state)) };
  }
  function flatten(record) {
    const row = {};
    for (const [key, value] of Object.entries(record)) {
      if (key === 'revisions') continue;
      if (value && !Array.isArray(value) && typeof value === 'object') {
        for (const [sub, v] of Object.entries(value)) row[key + '.' + sub] = v && typeof v === 'object' ? JSON.stringify(v) : v;
      } else row[key] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
    return row;
  }
  function csvCell(value) {
    let str = value == null ? '' : String(value);
    if (/^[\s]*[=+@-]/.test(str) || /^[\t\r\n]/.test(str)) str = "'" + str;
    return '"' + str.replace(/"/g, '""') + '"';
  }
  function exportCSV(state, type) {
    assert(state.synthetic_only === true, 'Only fictional practice data can be exported here.');
    assert(['animals', 'baselines', 'episodes', 'daily_reports'].includes(type), 'Unknown export type.');
    const rows = state[type].map(flatten);
    const keys = [...new Set(rows.flatMap(r => Object.keys(r)))];
    if (!keys.length) return '"id","schema_version"\r\n';
    return [keys.map(csvCell).join(','), ...rows.map(r => keys.map(k => csvCell(r[k])).join(','))].join('\r\n') + '\r\n';
  }
  function demo(today) {
    date(today);
    let state = empty(); let n = 0;
    const newId = () => 'fictional-' + (++n);
    state = save(state, 'animals', { name: 'Juniper', scenario: 'episode_observations' }, { newId });
    state = save(state, 'animals', { name: 'Miso', scenario: 'comparison', coat:'ginger', pattern:'tabby', eyes:'amber' }, { newId });
    const animalId = state.animals[0].id;
    state = save(state, 'baselines', { effective_date: today, breed: 'Domestic shorthair', sex: 'female', neuter_status: 'yes', lifestyle: 'indoor', histories: { neurological: 'unknown', skin: 'none_reported', pain_mobility: 'unknown', behavioral: 'unknown' }, notes: 'Fictional example. No diagnosis is assigned.', evidence_type: 'historical_recollection' }, { animalId, newId });
    state = save(state, 'episodes', { event_date: today, event_time: '09:15', event_time_precision: 'minute', time_basis: 'estimate', timezone: 'unknown', utc_offset: '', observed_portion: 'whole', duration_status: 'known', duration_value: 20, duration_basis: 'estimated', behaviors: { skin_rippling: 'yes', tail_chasing: 'not_observed', body_biting: 'yes', vocalization: 'no', running: 'unknown', visible_injury: 'not_answered' }, preceding_activity: 'Resting on a chair', body_location: 'Left flank', context_facts: 'Room was quiet', suspected_trigger: '', recovery_observation: 'Returned to resting', video_exists: 'no', evidence_type: 'direct_observation' }, { animalId, newId });
    state = save(state, 'daily_reports', { local_date: today, timezone: 'unknown', coverage: 'intermittent', count_status: 'known', observed_episode_count: 0, count_precision: 'exact', details_complete: 'yes', notes: 'Fictional comparison example; zero observed does not mean continuous observation.', evidence_type: 'direct_observation' }, { animalId: state.animals[1].id, newId });
    return state;
  }
  return { VERSION, RESPONSES, BEHAVIORS, HISTORY, DICTIONARY, empty, normalize, save, reconcile, exportJSON, exportCSV, demo };
});
