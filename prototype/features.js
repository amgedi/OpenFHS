(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenFHSFeatures = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const CONSENT_VERSION = 'local-video-v1';
  const CONSENT_TEXT = 'I own this practice video or have its owner’s permission. I permit OpenFHS to store it in this browser for my private diary only. This does not permit research, model training, or public sharing.';
  const MAX_BYTES = 50 * 1024 * 1024;
  const WORDS = { yes: 'Yes: observed', no: 'No: watched for and absent', unknown: 'Unknown', not_observed: 'Not observed', not_answered: 'Not answered', not_asked: 'Not asked in this version', declined: 'Prefer not to answer', whole: 'From beginning to end', part: 'Only part of the episode', reported: 'History reported', none_reported: 'None reported', direct_observation: 'Direct observation', historical_recollection: 'Remembered afterward', video: 'Watched on video', indoor: 'Indoors', outdoor: 'Outdoors', both: 'Indoors and outdoors' };
  const words = value => value == null || value === '' ? 'Not provided' : WORDS[value] || String(value).replaceAll('_', ' ');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function validateVideo(file, consent) {
    if (!file || !['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'].includes(file.type)) throw new Error('Choose an MP4, WebM, Ogg, or MOV video. Playback support depends on your browser.');
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_BYTES) throw new Error('Choose a nonempty video up to 50 MB.');
    if (consent !== true) throw new Error('Please confirm the owner’s permission for private local storage before saving.');
    return true;
  }
  function mediaRecord(file, { consent, animalId, episodeId = null, title = '', now = new Date().toISOString(), id }) {
    validateVideo(file, consent);
    if (!animalId || !id) throw new Error('A cat and video ID are required.');
    return { id, animal_id: animalId, episode_id: episodeId || null, title: String(title || file.name || 'Practice video').trim().slice(0, 120),
      file_name: file.name, media_type: file.type, size_bytes: file.size, created_at: now, synthetic: true,
      consent: { version: CONSENT_VERSION, text: CONSENT_TEXT, decision: 'granted', granted_at: now, actor: 'practice_caregiver', local_storage: true, research: false, model_training: false, public_sharing: false } };
  }
  function scope(state, animalId, media = []) {
    const result = JSON.parse(JSON.stringify(state));
    delete result.recovered_drafts;
    if (animalId) {
      result.animals = result.animals.filter(a => a.id === animalId);
      if (!result.animals.length) throw new Error('Choose an existing cat to export.');
      for (const type of ['baselines', 'episodes', 'daily_reports']) result[type] = result[type].filter(r => r.animal_id === animalId);
      if (result.privacy) {
        const videoIds = new Set(media.filter(r => r.animal_id === animalId).map(r => r.id));
        const belongs = r => r.scope === 'cat' ? r.subject_id === animalId : r.scope === 'video' && videoIds.has(r.subject_id);
        result.privacy.decisions = result.privacy.decisions.filter(belongs);
        result.privacy.history = result.privacy.history.filter(belongs);
      }
      // Archive metadata describes entire imported backups, potentially other cats.
      delete result.import_history;
    }
    return result;
  }
  function readable(state, { animalId = null, includeNotes = true, media = [], now = new Date().toISOString(), translate = value => value } = {}) {
    const t=translate;
    if (state.synthetic_only !== true) throw new Error('This prototype exports fictional practice records only.');
    const data = scope(state, animalId, media);
    const paragraphs = ['OpenFHS · Practice diary report', 'Created: ' + now, 'Fictional data only. This report does not establish a diagnosis or treatment effect.', 'Current entries only; prior revisions and technical fields are in the technical JSON export. Video files are not included.', includeNotes ? 'Optional written notes are included.' : 'Optional written notes are omitted.', 'Zero means zero observed during reported coverage. Missing days are not zeros. Daily counts and episode details overlap and must not be added together.'];
    for(let i=0;i<paragraphs.length;i++)paragraphs[i]=t(paragraphs[i]);
    const line = (label, value, translateValue = true) => paragraphs.push(t(label) + ': ' + (translateValue ? t(words(value)) : String(value ?? '')));
    const note = (label, value) => { if (includeNotes && value) line(label, value, false); };
    const source = r => { line('Source', r.provenance?.evidence_type); line('Entry version', r.revision); };
    for (const a of data.animals) {
      paragraphs.push('\n'+t('CAT')+': ' + a.name, t('Practice scenario only; no clinical status is implied.'));
      const baselines = data.baselines.filter(r => r.animal_id === a.id);
      if (!baselines.length) paragraphs.push(t('No baseline recorded.'));
      for (const b of baselines) {
        paragraphs.push('\n'+t('Baseline')+' · ' + b.effective_date);
        line('Reported breed', b.breed || 'Unknown', !b.breed); line('Sex', b.sex);
        line('Neutered / spayed', b.neuter_status === 'yes' ? 'Yes' : b.neuter_status === 'no' ? 'No' : 'Unknown'); line('Lifestyle', b.lifestyle);
        for (const [key, value] of Object.entries(b.histories)) line(words(key) + ' history', value);
        for (const field of ['diet', 'routine']) { if (!b[field]) line(field, 'not_asked'); else if (!b[field].text) line(field, b[field].missing_reason); else if (includeNotes) line(field, b[field].text, false); } note('History notes', b.notes); source(b);
      }
      const episodes = data.episodes.filter(r => r.animal_id === a.id);
      if (!episodes.length) paragraphs.push('\n'+t('No detailed episodes recorded. This does not mean no episodes occurred.'));
      for (const r of episodes) {
        paragraphs.push('\n'+t('Episode')+' · ' + (r.event_local?.replace('T', ' ') || t('Time unknown')));
        line('Time precision', r.event_time_precision === 'minute' ? 'Date and local time' : r.event_time_precision === 'date' ? 'Date only' : 'Unknown');
        line('Basis for time', r.time_basis); line('Timezone', r.timezone); line('UTC offset', r.utc_offset);
        line('Observed portion', r.observed_portion); line('Full duration', r.duration.value == null ? words(r.duration.missing_reason) : r.duration.value + ' seconds (' + r.duration.basis + ')');
        for (const [key, value] of Object.entries(r.behaviors)) if (value !== 'not_asked') line(words(key), value);
        note('Before the event', r.preceding_activity); note('Body location', r.body_location); note('Nearby context (facts)', r.context_facts);
        note('Suspected trigger (owner interpretation)', r.suspected_trigger); note('After the event', r.recovery_observation);
        line('Video reported to exist', r.video_exists === 'yes' ? 'Yes' : r.video_exists === 'no' ? 'No' : words(r.video_exists)); source(r);
      }
      const days = data.daily_reports.filter(r => r.animal_id === a.id).sort((a, b) => a.local_date.localeCompare(b.local_date));
      if (!days.length) paragraphs.push('\n'+t('No daily check-ins recorded. Reporting is missing.'));
      for (const r of days) {
        paragraphs.push('\n'+t('Daily check-in')+' · ' + r.local_date); line('Timezone', r.timezone);
        line('Coverage', r.coverage === 'none' ? 'No observation' : 'Observed at some points during the day');
        line('Episodes observed', r.count_status === 'known' ? r.observed_episode_count + ' (' + r.count_precision + ')' : words(r.count_status));
        const details = episodes.filter(e => e.event_local?.slice(0, 10) === r.local_date).length;
        if ((r.count_status === 'not_observed' && details > 0) || (r.count_status === 'known' && (details > r.observed_episode_count || (r.details_complete === 'yes' && details !== r.observed_episode_count)))) paragraphs.push(t('Review needed: the daily report and detailed episode entries disagree. Neither has been changed.'));
        line('Details entered for all observed episodes', r.details_complete === 'yes' ? 'Yes' : r.details_complete === 'no' ? 'No' : 'Unknown');
        note('Daily notes', r.notes); source(r);
      }
      const videos = media.filter(r => r.animal_id === a.id);
      paragraphs.push('\nLocal video attachments: ' + videos.length + '. Files are not included in this report.');
      for (const video of videos) if (includeNotes) paragraphs.push('• ' + video.title + ' - private local storage only; no research, training, or public-sharing permission.');
    }
    return paragraphs.join('\n');
  }
  function reportHTML(state, options={}) {
    const language=['es','fr','zh','ar','tr'].includes(options.language)?options.language:'en';
    const t=typeof options.translate==='function'?options.translate:value=>value;
    const section=(report,lang)=>'<article lang="'+lang+'" dir="'+(lang==='ar'?'rtl':'ltr')+'">'+report.split(/\n\n/).map(group=>{const [heading,...lines]=group.split('\n');return '<section><h2>'+escape(heading)+'</h2><pre>'+escape(lines.join('\n'))+'</pre></section>';}).join('')+'</article>';
    const english=readable(state,{...options,translate:value=>value});
    const local=language==='en'?'':'<h1>'+escape(t('Your OpenFHS diary'))+'</h1><p>'+escape(t('Written notes remain in their original language.'))+'</p>'+section(readable(state,{...options,translate:t}),language)+'<hr><h1>English reference</h1>';
    return '<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OpenFHS readable diary report</title><style>body{font:16px/1.65 system-ui,sans-serif;max-width:800px;margin:50px auto;padding:0 24px;color:#243d35}h1{font:32px Georgia,serif}section{border:1px solid #cbd8cf;border-inline-start:5px solid #8da78d;border-radius:10px;padding:18px 22px;margin:24px 0;background:#f7f9f5;break-inside:avoid}h2{font-size:20px;margin:0 0 12px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;border-top:1px solid #9bac80;padding-top:16px}@media print{body{margin:0;max-width:none}pre{font-size:11pt}hr{break-before:page}}</style></head><body>'+local+(language==='en'?'<h1>Your OpenFHS diary</h1>':'')+section(english,'en')+'</body></html>';
  }
  function participation(reports, animalId, today) {
    const dates = new Set(reports.filter(r => r.animal_id === animalId && r.local_date <= today).map(r => r.local_date));
    const back = day => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
    let day = dates.has(today) ? today : back(today), streak = 0;
    while (dates.has(day)) { streak++; day = back(day); }
    let lastSeven = 0; day = today;
    for (let i = 0; i < 7; i++, day = back(day)) if (dates.has(day)) lastSeven++;
    return { streak, lastSeven, todayDone: dates.has(today) };
  }
  function removeDraft(storage, key, expected, durable = true) {
    if (!durable) return false;
    if (storage.getItem(key) !== expected) throw new Error('The draft changed in another tab. The newer draft has been kept.');
    storage.removeItem(key);
    return true;
  }
  const SUPPORT_KINDS = ['Something is broken', 'I need help using the app', 'Accessibility or display', 'Translation or wording', 'Privacy or security concern', 'An idea or suggestion', 'Something else'];
  const SUPPORT_AREAS = ['Not sure', 'Overview and calendar', 'Daily check-in', 'Record an episode', 'Cat profile and avatar', 'Records and corrections', 'Exports and backups', 'Video library', 'Settings and privacy', 'Offline launcher', 'Help and support'];
  function supportEmail(value=''){
    if(typeof value!=='string'||value.length>254||/[\r\n]/.test(value))throw Error('Enter a valid reply email address.');
    const email=value.trim();if(email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email))throw Error('Enter a valid reply email address.');return email;
  }
  function supportReport(input) {
    if (!SUPPORT_KINDS.includes(input.kind) || !SUPPORT_AREAS.includes(input.area)) throw Error('Choose a report topic and app area.');
    const field = (key, max) => { const value = String(input[key] ?? '').trim(); if (value.length > max) throw Error('Please shorten your report before preparing it.'); return value; };
    const detail=field('detail',2000);
    if (!detail) throw Error('Tell us a little about what you need help with.');
    return ['OpenFHS support report', 'Reply email: '+(supportEmail(input.email)||'Not provided'), 'Topic: '+input.kind, 'App area: '+input.area, 'Specific button or step: '+(field('location',150)||'Not specified'), '', 'What happened / what I need:', detail, '', 'Device or browser (optional): '+(field('device',150)||'Not specified'), '', 'Only the text entered in this form is included. No diary records, cat names, videos, or device details were attached automatically.'].join('\n');
  }
  function draftIdentity(type,fields={}) {
    const value=type==='daily_reports'?fields.local_date:fields.event_time_precision==='unknown'?'':fields.event_date;
    return {kind:type==='daily_reports'?'Daily check-in':'Episode',date:/^\d{4}-\d{2}-\d{2}$/.test(value||'')?value:null};
  }
  return { draftIdentity, supportEmail, supportReport, SUPPORT_KINDS, SUPPORT_AREAS, removeDraft, participation, CONSENT_VERSION, CONSENT_TEXT, MAX_BYTES, words, validateVideo, mediaRecord, scope, readable, reportHTML };
});
