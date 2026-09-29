/* Local fictional-data walkthrough. No diary uploads or participant enrollment; optional Node support sends only reviewed reports. */
(async () => {
  'use strict';
  // Hold the diary lease for the page lifetime before reading or writing storage.
  // A suspended background tab retains ownership until it closes or reloads.
  if(navigator.locks){
    const acquired=await new Promise((resolve,reject)=>{
      navigator.locks.request('openfhs-diary-session',{ifAvailable:true},lock=>{
        resolve(!!lock);
        if(lock)return new Promise(()=>{});
      }).catch(reject);
    });
    if(!acquired){
      document.querySelector('main').innerHTML='<section class="card"><h1 tabindex="-1">Your diary is open in another tab</h1><p>To protect your records, use one diary tab at a time. Close the other OpenFHS tab, then reload this page. Nothing was changed here.</p></section>';
      document.querySelector('.sidebar').hidden=true;
      window.OpenFHSLanguages.apply(window.OpenFHSExperience.settings.language);document.querySelector('h1').focus();return;
    }
  }
  const A=window.OpenFHSAvatars, P=window.OpenFHSPrivacy, B=window.OpenFHSBackup, L=window.OpenFHSLanguages;
  const C = window.OpenFHS, F = window.OpenFHSFeatures, X = window.OpenFHSExperience, M = window.OpenFHSMedia, KEY = 'openfhs-fictional-practice-v1';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const localDate = (d = new Date()) => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  let today = localDate();
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  let state, storageUsable = true, page = 'overview', editing = null, dirty = false;
  let lastScreen=null, pendingBackup=null, sceneMode='auto', backupSelection=0;
  let dailyMode = 'ask', quickChoice = null;
  let episodeMode = null, mediaURLs = [], mediaPageToken = 0;
  try {
    const stored = localStorage.getItem(KEY);
    state = stored ? JSON.parse(stored) : C.demo(today);
    if (state.schema_version !== C.VERSION || state.synthetic_only !== true || !['animals', 'baselines', 'episodes', 'daily_reports'].every(k => Array.isArray(state[k]))) throw new Error('Unsupported practice data');
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    state = C.demo(today); storageUsable = false;
    $('#storage-warning').hidden = false;
    $('#storage-warning').textContent = 'Browser storage is unavailable or contains an incompatible practice file. Existing storage has not been overwritten. This session is temporary; export JSON before closing.';
  }
  let animalId = state.animals[0]?.id || '';
  function persist(next) {
    if (storageUsable) {
      try { const saved=localStorage.getItem(KEY); if(saved && saved!==JSON.stringify(state)) throw new Error('Another tab changed this diary. Export your current view, then reload before saving.'); localStorage.setItem(KEY, JSON.stringify(next)); }
      catch { throw new Error('The diary changed in another tab, or this browser could not save the entry. Your form is still open. Export existing records, then check available browser storage.'); }
    }
    state = next;
  }
  function notice(message) { $('#notice').textContent = L.translate(message,X.settings.language); $('#notice').hidden = false; }
  function animal() { return state.animals.find(a => a.id === animalId); }
  function options(items, value) {
    return items.map(item => { const [v, label] = Array.isArray(item) ? item : [item, item.replaceAll('_', ' ')]; return `<option value="${escape(v)}" ${value === v ? 'selected' : ''}>${escape(label)}</option>`; }).join('');
  }
  const responseOptions = [['not_answered', 'Not answered'], ['yes', 'Yes'], ['no', 'No'], ['unknown', 'Unknown'], ['not_observed', 'Not observed']];
  function select(name, label, items, value, attrs = '') { return `<label>${label}<select name="${name}" ${attrs}>${options(items, value)}</select></label>`; }
  function input(name, label, value = '', type = 'text', attrs = '') { if(name==='timezone'){const zones=typeof Intl.supportedValuesOf==='function'?Intl.supportedValuesOf('timeZone'):['America/Edmonton','America/Toronto','Europe/Paris','Asia/Shanghai','Africa/Johannesburg'];return '<label>'+label+'<input name="timezone" value="'+escape(value)+'" list="timezone-options" maxlength="100" autocomplete="off"><datalist id="timezone-options">'+['unknown','UTC','MDT','MST','UTC-07:00',...zones].map(z=>'<option value="'+escape(z)+'"></option>').join('')+'</datalist><small>Choose a city or type a timezone. MDT = UTC−06:00; MST = UTC−07:00. For past events, check the offset separately; no UTC time is guessed.</small></label>';} return `<label>${label}<input type="${type}" name="${name}" value="${escape(value)}" ${attrs}>${name==='utc_offset'?'<small id="utc-offset-help">You can skip this. It means how far the local clock was ahead of or behind UTC when the episode happened. For example, MDT is -06:00 and MST is -07:00. Leave it blank if unsure; the app will not guess.</small>':''}</label>`; }
  function textarea(name, label, value = '') { return `<label>${label}<textarea name="${name}" maxlength="2000">${escape(value)}</textarea></label>`; }
  function evidence(value = 'direct_observation') { return select('evidence_type', 'How do you know?', [['direct_observation', 'Direct observation'], ['historical_recollection', 'Remembered afterward'], ['video', 'Watched on video']], value); }
  function formEnd(label) {
    return `${editing ? `<div class="callout">Correcting an existing entry. The original will remain in its revision history.</div>${input('correction_reason', 'Reason for correction', '', 'text', 'required maxlength="500"')}` : ''}<p id="form-error" class="error" hidden role="alert"></p><div class="actions"><button type="submit">${editing ? 'Save correction' : label}</button><button class="secondary" type="button" data-page="overview">Cancel</button><span class="hint">${storageUsable ? 'Saved in this browser only' : 'Temporary session — export before closing'}</span></div></form></div>`;
  }
  function canLeave() { return !dirty || window.confirm('Leave this form and discard your unsaved changes?'); }
  function go(nextPage, record = null) {
    if (!canLeave()) return;
    page = nextPage; dailyMode = record ? 'full' : 'ask'; quickChoice = null; editing = record; episodeMode = record ? 'full' : (X.settings.mode === 'ask' ? null : X.settings.mode); dirty = false; $('#notice').hidden = true; render(); window.scrollTo(0, 0); $('#page-title').setAttribute('tabindex','-1'); $('#page-title').focus({preventScroll:true});
  }
  const titles = {
    privacy: ['YOUR DIARY. YOUR CHOICES.', 'Privacy, made clear.', 'No data sales. No automatic uploads. Your choices remain separate.'],
    support: ['OPENFHS', 'Care should be accessible.', 'A people-led project, with room for every cat and caregiver.'],
    help: ['A LITTLE HELP, WHEN YOU NEED IT', 'Help & support', 'Tell us what you need help with. A short explanation is enough.'],
    profile: ['A FACE OF THEIR OWN', 'Make it their diary.', 'Choose an illustrated avatar. Appearance is decorative, not research data.'],
    overview: ['A LITTLE ATTENTION, OVER TIME', 'Every observation matters.', 'A place to practice recording what you see, one day at a time.'],
    episode: ['OBSERVE FIRST. INTERPRET LATER.', 'Record an episode.', 'Describe what was visible. An entry does not establish a diagnosis.'],
    daily: ['THE QUIET DAYS MATTER, TOO', 'Your daily check-in.', 'Separate zero observed episodes from a day you could not observe.'],
    baseline: ['A LITTLE CONTEXT', 'Get to know your practice cat.', 'A short starter form. The full baseline questionnaire still needs expert review.'],
    records: ['A RECORD YOU CAN TRACE', 'Records & exports.', 'Review entries, make corrections, and download fictional practice data.'],
    guide: ['START SMALL', 'Your next steps.', 'You can help shape this project without a science or software background.'],
    videos: ['PRIVATE, ON THIS DEVICE', 'Your video library.', 'Attach a practice clip with its owner’s permission. Nothing is uploaded.'],
    settings: ['MAKE YOURSELF AT HOME', 'Your preferences.', 'Choose a calmer experience and the kind of export you need.']
  };
  function render() {
    if(lastScreen!==page)pendingBackup=null;
    today = localDate();
    mediaPageToken++;
    mediaURLs.forEach(url => URL.revokeObjectURL(url)); mediaURLs = [];
    $('.sidebar').classList.remove('menu-open'); $('#mobile-menu').setAttribute('aria-expanded', 'false');
    $('#sidebar-cat').innerHTML=avatar(animal()?.avatar)+'<div><small>Current cat</small><strong>'+escape(animal()?.name)+'</strong></div>'; $('#selected-avatar').innerHTML=avatar(animal()?.avatar);
    const t = titles[page]; $('#page-eyebrow').textContent = t[0]; $('#page-title').textContent = t[1]; $('#page-description').textContent = t[2];
    $('#active-cat').innerHTML = state.animals.map(a => `<option value="${escape(a.id)}" ${animalId === a.id ? 'selected' : ''}>${escape(a.name)}</option>`).join('');
    document.querySelectorAll('.nav-button').forEach(b => { b.classList.toggle('active', b.dataset.page === page); if (b.dataset.page === page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('#page').innerHTML = ({ overview, profile, privacy: privacyPage, support, help: helpPage, episode: episodeForm, daily: dailyForm, baseline: baselineForm, records, guide, videos, settings: settingsPage })[page]();
    bindPage();
    $('#page').classList.remove('page-enter'); if(lastScreen!==page){void $('#page').offsetWidth;$('#page').classList.add('page-enter');} lastScreen=page;
    if(window.matchMedia('(max-width:850px)').matches)document.querySelector('.scene-disclosure')?.removeAttribute('open');
    $('#today-label').textContent=L.date(today,X.settings.language);
    L.apply(X.settings.language);
  }
  function overview() {
    const a = animal(); if (!a) return '<div class="card">Add a fictional cat to begin.</div>';
    const episodes = state.episodes.filter(r => r.animal_id === animalId), reports = state.daily_reports.filter(r => r.animal_id === animalId);
    const latestBaseline = state.baselines.filter(r => r.animal_id === animalId).at(-1);
    const participation = F.participation(reports, animalId, today);
    let pending=[];try{pending=collectDrafts().filter(d=>d.animal_id===animalId);}catch{}
    const draftLinks=pending.length?'<div class="callout draft-status card"><strong>Ready whenever you are</strong><p>Your unfinished entries are saved.</p>'+pending.map(d=>'<button class="secondary" data-draft-type="'+d.type+'" data-draft-record="'+escape(d.record_id||'')+'">Continue '+(d.type==='episodes'?'episode':'check-in')+(d.record_id?' correction':'')+'</button>').join(' ')+'</div>':'';
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); const day = localDate(d); const r = C.reconcile(state, animalId, day); const label = r.status === 'missing' ? 'No report' : r.status === 'not_observed' ? 'Not observed' : r.status === 'unknown' ? 'Count unknown' : `${r.count === null ? 'Coverage conflict' : r.count + ' observed'}${r.status === 'review' ? ' · review' : ''}`; return `<div class="day-row"><span>${i === 0 ? 'Today' : escape(L.date(day,X.settings.language,{month:'short',day:'numeric'}))}</span><span role="progressbar" aria-label="${escape(day)} check-in for ${escape(a.name)}" aria-valuemin="0" aria-valuemax="1" aria-valuenow="${reports.some(report=>report.local_date===day)?1:0}" class="calendar-fill ${reports.some(report=>report.local_date===day)?'complete':''} badge ${r.status === 'review' ? 'warning' : ''}">${label}</span><small>${r.details} episode ${r.details === 1 ? 'entry' : 'entries'}</small></div>`; }).join('');
    return `${draftLinks}<div class="overview-top card"><div class="today-card"><div class="section-top"><div><p class="eyebrow">WHAT TO DO TODAY</p><h2><span>Hi</span>, <span data-user-content>${escape(a.name)}</span>.</h2></div></div><p>${participation.todayDone ? 'Your check-in is saved. Thank you for recording honestly.' : 'A small check-in is enough. Uncertainty is a useful answer, too.'}</p><div class="actions"><button data-page="daily">${participation.todayDone ? 'Review today’s check-in' : 'Start a quick check-in'}</button><button class="secondary" data-page="episode">Record an episode</button></div><details class="optional-tasks" open><summary>A little extra, only if you have the energy</summary><p class="hint">You have done enough just by checking in. These are here whenever they help; nothing is required.</p><p><button class="text-button" data-page="baseline">${latestBaseline ? 'Review your cat’s starting information' : 'Add your cat’s starting information'}</button></p><p><button class="text-button" data-page="videos">Explore private videos & the sample clip</button></p><p><button class="text-button" data-page="records">Download a copy of your records</button></p></details></div>${catScene()}</div><div class="metrics overview-metrics"><div class="metric"><span>Check-in streak</span><strong><span class="streak-flame flame-${participation.streak>=30?'violet':participation.streak>=7?'gold':participation.streak>=3?'orange':'white'}" aria-hidden="true">🔥</span> ${participation.streak} ${participation.streak === 1 ? 'day' : 'days'}</strong><span>Honest check-ins count. Taking a break is okay.</span></div><div class="metric"><span>Past 7 days</span><strong>${participation.lastSeven} / 7</strong><span>Days with a check-in; includes days not observed</span></div><div class="metric"><span>Detailed episode entries</span><strong>${episodes.length}</strong><span>All time. Not a measure of health or frequency.</span></div></div><div class="card"><div class="section-top"><h2>Your observation calendar</h2><span class="badge">Past 7 days</span></div><p class="hint">Each bar shows this cat’s check-in for that day: full when submitted, empty when missing. Optional details do not affect completion.</p><div class="day-list">${days}</div><p class="hint">Missing reports stay missing. Daily counts overlap detailed entries, so we never add them together. A streak measures participation, not your cat’s health.</p></div>`;
  }
  let companionIndex;try{companionIndex=Number(sessionStorage.getItem('openfhs-companion-seed'));if(!sessionStorage.getItem('openfhs-companion-seed')||!Number.isSafeInteger(companionIndex)||companionIndex<0){companionIndex=Math.floor(Math.random()*1000);sessionStorage.setItem('openfhs-companion-seed',String(companionIndex));}}catch{companionIndex=Math.floor(Math.random()*1000);}
  function companionLandscape(){
    const theme=X.settings.theme;
    if(theme==='arcade')return '<g class="companion-landscape pixel-arcade" aria-hidden="true"><rect width="320" height="240" fill="#140c28"/><path d="M0 140h35v-30h40v30h35v-65h50v65h35v-40h35v40h40v-65h50v165H0Z" fill="#6236a0"/><path d="M0 192h320v48H0Z" fill="#d63845"/><path d="M0 192h320M0 218h320M35 192v48m50-48v48m50-48v48m50-48v48m50-48v48m50-48v48" stroke="#ffbc38" stroke-width="3"/><path d="M52 32h12v12H52zm108 12h6v6h-6zm114-16h8v8h-8z" fill="#ffe76b"/></g>';
    const sky='<rect width="320" height="240" class="scene-sky"/><circle class="scene-sun" cx="64" cy="48" r="23"/>';
    const hills='<path class="scene-far" d="M0 136Q80 67 180 130T320 108V240H0Z"/><path class="scene-ground" d="M0 184Q95 142 190 179T320 159V240H0Z"/>';
    const tree='<g class="scene-tree"><path d="M261 190L250 83M256 135L225 105" stroke="currentColor" stroke-width="8" fill="none"/><circle cx="245" cy="71" r="33"/><circle cx="219" cy="98" r="24"/><circle cx="273" cy="94" r="27"/></g>';
    const stars='<g class="scene-stars" fill="#e6eac8"><circle cx="110" cy="29" r="1.5"/><circle cx="203" cy="48" r="2"/><circle cx="284" cy="28" r="1.5"/><circle cx="168" cy="77" r="1"/></g>';
    let detail=tree;
    if(theme==='ocean')detail='<path class="scene-wave" d="M0 127Q40 115 80 127T160 127T240 127T320 127M0 143Q40 131 80 143T160 143T240 143T320 143" fill="none" stroke="#e4f4ef" stroke-width="3"/><path d="M252 62q9-10 18 0q9-10 18 0" fill="none" stroke="#527c84" stroke-width="2"/>';
    if(theme==='sand')detail='<path d="M261 176V96m0 38h-17v-24m17 39h17v-28" stroke="#829671" stroke-width="10" fill="none" stroke-linecap="round"/>';
    if(theme==='lavender'||theme==='rose')detail=(theme==='rose'?'<path d="M208 186V67h84v119M218 186V80h64v106M208 110h84M208 140h84" fill="none" stroke="#a28a78" stroke-width="4"/><path d="M215 182Q260 143 220 106T275 74" stroke="#68885c" stroke-width="7" fill="none"/><g fill="#cb7591"><circle cx="224" cy="112" r="10"/><circle cx="254" cy="155" r="9"/><circle cx="273" cy="75" r="10"/></g>':tree)+'<g class="scene-blooms" fill="'+(theme==='rose'?'#c981a1':'#a38ac4')+'"><circle cx="28" cy="192" r="6"/><circle cx="294" cy="184" r="6"/><circle cx="305" cy="202" r="5"/><circle cx="40" cy="208" r="4"/></g>';
    if(theme==='pixel')detail='<path fill="#71956a" d="M226 95h-20V65h20V45h50v20h20v30h-20v20h-50Z"/><path fill="#9c8861" d="M245 115h12v69h-12Z"/>';
    return '<g class="companion-landscape" aria-hidden="true">'+sky+hills+detail+(['dark','midnight'].includes(theme)?stars:'<g class="scene-flying-birds" fill="none" stroke="#527c84" stroke-width="2"><path d="M10 50q6-7 12 0q6-7 12 0M42 36q5-6 10 0q5-6 10 0"/></g>')+'</g>';
  }
  function catScene(){
    sceneMode=X.settings.companion||'auto';
    const v=A.normalize(animal()?.avatar||{}),hour=new Date().getHours(),mode=sceneMode==='auto'?(hour>=20||hour<7?['rest','groom','stretch']:['play','groom','stretch','peek','pounce'])[companionIndex%(hour>=20||hour<7?3:5)]:sceneMode;
    const head=(['pixel','arcade'].includes(X.settings.theme)?A.pixel(v).replace(/<rect class="avatar-backdrop"[^>]*>/,''):A.svg(v)).replace(/class="profile-avatar(?: pixel-avatar)?"/,'x="70" y="42" width="120" height="120"').replace(/<circle cx="60" cy="60" r="59"[^>]*\/>/,'');
    return `<aside class="cat-scene-card"><div class="scene-disclosure"><p class="eyebrow">A QUIET LITTLE COMPANION</p><div id="cat-scene" role="button" tabindex="0" aria-label="Cat companion: activate three times to open a scenic view" class="cat-scene ${mode}"><svg viewBox="0 0 320 240" role="img" aria-label="Decorative illustrated cat; not a health observation">${companionLandscape()}<ellipse cx="161" cy="212" rx="119" ry="12" fill="#dce5d0"/><path class="scene-tail" d="${['pixel','arcade'].includes(X.settings.theme)?'M220 182H260V160H278V121':'M220 182Q290 170 273 121'}" stroke="${A.coats[v.coat]}" stroke-width="20" fill="none" stroke-linecap="round"/>${['pixel','arcade'].includes(X.settings.theme)?`<path d="M112 158h20v-14h76v14h26v38h-20v16h-82v-16h-20Z" fill="${A.coats[v.coat]}"/>`:`<ellipse cx="171" cy="176" rx="71" ry="35" fill="${A.coats[v.coat]}"/>`}<g class="scene-body"><g class="scene-head">${head}</g><path class="scene-paw" d="${['pixel','arcade'].includes(X.settings.theme)?'M152 180V194H118':'M152 180L118 199'}" stroke="${A.coats[v.coat]}" stroke-width="23" stroke-linecap="round"/>${['pixel','arcade'].includes(X.settings.theme)?`<rect x="168" y="194" width="45" height="18" fill="${A.coats[v.coat]}"/>`:`<ellipse cx="190" cy="202" rx="25" ry="10" fill="${A.coats[v.coat]}"/>`}<g class="scene-toy"><circle cx="72" cy="202" r="12" fill="#c9a0aa"/><path d="M65 194Q82 201 67 211" stroke="#f8eddf" fill="none" stroke-width="2"/></g></g><path class="scene-box" d="M70 175h160v55H70z M70 175l-17-17h63l12 17m102 0 17-17h-62l-14 17" fill="#c4a67f" stroke="#8b7155" stroke-width="2"/><text class="scene-zzz" x="212" y="95" fill="#809786" font-size="24">z z</text></svg></div><p class="hint">A decorative companion. Choose its scene in Settings.</p><p class="motion-note hint">Motion is paused by your device or app preference. Choose Gentle animations in Settings to animate.</p></div></aside>`;
  }
  function avatar(value={}) { return ['pixel','arcade'].includes(X.settings.theme)?A.pixel(value):A.svg(value); }
  function profile() {
    const v=A.normalize(animal()?.avatar||{}), names=keys=>keys.map(k=>[k,k==='bluegrey'?'Blue-grey':k.charAt(0).toUpperCase()+k.slice(1)]);
    return `<div class="card form-card"><div id="avatar-preview">${avatar(v)}</div><form id="avatar-form"><h2>Start with a look you love.</h2><div class="avatar-presets">${Object.keys(A.presets).map(k=>'<button type="button" class="secondary" data-preset="'+k+'">'+avatar(A.presets[k])+'<span>'+escape(k==='tortie'?'Tortoiseshell':k.charAt(0).toUpperCase()+k.slice(1))+'</span></button>').join('')}</div><details><summary>Make it uniquely yours</summary><p class="hint">Decorative choices only, not a breed or health assessment. Eye colour changes the iris; pupil colour is a separate artistic choice.</p><div class="form-grid">${select('fur','Coat length',[['short','Shorthair'],['long','Longhair'],['hairless','Hairless']],v.fur)}${select('pattern','Coat pattern',names(A.patterns),v.pattern)}${select('coat','Coat colour',names(Object.keys(A.coats)),v.coat)}${select('eyes','Left eye colour',names(Object.keys(A.eyes)),v.eyes)}${select('rightEye','Right eye colour',names(Object.keys(A.eyes)),v.rightEye)}${select('pupil','Pupil colour',names(Object.keys(A.pupils)),v.pupil)}</div></details><p id="avatar-error" class="error" hidden role="alert"></p><button type="submit">Save avatar</button></form></div>`;
  }

  function episodeForm() {
    if (!episodeMode) return `<div class="mode-intro"><h2>How would you like to record?</h2><p class="muted">The same questions, at your pace. You can switch without losing your answers.</p><div class="mode-choices"><button class="mode-card" data-mode="guided"><span class="mode-symbol">1 → 2 → 3</span><strong>Guide me</strong><span>One question at a time, with room to focus.</span><small>A gentle place to start →</small></button><button class="mode-card" data-mode="full"><span class="mode-symbol">☷</span><strong>Show the full form</strong><span>Everything together, just as before.</span><small>For when you know your way →</small></button></div><p class="hint">Set a default later in Settings. Uncertain or unanswered observations remain distinct.</p></div>`;
    const r = editing || {};
    return `<div class="card form-card">${editing?'<div class="callout"><strong>Correcting a saved entry</strong><p>1. Change the answer that was mistaken. 2. Explain what changed in “Reason for correction” below. 3. Save your correction. The original stays in the history.</p></div>':''}<form id="entry-form" data-type="episodes"><fieldset><legend>When and how much did you see?</legend><div class="form-grid">${select('event_time_precision', 'How precisely do you know when it happened?', [['minute', 'Date and local time'], ['date', 'Date only'], ['unknown', 'Unknown']], r.event_time_precision || 'minute')}${select('time_basis', 'Basis for the time', [['clock', 'Clock'], ['estimate', 'Estimate'], ['recollection', 'Recollection'], ['video', 'Video']], r.time_basis || 'estimate')}${input('event_date', 'Episode date', r.event_local?.slice(0, 10) || today, 'date')}${input('event_time', 'Local time', r.event_local?.slice(11, 16) || '', 'time')}${input('timezone', 'Timezone (use unknown if unsure)', r.timezone || zone)}${input('utc_offset', 'Time difference from UTC (optional)', r.utc_offset === 'unknown' ? '' : r.utc_offset || '', 'text', 'placeholder="Leave blank if unsure" aria-describedby="utc-offset-help"')}${select('observed_portion', 'How much of the episode did you observe?', [['unknown', 'Unknown'], ['whole', 'From beginning to end'], ['part', 'Only part of it']], r.observed_portion || 'unknown')}${evidence(r.provenance?.evidence_type)}${select('duration_status', 'Full episode duration', [['unknown', 'Unknown'], ['not_observed', 'Not observed in full'], ['known', 'I can give a duration'], ['declined', 'Prefer not to answer']], r.duration ? (r.duration.missing_reason || 'known') : 'unknown')}${input('duration_value', 'Duration in seconds', r.duration?.value ?? '', 'number', 'min="0" step="any"')}${select('duration_basis', 'How was duration determined?', [['estimated', 'Estimated'], ['timed', 'Timed'], ['video', 'From video']], r.duration?.basis || 'estimated')}</div><p class="hint">Timezone defaults to this device. Check it for past events. Unknown offsets remain unknown; no UTC time is guessed. A partial observation cannot establish the full duration.</p></fieldset><fieldset><legend>What was visible?</legend><div class="callout"><strong>No</strong> means you watched for it and it did not happen in the observed portion. <strong>Unknown</strong> means you cannot tell. <strong>Not observed</strong> means you did not watch the relevant part. Leave a question unanswered if you skip it.</div>${Object.entries(C.BEHAVIORS).map(([k, label]) => `<div class="behavior-row"><label for="behavior-${k}">${label}</label><select id="behavior-${k}" name="behavior_${k}">${options(responseOptions, r.behaviors?.[k] || 'not_answered')}</select></div>`).join('')}</fieldset><fieldset><legend>A little context</legend><div class="form-grid">${textarea('preceding_activity', 'What was the cat doing beforehand?', r.preceding_activity)}${input('body_location', 'Body location, if known', r.body_location || '', 'text', 'maxlength="200"')}${textarea('context_facts', 'What was happening nearby? (facts)', r.context_facts)}${textarea('suspected_trigger', 'Any suspected trigger? (your interpretation)', r.suspected_trigger)}${textarea('recovery_observation', 'What did the cat do afterward?', r.recovery_observation)}${select('video_exists', 'Does a video exist?', responseOptions, r.video_exists || 'not_answered')}</div><p class="hint">No video is uploaded. Do not provoke an episode or delay care to make a recording.</p></fieldset>${formEnd('Save fictional episode')}`;
  }
  function dailyForm() {
    if (dailyMode === 'full' || dailyMode === 'guided' || editing) return detailedDailyForm();
    const existing = state.daily_reports.find(r => r.animal_id === animalId && r.local_date === today);
    if (existing) return `<div class="card"><h2>Today’s check-in is already saved.</h2><p>${existing.count_status === 'known' ? escape(existing.observed_episode_count) + ' episodes observed during your coverage.' : existing.count_status === 'not_observed' ? 'You could not observe today. That is a valid check-in.' : 'You observed at some points, but the count was uncertain.'}</p><div class="actions"><button data-edit="${escape(existing.id)}" data-type="daily_reports">Review or correct today</button><button class="secondary" id="daily-full">Record another date</button></div></div>`;
    if(dailyMode === 'ask') return `<div class="card"><h2>How would you like to check in?</h2><p>The same questions, at your pace. Drafts stay in this browser until you submit or discard them.</p><div class="mode-choices"><button data-daily-mode="guided">Guide me, one question at a time</button><button class="secondary" data-daily-mode="full">Show the full form</button></div></div>`;
    return `<div class="card quick-check"><p class="eyebrow">A MOMENT FOR TODAY · ${today}</p><h2>What feels closest to your day?</h2><p class="muted">These choices describe your observations, not everything that happened.</p><div class="quick-choices">${[['zero','I watched at times and saw no episodes'],['known','I watched at times and saw episodes'],['unknown','I watched at times, but I’m unsure of the count'],['none','I couldn’t observe today']].map(([key,label]) => '<button class="secondary" data-quick="' + key + '" aria-pressed="' + (quickChoice === key) + '">' + label + '</button>').join('')}</div><form id="quick-form" ${quickChoice ? '' : 'hidden'}><div id="quick-count" ${quickChoice === 'known' ? '' : 'hidden'}>${input('count','How many episodes did you observe?','','number','min="1" step="1"')}${select('precision','Is that count exact or estimated?',[['exact','Exact'],['estimated','Estimated']],'exact')}</div><p id="quick-summary" class="callout">${quickChoice === 'none' ? 'Review: no observation coverage; no episode count will be inferred.' : quickChoice === 'unknown' ? 'Review: intermittent observation; episode count unknown.' : quickChoice === 'zero' ? 'Review: intermittent observation; zero episodes observed during that time.' : 'Review your count above. Coverage will be recorded as intermittent.'} Date: ${today}. Timezone: ${escape(zone)}. Episode-detail completeness is unknown.</p><p id="quick-error" class="error" hidden role="alert"></p><button type="submit">Save today’s check-in</button></form><button class="text-button" id="daily-full">Use the full form / choose another date →</button></div>`;
  }
  function detailedDailyForm() {
    const r = editing || {};
    return `<div class="card form-card"><form id="entry-form" data-type="daily_reports"><fieldset><legend>A day in context</legend><div class="form-grid">${input('local_date', 'Report date', r.local_date || today, 'date', 'required')}${input('timezone', 'Timezone (use unknown if unsure)', r.timezone || zone)}${select('coverage', 'How much did you observe the cat?', [['intermittent', 'At some points during the day'], ['none', 'I did not observe the cat']], r.coverage || 'intermittent')}${select('count_status', 'Can you report an observed episode count?', [['unknown', 'Unknown'], ['known', 'Yes, including zero'], ['not_observed', 'Not observed']], r.count_status || 'unknown')}${input('observed_episode_count', 'Episodes you observed', r.observed_episode_count ?? '', 'number', 'min="0" step="1"')}${select('count_precision', 'Is the count exact or estimated?', [['exact', 'Exact'], ['estimated', 'Estimated']], r.count_precision || 'exact')}${select('details_complete', 'Have you entered details for every observed episode?', [['unknown', 'Unknown'], ['yes', 'Yes'], ['no', 'No']], r.details_complete || 'unknown')}${evidence(r.provenance?.evidence_type)}</div></fieldset><div class="callout">A zero means <strong>you observed zero episodes during your coverage</strong>. It does not mean nothing happened while you were away. This starter form supports intermittent or no observation; timed continuous observation is deferred.</div>${textarea('notes', 'Optional context (fictional details only)', r.notes)}${formEnd('Save daily check-in')}`;
  }
  function baselineForm() {
    if (!editing) {
      const previous = state.baselines.filter(r => r.animal_id === animalId).at(-1);
      if (previous) return `<div class="card form-card"><span class="badge">Baseline recorded</span><h2>A starting point for ${escape(animal()?.name)}.</h2><p>A baseline means your cat’s starting information and everyday context on a particular date. It is not a diagnosis or health score.</p><p class="muted">Effective ${escape(previous.effective_date)} · revision ${previous.revision}. Correct a mistake, or add a new snapshot when the fictional history changes.</p><div class="actions"><button data-edit="${escape(previous.id)}" data-type="baselines">Correct this baseline</button> <button class="secondary" id="new-baseline">Add a new snapshot</button></div><details><summary>See recorded answers</summary><pre>${escape(JSON.stringify(previous, null, 2))}</pre></details></div>`;
    }
    return baselineFields(editing || {});
  }
  function baselineFields(r) {
    return `<div class="card form-card"><form id="entry-form" data-type="baselines"><div class="callout"><strong>What is a baseline?</strong> Your cat’s starting information: what everyday life and history looked like on a particular date. It is not a diagnosis, a score, or a requirement to start recording. Add a new snapshot when things change.</div><fieldset><legend>Basic context</legend><div class="form-grid">${input('effective_date', 'Date this information describes', r.effective_date || today, 'date', 'required')}${input('breed', 'Reported breed (blank means unknown)', r.breed || '', 'text', 'maxlength="100"')}${select('sex', 'Sex', [['unknown', 'Unknown'], ['female', 'Female'], ['male', 'Male'], ['other', 'Other']], r.sex || 'unknown')}${select('neuter_status', 'Neutered / spayed?', [['unknown', 'Unknown'], ['yes', 'Yes'], ['no', 'No']], r.neuter_status || 'unknown')}${select('lifestyle', 'Lifestyle', [['unknown', 'Unknown'], ['indoor', 'Indoors'], ['outdoor', 'Outdoors'], ['both', 'Both']], r.lifestyle || 'unknown')}${evidence(r.provenance?.evidence_type || 'historical_recollection')}</div></fieldset><fieldset><legend>Reported history</legend><p class="hint">“None reported” is different from “unknown,” and does not establish that the cat is healthy. These are owner reports, not verified clinical findings.</p><div class="form-grid">${Object.entries(C.HISTORY).map(([k, label]) => select('history_' + k, label, [['not_answered', 'Not answered'], ['reported', 'History reported'], ['none_reported', 'None reported'], ['unknown', 'Unknown']], r.histories?.[k] || 'not_answered')).join('')}</div></fieldset><details><summary>Optional: diet & daily routine</summary><p class="hint">Describe the usual food, meal times, play, rest, or recent changes if useful. Leave blank to skip. This does not establish a cause or recommend a change.</p>${textarea('diet', 'Usual diet (optional)', r.diet?.text)}${textarea('routine', 'Usual routine (optional)', r.routine?.text)}</details>${textarea('notes', 'Optional history notes (fictional details only)', r.notes)}<p class="hint">Age, weight, medication, and detailed workups are deferred, not assumed absent. The export marks these as not asked.</p>${formEnd('Save fictional baseline')}`;
  }
  function records() {
    const list = [['episodes', 'Episode'], ['daily_reports', 'Daily report'], ['baselines', 'Baseline']].flatMap(([type, label]) => state[type].filter(r => r.animal_id === animalId).map(r => ({ type, label, r }))).sort((a, b) => b.r.created_at.localeCompare(a.r.created_at));
    return `<div class="card"><p class="eyebrow">TAKE YOUR PRACTICE DATA WITH YOU</p><h2>Download an inspectable copy.</h2><p class="muted">Choose a readable report for everyday use, or technical data for detailed analysis. ${X.settings.exportScope === 'selected' ? 'Only the selected cat is included.' : 'All practice cats are included.'} Change the scope in Settings. Video files are not included.</p><div class="export-buttons"><button data-export="readable">Readable report</button><button class="secondary" data-export="json">Technical data (JSON)</button></div><details class="export-details"><summary>Spreadsheet tables (CSV)</summary><div class="export-buttons">${[['animals', 'Cats CSV'], ['baselines', 'Baselines CSV'], ['episodes', 'Episodes CSV'], ['daily_reports', 'Daily reports CSV']].map(([key, label]) => `<button class="secondary" data-export="${key}">${label}</button>`).join('')}</div></details><button class="text-button" data-page="settings">Export preferences →</button></div><div class="card"><div class="section-top"><h2><span data-user-content>${escape(animal()?.name)}</span> · <span>Records</span></h2><span class="badge">${list.length} records</span></div><div class="record-filters"><label>Entry type<select id="record-kind"><option value="all">All entries</option><option value="episodes">Episodes</option><option value="daily_reports">Daily check-ins</option><option value="baselines">Starting information</option></select></label><label>Date<input id="record-date" type="date"></label><button class="secondary" id="clear-record-filters">Clear filters</button></div><p class="hint">Filters change this list only. Exports follow your Settings preferences.</p><p id="record-filter-status" role="status"></p>${list.length ? list.map(({ type, label, r }) => {
      const when = r.event_local || r.local_date || r.effective_date || 'Time unknown';
      const description = type === 'episodes' ? `${r.duration.value === null ? 'Duration: ' + r.duration.missing_reason.replaceAll('_', ' ') : r.duration.value + ' seconds (' + r.duration.basis + ')'} · ${r.observed_portion === 'whole' ? 'Whole episode observed' : 'Partial / unknown observation'}` : type === 'daily_reports' ? (r.count_status === 'known' ? `${r.observed_episode_count} observed · ${r.count_precision}` : r.count_status.replaceAll('_', ' ')) : 'Owner-reported history';
      const check = type === 'daily_reports' ? C.reconcile(state, animalId, r.local_date) : null;
      return `<article class="record" data-record-kind="${type}" data-record-day="${escape(when.slice(0,10))}"><div class="record-header"><div><span class="badge">${label}</span><h3>${escape(/^\d{4}-\d{2}-\d{2}/.test(when)?L.date(when.slice(0,10),X.settings.language)+(when.length>10?' · '+when.slice(11):''):L.translate(when,X.settings.language))}</h3><p>${escape(description)} · revision ${r.revision}</p></div><button class="text-button" data-edit="${escape(r.id)}" data-type="${type}">Edit / correct this entry →</button></div>${check?.status === 'review' ? `<div class="callout">${escape(check.message)}</div>` : ''}${r.revisions.length?'<details class="correction-history"><summary>Correction history · '+r.revisions.length+'</summary><ol>'+r.revisions.map(change=>'<li><strong>'+escape(change.changed_at)+'</strong><p>'+escape(change.reason)+'</p><small>Previous version: '+escape(change.previous?.revision)+'</small></li>').join('')+'</ol><p class="hint">Complete prior answers are preserved in Technical details below.</p></details>':''}<details><summary>Technical details${r.revisions.length ? ' and ' + r.revisions.length + ' prior revision(s)' : ''}</summary><pre>${escape(JSON.stringify(r, null, 2))}</pre></details></article>`;
    }).join('') : '<p class="empty">No records yet. Start with a fictional episode or daily check-in.</p>'}</div>`;
  }
  function guide() {
    const done=F.participation(state.daily_reports,animalId,today).todayDone;
    let drafts=[];try{drafts=collectDrafts().filter(d=>d.animal_id===animalId);}catch{}
    const baseline=state.baselines.some(r=>r.animal_id===animalId);
    return `<div class="card"><p class="eyebrow">TODAY, AT YOUR PACE</p><h2>${escape(animal()?.name)} · ${escape(today)}</h2><p>${done?'Today’s check-in is complete. You have done enough.':'A short check-in is your next step. Unknown and not observed are useful answers.'}</p><div class="actions"><button data-page="daily">${done?'Review today’s check-in':'Start a quick check-in'}</button></div>${drafts.length?'<section class="resume-drafts" aria-label="Unfinished entries"><h3>Pick up where you left off</h3>'+drafts.map(d=>`<p><button class="secondary" data-draft-type="${escape(d.type)}" data-draft-record="${escape(d.record_id||'')}">${d.type==='episodes'?'Continue episode draft':'Continue check-in draft'}</button></p>`).join('')+'</section>':''}</div><div class="card"><h2>Optional, whenever it helps</h2><p>No extra task is needed to complete your day. There is no penalty for taking a break.</p><div class="actions"><button class="secondary" data-page="baseline">${baseline?'Review starting information':'Add starting information'}</button><button class="secondary" data-page="records">Read or export records</button><button class="secondary" data-page="help">Share feedback</button></div><p class="hint">Suggestions use saved records for the selected cat. They are not health recommendations, and they do not imply that an episode happened.</p></div>`;
  }
  function settingsPage() {
    const s = X.settings;
    return `<div class="card form-card"><form id="settings-form"><fieldset><legend>Make recording feel right</legend><div class="form-grid">${select('mode', 'When I record an episode', [['ask', 'Let me choose each time'], ['guided', 'Start one question at a time'], ['full', 'Start with the full form']], s.mode)}${select('motion', 'Animations', [['system', 'Follow my device preference'], ['gentle', 'Gentle animations (override device preference)'], ['reduced', 'Keep things still']], s.motion)}${select('theme', 'Appearance', [['light', 'Soft light'], ['dark', 'Evening dark'], ['ocean','Ocean'], ['lavender','Lavender'], ['sand','Warm sand'],['rose','Rose garden'],['midnight','Midnight blue'],['park','Breezy park'],['pixel','Pixel meadow (8-bit)'],['arcade','Pixel arcade (8-bit)']], s.theme)}${select('panelStyle','Panel style',[['normal','Normal'],['translucent','Translucent'],['glass','Frosted glass']],s.panelStyle)}${select('companion','Cat companion',[['auto','Match the time of day'],['play','Playing'],['groom','Grooming'],['stretch','A big stretch'],['peek','Hide-and-seek'],['pounce','Toy pounce'],['rest','Resting'],['still','Still illustration']],s.companion)}${select('celebrations','Check-in milestones',[['yes','Gentle celebrations'],['no','No celebrations']],s.celebrations?'yes':'no')}${select('language','Language preview',[['en','English'],['es','Español — preview'],['fr','Français — aperçu'],['zh','普通话 / 简体中文 — 预览'],['ar','العربية — معاينة'],['tr','Türkçe — önizleme']],s.language)}${select('intro', 'Cat welcome screen', [['yes', 'Show once each session'], ['no', 'Skip it']], s.intro ? 'yes' : 'no')}</div></fieldset><fieldset><legend>Export preferences</legend><div class="form-grid">${select('exportScope', 'Include these cats', [['selected', 'Only the cat I am viewing'], ['all', 'All my practice cats']], s.exportScope)}${select('reportNotes', 'Written notes in readable reports', [['yes', 'Include my written notes'], ['no', 'Leave out my written notes']], s.reportNotes ? 'yes' : 'no')}</div><p class="hint">Readable reports show current entries in plain language. Technical JSON keeps the complete selected records and correction history, including written notes. Neither includes video files. Use Complete local backup below to include them.</p></fieldset><p class="error" id="settings-error" hidden role="alert"></p><div class="actions"><button type="submit">Save preferences</button><button type="button" class="secondary" id="replay-intro">Replay cat welcome</button><button type="button" class="secondary" id="replay-tutorial">Show the quick tutorial</button></div></form></div><details class="card"><summary>Offline use & future AI research</summary><p class="muted">This diary works without internet while its local launcher is running. A Windows offline launcher is available in the project dist folder. It uses a separate browser address and does not import entries from this preview. There is no AI training feature or training dataset yet.</p><p class="muted">Future research datasets will need their own permissions, review, and versioned releases. Your private videos do not become training data. There is no automatic upload or update in this version.</p></details>${privacyPanel()}${backupPanel()}`;
  }
  function permissionChoices(scope,id) {
    const choices=P.current(state,scope,id),labels={research:'Research',training:'Model training',public:'Public sharing'},descriptions={research:'Allow future reviewed studies to consider these observations. This does not allow model training or public posting.',training:'Allow future approved datasets to be considered for training AI models. This is separate from research and public posting.',public:'Allow consideration for future public examples. You can choose optional credit below. Nothing is published by this prototype.'};
    return P.PURPOSES.map(key=>`<label class="consent-check"><input type="checkbox" name="${key}" ${choices[key]?'checked':''}><span><strong>${labels[key]}</strong><small class="permission-explanation">${descriptions[key]}</small></span></label>`).join('');
  }
  function privacyPanel() {
    return `<div class="card"><h2>Your privacy choices</h2><p>We will never sell your data. Research, model training and public sharing are independent and optional. None is required to use the diary.</p><p class="callout">Local prototype: these are future-use preferences, not research enrollment or permission to upload. Nothing leaves this device. Cloud accounts and actual study consent come after local v1.</p><p class="muted">Cat choices cover the current and future diary records for that cat. A video needs its own matching choice too. Revoking a cat choice removes its videos from that category immediately; it does not erase their individual saved choices. Re-enabling a cat can therefore re-enable videos with a matching choice. These settings cannot recall copies you manually shared outside this app.</p><form id="cat-privacy-form"><h3><span data-user-content>${escape(animal()?.name)}</span>: <span>Diary records</span></h3>${permissionChoices('cat',animalId)}<button type="submit">Save cat privacy choices</button></form><details id="public-credit" ${P.current(state,'cat',animalId).public?'open':'hidden'}><summary>Optional public credit</summary><p>Only enter a public name or usernames you would want credited. These stay local and do not grant sharing permission. Leave blank to remain unnamed. Technical exports and complete backups include these details.</p><form id="credit-form"><div class="credit-builder"><label>Public username<input id="credit-username" maxlength="80" placeholder="@yourname" autocomplete="off"></label><fieldset><legend>Choose platforms for this username</legend><div class="platform-grid">${['Instagram','TikTok','YouTube','Reddit','Bluesky','Mastodon','Facebook','X','GitHub','Other'].map(platform=>`<label><input type="checkbox" data-credit-platform value="${platform}">${platform}</label>`).join('')}</div></fieldset><button type="button" class="secondary" id="add-credit-handles">Add selected accounts</button><p class="hint">One username can be credited on several platforms. Review or edit the list below before saving.</p></div>${input('credit_name','Public credit name (optional)',animal()?.attribution?.display_name||'','text','maxlength="120"')}${textarea('credit_accounts','Accounts to credit (platform and username, optional)',animal()?.attribution?.accounts||'')}<button type="submit">Save credit preferences</button><p id="credit-status" role="status"></p></form></details><details class="privacy-videos"><summary>Choose separately for each video</summary><div id="video-privacy-list">Loading local videos…</div></details><button class="secondary" id="revoke-cat" type="button">Turn off all sharing preferences for this cat and its videos</button><p id="privacy-status" role="status"></p><details><summary>Organized by your choices</summary><p class="hint">These lists update automatically on this device. They are not public or uploaded. No commercial-use permission is granted.</p><div id="eligibility-list"></div></details><button class="text-button" data-page="privacy">Read the full privacy reminder</button></div>`;
  }
  function backupPanel(){return `<div class="card"><h2>A complete local copy</h2><p>Download all cats, diary records, corrections, privacy history, preferences, unfinished drafts and video files in one backup. This is a snapshot; future edits do not silently update the file.</p><p class="hint">The file is not encrypted. Store it privately. Up to 100 MB of video per backup in this prototype. Browser storage remains the working diary. A cloud account is not available.</p><button id="complete-backup">Download complete local backup</button><details><summary>Import a backup as separate copies</summary><p class="hint">Existing cats stay unchanged. Imported cats get new IDs and “(imported)” in their name. Research/training/public preferences start off; previous choices remain archived in the technical data. Your current appearance and language stay unchanged.</p><label class="file-drop">Choose an OpenFHS backup<input id="backup-file" type="file" accept="application/json,.json"><span id="backup-filename">No backup selected</span></label><div id="backup-review" hidden></div><button id="confirm-import" hidden>Import these copies</button></details><details><summary>Import recovery</summary><p>If the app closed during an import, check recovery before importing again. Saved imports are kept; unfinished copies are cleaned up.</p><button type="button" id="recover-import">Check import recovery</button></details><p id="backup-status" role="status"></p></div>`;}
  function privacyPage(){return `<div class="card"><h2>Your information belongs under your control.</h2><p>OpenFHS is a people-led project building better feline observation tools. Our commitments are accessible care tools, no data sales, no advertising trackers, and optional sharing. The intended funding model is voluntary support and donations. Formal community ownership and funding arrangements are still being established.</p><p>Currently, fictional diary records and videos stay in this browser profile. We do not receive them. Someone who can use your browser profile may be able to read them. Browser storage can be cleared or lost. A downloaded backup is a separate, unencrypted file you control.</p><p>Support reports are separate: if you explicitly send a reviewed report through a connected support service, its text and your reply email are shared with OpenFHS and Resend for delivery. Diary files are not attached automatically.</p><p>There is no cloud account, study enrollment, automatic research transfer, public library or payment collection in this prototype. Local preference lists are preparation for a reviewed research service, not a replacement for informed study consent.</p><p><strong>Proposed research-data rule:</strong> no sale of participant data and no commercial reuse of controlled research records without a separate written agreement with the project operator, compatible participant permission, and research governance review. Contacting the operator alone does not grant permission. These proposed terms need review before any real dataset is distributed; the AGPLv3 software license is separate.</p><p>Use the controls below to change each purpose. Revocation changes future local eligibility immediately. Deleting a local clip removes that browser copy, not files already downloaded or shared elsewhere.</p></div>${privacyPanel()}${backupPanel()}`;}
  function helpPage(){return `<div class="card help-card"><form id="help-form"><h2>What can we help with?</h2><div class="form-grid">${select('kind','What would you like to report?',F.SUPPORT_KINDS,F.SUPPORT_KINDS[0])}${select('area','Where in the app?',F.SUPPORT_AREAS,'Not sure')}${input('location','Specific button or step (optional)','','text','maxlength="150"')}${input('device','Device or browser (optional)','','text','maxlength="150"')}${input('email','Reply email (needed for in-app sending)','','email','maxlength="254" autocomplete="email"')}</div><label>What happened, or what would you like help with?<textarea name="detail" rows="5" maxlength="2000" required placeholder="A sentence or two is enough. You can write in your preferred language."></textarea></label><p class="hint">Use fictional examples. Do not include passwords, wallet recovery phrases, private diary records, or videos. This form is not saved after you leave this page.</p><p class="hint">Privacy or security concern? This goes to the project’s private email address, not a public issue tracker.</p><p id="help-error" class="error" role="alert" hidden></p><div class="actions"><button type="submit">Review my report</button></div></form></div><section id="help-review" class="card" hidden aria-labelledby="help-review-title"><h2 id="help-review-title" tabindex="-1">Review before sending</h2><label>Your report<textarea id="help-preview" rows="12" readonly></textarea></label><p>Nothing has been sent. Review the text below. When connected, you can send from this app. You can also open an email draft or download a copy for <a href="mailto:openfhs@gmail.com">openfhs@gmail.com</a>.</p><div class="actions"><a id="help-email" class="support-link">Open email draft</a><button type="button" class="secondary" id="help-download">Download report</button></div><p class="hint">Your email app shares your email address and anything you choose to send. If the email draft is incomplete or does not open, download the report instead.</p><div class="callout"><p id="help-availability">Checking in-app support availability…</p><label class="consent-check"><input type="checkbox" id="help-send-consent"><span>I agree to send this report and my reply email to OpenFHS support and Resend, its email delivery provider. No diary files are attached.</span></label><button type="button" id="help-send" disabled>Send from this app</button></div><p id="help-status" role="status"></p></section><div class="card"><h2>Need help right now?</h2><p>This inbox is not monitored for urgent veterinary care. Contact a veterinarian for concerns about your cat’s health. Replies from this volunteer project may take time.</p><details><summary>How do I correct an entry?</summary><p>Open Records & exports, find the entry, and choose its correction button. Explain the change before saving; the original stays in the revision history.</p></details><details><summary>How do I keep a copy of my diary?</summary><p>Open Settings & privacy and download a complete local backup. Keep it somewhere private. A readable export is useful for reading or printing, but does not include your video files.</p></details></div>`;}
  const supportWallets=[
    ['XRP','XRP Ledger · no destination tag required','rpFRheiAtVrV8BM7vV97RGapkDkFXyiDEP'],
    ['Bitcoin','Bitcoin network','bc1q2hdzc8yarash4qh00jkkmeq3jt6qw9jnwlkfpe'],
    ['Ether','Ethereum mainnet · native ETH','0xe052895e454652B2758bD700b7c620e26C33F8f9'],
    ['Solana','Solana network · native SOL','7fPcxzBcXRKyFncum97iKDQMwwyLFfbfmxR9zmnJBCB3'],
    ['Litecoin','Litecoin network','Lgfts881rffe1V91Q39XyeoBKBURFiKxW4']
  ];
  function support(){return `<div class="card"><h2>Building an Open Standard for Feline Health</h2><p>OpenFHS began with Feline Hyperesthesia Syndrome and is growing toward an Open Feline Health Standard. Today this is a fictional-data observation prototype, not an adopted standard or active research study. Our aim is accessible care tools and carefully reviewed research. Community governance and real research services are still being developed.</p><h3>Support, only if you want to</h3><p>Voluntary contributions support development and the founder’s living costs. All diary features and privacy choices remain available without donating. Please put your own needs and your cat’s care first.</p><a class="support-link" href="https://ko-fi.com/openfhs" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Support OpenFHS on Ko-fi 🐾 ↗</a><p class="hint">Opens Ko-fi in a new tab. Its own privacy and payment terms apply. No payment details are collected here, and no Ko-fi tracking scripts load in this diary. Contributions are not presented as charitable tax-deductible gifts.</p><details class="crypto-support"><summary>Other ways to support: cryptocurrency</summary><p class="hint">Optional and irreversible. Use the exact named network and compare the complete address in your wallet before sending. Public blockchains are not private. This app never connects to a wallet or asks for a recovery phrase.</p>${supportWallets.map(([name,network,address],i)=>`<section class="wallet-card"><h3>${name}</h3><p>${network}</p><code>${address}</code><button type="button" class="secondary" data-copy-wallet="${i}" aria-label="Copy ${name} address">Copy address</button></section>`).join('')}<p id="wallet-copy-status" role="status" aria-live="polite"></p></details><h3>Contact & contribute</h3><p><a href="mailto:openfhs@gmail.com">openfhs@gmail.com</a> · <a href="https://github.com/amgedi/OpenFHS" target="_blank" rel="noopener noreferrer">OpenFHS · GitHub ↗</a></p><p class="hint">For feedback, use fictional examples. Do not email private diary backups or videos. This inbox is not monitored for urgent veterinary care.</p><button type="button" class="secondary" id="feedback-template">Download a feedback template</button><p id="feedback-status" role="status"></p><h3>Help without spending anything</h3><p>Try fictional tasks, report confusing wording, review translations, or contribute accessibility feedback. There is no donation reminder or reward tied to your records.</p></div>`;}

  async function loadPrivacy(){
    const token=mediaPageToken;try{const videos=await M.list();if(token!==mediaPageToken||!$('#video-privacy-list'))return;
    if($('#video-privacy-list').dataset.loaded!==animalId){
    $('#video-privacy-list').dataset.loaded=animalId;
    $('#video-privacy-list').innerHTML=videos.filter(v=>v.animal_id===animalId).map(v=>`<form class="video-privacy-form" data-video-id="${escape(v.id)}"><h3>${escape(v.title)}</h3>${permissionChoices('video',v.id)}<button type="submit">Save video privacy choices</button></form>`).join('')||'<p class="hint">No local videos for this cat.</p>';
    document.querySelectorAll('.video-privacy-form').forEach(form=>{form.addEventListener('input',()=>{dirty=true;});form.addEventListener('submit',event=>{event.preventDefault();try{persist(P.set(state,'video',form.dataset.videoId,Object.fromEntries(P.PURPOSES.map(k=>[k,form.elements[k].checked]))));form.dataset.unsaved='false';dirty=!!document.querySelector('form[data-unsaved=true]');$('#privacy-status').textContent='Video preferences saved locally. Nothing was uploaded.';loadPrivacy();}catch(error){$('#privacy-status').textContent=L.translate(error.message,X.settings.language);}});});
    }
    const lists=P.organized(state,videos);$('#eligibility-list').innerHTML=P.PURPOSES.map(k=>`<section><h3>${{research:'Research',training:'Model training',public:'Public sharing'}[k]}</h3><p>Cat records: ${lists[k].cats.map(a=>escape(a.name)).join(', ')||'None'}</p><p>Videos: ${lists[k].videos.map(v=>escape(v.title)+' ('+escape(state.animals.find(a=>a.id===v.animal_id)?.name)+')').join(', ')||'None'}</p></section>`).join('');L.apply(X.settings.language);
    }catch(error){if(token===mediaPageToken&&$('#privacy-status'))$('#privacy-status').textContent=L.translate(error.message,X.settings.language);}
  }
  function bindPrivacy(){
    if($('#video-privacy-list'))loadPrivacy();
    $('#cat-privacy-form input[name="public"]')?.addEventListener('change',event=>{const panel=$('#public-credit');panel.hidden=!event.target.checked;panel.open=event.target.checked;});
    $('#add-credit-handles')?.addEventListener('click',()=>{const name=$('#credit-username').value.trim(),platforms=[...document.querySelectorAll('[data-credit-platform]:checked')].map(el=>el.value);if(!name||!platforms.length)return;const field=$('#credit-form textarea[name="credit_accounts"]'),lines=new Set(field.value.split('\n').filter(Boolean));platforms.forEach(platform=>lines.add(platform+': '+name));const value=[...lines].join('\n');if(value.length>500){$('#credit-status').textContent=L.translate('Keep credit details within 500 characters.',X.settings.language);return;}field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));});
    $('#credit-form')?.addEventListener('input',()=>{dirty=true;});
    $('#credit-form')?.addEventListener('submit',event=>{event.preventDefault();try{persist(C.save(state,'animals',{...animal(),...Object.fromEntries(new FormData(event.target))},{id:animalId,reason:'Updated optional public credit'}));event.target.dataset.unsaved='false';dirty=!!document.querySelector('form[data-unsaved=true]');$('#credit-status').textContent=L.translate('Credit saved locally. Nothing was published.',X.settings.language);}catch(error){$('#credit-status').textContent=L.translate(error.message,X.settings.language);}});
    $('#cat-privacy-form')?.addEventListener('input',()=>{dirty=true;});
    $('#cat-privacy-form')?.addEventListener('submit',event=>{event.preventDefault();try{persist(P.set(state,'cat',animalId,Object.fromEntries(P.PURPOSES.map(k=>[k,event.target.elements[k].checked]))));event.target.dataset.unsaved='false';dirty=!!document.querySelector('form[data-unsaved=true]');$('#privacy-status').textContent='Cat preferences saved locally. Nothing was uploaded.';loadPrivacy();}catch(error){$('#privacy-status').textContent=L.translate(error.message,X.settings.language);}});
    $('#revoke-cat')?.addEventListener('click',async()=>{const id=animalId,token=mediaPageToken;try{const videos=await M.list();if(token!==mediaPageToken)return;let next=P.set(state,'cat',id,{research:false,training:false,public:false});for(const v of videos.filter(v=>v.animal_id===id))next=P.set(next,'video',v.id,{research:false,training:false,public:false});persist(next);document.querySelectorAll('#cat-privacy-form,.video-privacy-form').forEach(form=>{form.dataset.unsaved='false';form.querySelectorAll('input[type=checkbox]').forEach(box=>{box.checked=false;});});dirty=!!document.querySelector('form[data-unsaved=true]');if($('#public-credit')){$('#public-credit').hidden=true;$('#public-credit').open=false;}loadPrivacy();notice('All future-use preferences for this cat and its videos are off. Local records were kept.');}catch(error){notice(error.message);}});
    $('#complete-backup')?.addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;const status=$('#backup-status');status.textContent='Preparing records and video files…';try{const captured=JSON.parse(JSON.stringify(state)),prefs={...X.settings},media=await M.list();if(JSON.stringify(state)!==JSON.stringify(captured))throw Error('Diary changed during backup. Try again.');const content=await B.create(captured,prefs,media,collectDrafts());B.download(content,'openfhs-complete-backup-'+localDate()+'.json');status.textContent='Complete backup downloaded. Keep it private; it includes video files and is not encrypted.';}catch(error){status.textContent=L.translate(error.message,X.settings.language);}finally{button.disabled=false;}});
    $('#backup-file')?.addEventListener('change',async event=>{const token=mediaPageToken,selection=++backupSelection,file=event.target.files[0];pendingBackup=null;$('#confirm-import').hidden=true;$('#backup-review').hidden=true;$('#backup-filename').textContent=file?.name||'No backup selected';if(!file)return;$('#backup-status').textContent='Checking file integrity and record references…';try{const inspected=await B.inspect(file);if(token!==mediaPageToken||selection!==backupSelection)return;pendingBackup=inspected;$('#backup-review').hidden=false;$('#backup-review').textContent=`Ready to import ${inspected.state.animals.length} cats, ${inspected.state.episodes.length} episodes, ${inspected.state.daily_reports.length} check-ins, and ${inspected.files.length} videos as separate copies. Sharing starts off.`;$('#confirm-import').hidden=false;$('#backup-status').textContent='Review the contents above, then choose Import these copies.';}catch(error){if(token===mediaPageToken)$('#backup-status').textContent=L.translate(error.message,X.settings.language);}});
    $('#recover-import')?.addEventListener('click',async event=>{const button=event.currentTarget,status=$('#backup-status');button.disabled=true;try{if(!storageUsable||!navigator.locks)throw Error('Recovery requires working browser storage and Web Locks support. Keep your backup.');status.textContent=L.translate(await navigator.locks.request('openfhs-import',()=>B.recoverImport({storage:localStorage,media:M,readState:()=>JSON.parse(localStorage.getItem(KEY))})),X.settings.language);}catch(error){status.textContent=L.translate(error.message,X.settings.language);}finally{button.disabled=false;}});
    $('#confirm-import')?.addEventListener('click',async event=>{if(!pendingBackup)return;if(!storageUsable){$('#backup-status').textContent='Import is unavailable in a temporary session. Keep your backup and reopen the app with working browser storage.';return;}if(dirty&&!canLeave())return;const button=event.currentTarget,status=$('#backup-status'),prepared=B.prepareImport(state,pendingBackup),before=JSON.stringify(state);button.disabled=true;try{if(!navigator.locks)throw Error('Safe import requires a browser with Web Locks support. Keep your backup and use a current supported browser.');await navigator.locks.request('openfhs-import',()=>B.commitImport(prepared,{media:M,persist,storage:localStorage,unchanged:()=>JSON.stringify(state)===before}));}catch(error){status.textContent=L.translate(error.message,X.settings.language);button.disabled=false;return;}pendingBackup=null;dirty=false;try{render();notice('Backup imported as separate cats. Existing cats were kept; imported sharing preferences are off.');}catch{status.textContent='Backup saved successfully. Refresh the page to display the imported cats.';}});
  }

  function videos() {
    const episodes = state.episodes.filter(r => r.animal_id === animalId);
    return `<div class="card form-card"><h2>Keep a clip with your observations.</h2><p class="muted">Practice clips only, up to 50 MB each. Stored in this browser; keep the original file. Clearing browser data can remove clips.</p><form id="video-form"><div class="form-grid">${input('title', 'A short title (optional)', '', 'text', 'maxlength="120"')}${select('episode_id', 'Link to an episode (optional)', [['', 'Keep in this cat’s library'], ...episodes.map((r, i) => [r.id, `${i + 1}. ${r.event_local || 'Time unknown'} · revision ${r.revision}`])], '')}</div><label class="file-drop">Choose a practice video<input name="video" id="video-file" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" required><span id="file-name" aria-live="polite">No clip selected yet</span><span>MP4, WebM, Ogg or MOV · one clip at a time</span></label><button type="button" class="text-button" id="make-sample">Create a fictional sample clip</button><label class="consent-check"><input type="checkbox" name="consent" required><span>${escape(F.CONSENT_TEXT)}</span></label><details><summary>What permission am I giving?</summary><p class="hint">Private storage on this browser only. Research use, AI training, and public sharing stay off. This is a prototype permission record, not enrollment in a research study. Anyone with access to this browser profile may be able to view these clips.</p></details><p id="video-error" class="error" hidden role="alert"></p><div class="actions"><button type="submit">Save private practice video</button></div></form></div><div class="card"><div class="section-top"><h2>${escape(animal()?.name)}’s clips</h2><span class="badge">Local only</span></div><p class="hint">The earlier generated clip is a fictional storage-test animation, not the welcome scene. Libraries are separate for each cat and browser address.</p><div id="other-libraries"></div><div id="video-list" aria-live="polite"><p class="muted">Opening your local library…</p></div></div>`;
  }
  async function loadVideos() {
    const token = mediaPageToken;
    try {
      const allClips = await M.list(); const clips = allClips.filter(r => r.animal_id === animalId);
      if (page !== 'videos' || token !== mediaPageToken) return;
      $('#other-libraries').innerHTML = state.animals.filter(a => a.id !== animalId && allClips.some(c => c.animal_id === a.id)).map(a => `<button class="text-button" data-library="${escape(a.id)}">View ${escape(a.name)}’s clips (${allClips.filter(c => c.animal_id === a.id).length}) →</button>`).join('');
      $('#video-list').innerHTML = clips.length ? clips.map(clip => `<article class="record video-record"><h3>${escape(clip.title)}</h3><p>${clip.size_bytes < 1048576 ? Math.max(1, Math.round(clip.size_bytes / 1024)) + ' KB' : (clip.size_bytes / 1048576).toFixed(1) + ' MB'} · ${escape(clip.created_at.slice(0, 10))} · ${clip.episode_id ? 'Linked to an episode' : 'Cat library'}</p><p class="hint">Private local storage permission recorded. Future-use preferences are separate in Settings; nothing is uploaded.</p><div class="video-preview" data-preview="${escape(clip.id)}"></div><div class="export-buttons"><button class="secondary" data-video-play="${escape(clip.id)}">Preview clip</button><button class="text-button" data-video-remove="${escape(clip.id)}">Remove local copy</button></div><div class="remove-confirm" data-remove-confirm="${escape(clip.id)}" hidden><p>Remove this browser’s copy and its permission record? Your original file stays on your computer. This cannot be undone here.</p><button class="danger-button" data-video-confirm="${escape(clip.id)}">Yes, remove local copy</button><button class="secondary" data-video-cancel="${escape(clip.id)}">Keep video</button></div></article>`).join('') : '<p class="empty">No clips yet. Add one above when you are ready.</p>';
    } catch (error) {
      if (page === 'videos' && token === mediaPageToken) { $('#video-list').textContent = L.translate(error.message,X.settings.language); $('#video-list').classList.add('error'); }
    }
  }
  function updateFileLabel() { if ($('#file-name')) $('#file-name').textContent = $('#video-file').files[0]?.name || 'No clip selected yet'; }
  function bindScene(){ $('#scene-mode')?.addEventListener('change',event=>{sceneMode=event.target.value;$('.cat-scene-card').outerHTML=catScene();bindScene();}); }
  function bindExtras() {
    $('#replay-tutorial')?.addEventListener('click',()=>{if(canLeave()){dirty=false;X.tutorial(true);}});
    const helpForm=$('#help-form');
    let reviewedReport=null,supportReady=false,helpSending=false;
    const refreshSend=()=>{if($('#help-send'))$('#help-send').disabled=!supportReady||!reviewedReport||!$('#help-send-consent').checked||helpSending;};
    if(helpForm&&document.querySelector('meta[name="openfhs-support"]')?.content==='disabled')$('#help-availability').textContent='In-app sending is not connected in this tester alpha. Download your report or open an email draft. Nothing is sent automatically.';
    else if(helpForm)fetch('/api/support/config',{credentials:'omit',cache:'no-store'}).then(r=>r.ok?r.json():null).then(config=>{if(!helpForm.isConnected)return;supportReady=config?.enabled===true;$('#help-availability').textContent=supportReady?'Send here without opening another app. Your email address is needed for replies.':'In-app sending is not connected yet. Use the email draft or download for now. Nothing is queued or sent automatically.';refreshSend();}).catch(()=>{if(helpForm.isConnected)$('#help-availability').textContent='In-app support is unavailable offline. Download your report to keep it for later.';});
    const invalidateHelp=()=>{reviewedReport=null;$('#help-send-consent').checked=false;refreshSend();};
    helpForm?.addEventListener('input',invalidateHelp);helpForm?.addEventListener('change',invalidateHelp);
    $('#help-send-consent')?.addEventListener('change',refreshSend);
    $('#help-send')?.addEventListener('click',async()=>{
      if(!reviewedReport||!supportReady||helpSending||!$('#help-send-consent').checked)return;
      const submitted=reviewedReport;
      if(!submitted.email){$('#help-status').textContent='Enter a reply email address above, then review your report again.';return;}
      helpSending=true;refreshSend();$('#help-status').textContent='Sending your reviewed report…';
      try{const response=await fetch('/api/support',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify({...submitted,consent:true}),signal:AbortSignal.timeout(35000)});const result=await response.json();if(!response.ok||result.accepted!==true||typeof result.reference!=='string')throw Error(result.error||'Support did not confirm acceptance. Keep your report and retry.');if(!helpForm.isConnected)return;$('#help-status').textContent='Your report was accepted by the support mail service. Reference: '+result.reference+(result.receiptQueued?' An automatic receipt was also queued for your email.':' The automatic receipt could not be queued, but your support report was accepted.');if(reviewedReport===submitted){reviewedReport=null;helpForm.dataset.unsaved='false';dirty=false;$('#help-send-consent').checked=false;}}
      catch(error){if(helpForm.isConnected)$('#help-status').textContent='Delivery was not confirmed. '+error.message+' You can retry this same report; do not assume it was received.';}
      finally{helpSending=false;if(helpForm.isConnected)refreshSend();}
    });
    helpForm?.addEventListener('input',()=>{dirty=true;$('#help-review').hidden=true;$('#help-email').removeAttribute('href');});
    helpForm?.addEventListener('change',()=>{dirty=true;$('#help-review').hidden=true;$('#help-email').removeAttribute('href');});
    helpForm?.addEventListener('submit',event=>{event.preventDefault();try{const values=Object.fromEntries(new FormData(helpForm)),report=F.supportReport(values);reviewedReport={...values,requestId:crypto.randomUUID()};$('#help-send-consent').checked=false;refreshSend();$('#help-preview').value=report;$('#help-email').href='mailto:openfhs@gmail.com?subject='+encodeURIComponent('OpenFHS: '+values.kind+' — '+values.area)+'&body='+encodeURIComponent(report);$('#help-error').hidden=true;$('#help-review').hidden=false;$('#help-review-title').focus();$('#help-review').scrollIntoView({block:'start',behavior:'auto'});}catch(error){$('#help-error').textContent=L.translate(error.message,X.settings.language);$('#help-error').hidden=false;}});
    $('#help-download')?.addEventListener('click',()=>{B.download($('#help-preview').value,'openfhs-support-report.txt','text/plain;charset=utf-8');$('#help-status').textContent='Report downloaded. Nothing was sent. Keep this copy if you want to return to it later.';});
    $('#feedback-template')?.addEventListener('click',()=>{
      const content='OpenFHS feedback — v0.5.8-alpha.10\nContact: openfhs@gmail.com\nGitHub: https://github.com/amgedi/OpenFHS\n\nUse fictional examples only. No diary data is attached.\n\nDevice/browser (optional):\nWhat were you trying to do?\nSteps:\nExpected result:\nActual result:\nCould you recover?\nSuggested improvement:\n\nReview your text before emailing it. Nothing is sent automatically.\n';
      B.download(content,'openfhs-feedback-template.txt','text/plain;charset=utf-8');$('#feedback-status').textContent='Template downloaded. Fill it in and review it before sending. No records were included.';
    });
    const filterRecords=()=>{const kind=$('#record-kind')?.value||'all',day=$('#record-date')?.value||'';let count=0;document.querySelectorAll('.record[data-record-kind]').forEach(row=>{row.hidden=!(kind==='all'||row.dataset.recordKind===kind)||!!day&&row.dataset.recordDay!==day;if(!row.hidden)count++;});if($('#record-filter-status'))$('#record-filter-status').textContent=count?count+' matching entries':'No entries match these filters.';};
    $('#record-kind')?.addEventListener('change',filterRecords);$('#record-date')?.addEventListener('input',filterRecords);$('#clear-record-filters')?.addEventListener('click',()=>{$('#record-kind').value='all';$('#record-date').value='';filterRecords();});
    if($('#record-kind'))filterRecords();
    if(page==='settings'){
      const card=document.createElement('section');card.className='card';
      card.innerHTML='<h2>Storage on this device</h2><p>Your diary belongs to this browser and address. Another browser, private window, or the offline launcher has separate storage.</p><p id="storage-estimate" role="status">Checking available storage information…</p><p class="hint">Browser storage is not a backup. Download a complete copy before clearing browser data. Storage estimates include other data on this same address and can change.</p>';
      $('#page').append(card);
      if(navigator.storage?.estimate)navigator.storage.estimate().then(info=>{if(!card.isConnected)return;const mb=n=>Number.isFinite(n)?(n/1048576).toFixed(1)+' MB':'unavailable';card.querySelector('#storage-estimate').textContent='Estimated use: '+mb(info.usage)+'. Browser allowance: '+mb(info.quota)+'.';}).catch(()=>{if(card.isConnected)card.querySelector('#storage-estimate').textContent='This browser could not estimate storage. You can still download a backup.';});
      else card.querySelector('#storage-estimate').textContent='Storage estimates are unavailable in this browser.';
    }
    document.querySelectorAll('[data-copy-wallet]').forEach(button=>button.addEventListener('click',async()=>{
      const wallet=supportWallets[Number(button.dataset.copyWallet)];if(!wallet)return;
      const status=document.querySelector('#wallet-copy-status');
      try{await navigator.clipboard.writeText(wallet[2]);status.textContent=wallet[0]+' address copied. Compare it with the full address shown above before sending.';}
      catch{status.textContent='Clipboard unavailable. Select and copy the full address shown above manually.';}
    }));
    bindPrivacy();
    $('#scene-mode')?.addEventListener('change',event=>{sceneMode=event.target.value;const holder=$('.cat-scene-card');holder.outerHTML=catScene();bindScene();});
    document.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{const form=$('#avatar-form');form.dataset.unsaved='true';const v=A.normalize(A.presets[button.dataset.preset]);for(const [key,value]of Object.entries(v))form.elements[key].value=value;$('#avatar-preview').innerHTML=avatar(v);dirty=true;document.querySelectorAll('[data-preset]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
    $('#avatar-form')?.addEventListener('input', event => { dirty = true; $('#avatar-preview').innerHTML = avatar(Object.fromEntries(new FormData(event.currentTarget))); });
    $('#avatar-form')?.addEventListener('submit', event => {
      event.preventDefault();
      try { persist(C.save(state, 'animals', { ...animal(), ...Object.fromEntries(new FormData(event.target)) }, { id: animalId, reason: 'Updated decorative avatar' })); dirty = false; render(); notice('Avatar saved for this cat.'); }
      catch (error) { $('#avatar-error').hidden = false; $('#avatar-error').textContent = L.translate(error.message,X.settings.language); }
    });
    $('#daily-full')?.addEventListener('click', () => { if (!canLeave()) return; dailyMode = 'full'; dirty = false; render(); });
    document.querySelectorAll('[data-quick]').forEach(button => button.addEventListener('click', () => { if (quickChoice === button.dataset.quick) return; quickChoice = button.dataset.quick; render(); dirty = true; $('#quick-form').scrollIntoView({block:'nearest'}); }));
    $('#quick-form')?.addEventListener('submit', event => {
      event.preventDefault(); const values = Object.fromEntries(new FormData(event.target));
      try {
        if (!quickChoice) throw new Error('Choose the description closest to your day.');
        if (quickChoice === 'known' && (!values.count || Number(values.count) < 1)) throw new Error('Enter at least one episode, or choose the zero-observed option.');
        const known = ['zero','known'].includes(quickChoice);
        persist(C.save(state,'daily_reports',{ local_date: today, timezone: zone, coverage: quickChoice === 'none' ? 'none' : 'intermittent', count_status: known ? 'known' : quickChoice === 'none' ? 'not_observed' : 'unknown', observed_episode_count: quickChoice === 'zero' ? 0 : quickChoice === 'known' ? values.count : '', count_precision: quickChoice === 'zero' ? 'exact' : values.precision, details_complete: 'unknown', evidence_type:'direct_observation', notes:'' },{animalId}));
        dirty = false; page = 'overview'; render(); notice('Check-in saved. Thank you for recording what you know, including uncertainty.');
      } catch(error) { $('#quick-error').hidden = false; $('#quick-error').textContent = L.translate(error.message,X.settings.language); }
    });
    $('#make-sample')?.addEventListener('click', async event => {
      const button = event.target; button.disabled = true; button.textContent = 'Creating a fictional clip…';
      const token = mediaPageToken;
      try {
        const file = await M.sample(); if (page !== 'videos' || token !== mediaPageToken) return;
        const transfer = new DataTransfer(); transfer.items.add(file); $('#video-file').files = transfer.files;
        $('#video-form').elements.consent.checked = false; updateFileLabel();
        dirty = true; notice('Sample clip ready. Confirm private-storage permission below before saving.');
      } catch (error) { notice(error.message); }
      finally { if (button.isConnected) { button.disabled = false; button.textContent = 'Create a fictional sample clip'; } }
    });
    $('#settings-form')?.addEventListener('input', () => { dirty = true; });
    $('#settings-form')?.addEventListener('submit', event => {
      event.preventDefault(); const data = Object.fromEntries(new FormData(event.target));
      try { X.save({ ...data,  celebrations:data.celebrations==='yes', intro: data.intro === 'yes', reportNotes: data.reportNotes === 'yes' }); event.target.dataset.unsaved='false';dirty=!!document.querySelector('form[data-unsaved=true]');L.apply(X.settings.language);notice('Preferences saved for this browser.'); }
      catch { $('#settings-error').hidden = false; $('#settings-error').textContent = 'This browser could not save preferences. Check browser storage and try again.'; }
    });
    $('#replay-intro')?.addEventListener('click', () => X.intro(true));
    if (page === 'videos') loadVideos();
    $('#video-file')?.addEventListener('change', () => { $('#video-form').elements.consent.checked = false; updateFileLabel(); });
    $('#video-form')?.addEventListener('input', () => { dirty = true; });
    $('#video-form')?.addEventListener('submit', async event => {
      event.preventDefault(); const form = event.target, button = form.querySelector('button[type="submit"]');
      const file = form.elements.video.files[0], capturedAnimal = animalId, capturedToken = mediaPageToken;
      const episodeId = form.elements.episode_id.value;
      button.disabled = true; button.textContent = 'Saving on this device…'; $('#video-error').hidden = true;
      try {
        if (episodeId && !state.episodes.some(r => r.id === episodeId && r.animal_id === capturedAnimal)) throw new Error('Choose an episode belonging to this cat.');
        await M.add(file, { consent: form.elements.consent.checked, animalId: capturedAnimal, episodeId, title: form.elements.title.value });
        if (page !== 'videos' || capturedToken !== mediaPageToken) return;
        dirty = false; form.reset(); updateFileLabel(); await loadVideos(); notice('Practice video saved locally with its permission record. Nothing was uploaded.');
      } catch (error) { if (page === 'videos' && capturedToken === mediaPageToken) { $('#video-error').textContent = L.translate(error.message,X.settings.language); $('#video-error').hidden = false; } }
      finally { if (button.isConnected) { button.disabled = false; button.textContent = 'Save private practice video'; } }
    });
  }
  function bindPage() {
    $('#page').dataset.screen = page;
    bindExtras();
    const form = $('#entry-form');
    if (form) {
      const help=document.createElement('details');help.className='observation-help';
      help.innerHTML='<summary>What do these observation words mean?</summary><dl><dt>Unknown / not sure</dt><dd>You cannot confidently tell. This is a useful answer.</dd><dt>Not observed</dt><dd>You did not watch the relevant time or body area.</dd><dt>No</dt><dd>You watched for that behaviour and did not see it during your observation.</dd><dt>Zero episodes</dt><dd>You observed zero during your coverage, not necessarily throughout the whole day.</dd><dt>Not answered</dt><dd>You skipped a question. It is not interpreted as “No”.</dd><dt>Baseline</dt><dd>A dated description of your cat’s usual context and reported history, not a diagnosis.</dd></dl>';
      form.before(help);
      if(editing && form.dataset.type!=='episodes'){
        const help=document.createElement('div');help.className='callout';
        help.innerHTML='<strong>Correcting a saved entry</strong><p>Change the mistaken answer, enter a Reason for correction below, then choose Save correction. Your original entry stays in its history.</p>';
        form.before(help);
      }
      form.addEventListener('input', () => { dirty = true; });
      form.addEventListener('change', () => { dirty = true; dependencies(form); });
      form.addEventListener('submit', event => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        data.behaviors = Object.fromEntries(Object.keys(C.BEHAVIORS).map(k => [k, data['behavior_' + k]]));
        data.histories = Object.fromEntries(Object.keys(C.HISTORY).map(k => [k, data['history_' + k]]));
        try {
          const type = form.dataset.type;
          if(form.dataset.draftKey && localStorage.getItem(form.dataset.draftKey)!==(form.dataset.draftRaw||null))throw Error('Another tab changed this draft. Copy your answers before reloading; the newer draft has been kept.');
          persist(C.save(state, type, data, { id: editing?.id || null, animalId, reason: data.correction_reason }));
            let cleanupWarning='';
            try { clearDraft(form, storageUsable); } catch { cleanupWarning=' The entry is saved, but its draft could not be removed. Review the saved entry before submitting that draft again.'; }
            const celebrate=type==='daily_reports'&&!editing; dirty = false; editing = null; page = 'records'; render(); if(celebrate) celebrateStreak();
            notice(storageUsable ? 'Practice entry saved in this browser. You can review or correct it below.'+cleanupWarning : 'Practice entry kept for this session only. Your saved draft has been retained. Download JSON before closing.');
          window.scrollTo(0, 0);
        } catch (error) { $('#form-error').textContent = L.translate(error.message,X.settings.language); $('#form-error').hidden = false; $('#form-error').scrollIntoView({ block: 'center' }); }
      });
      dependencies(form);
      if (['episodes','daily_reports'].includes(form.dataset.type)) X.guided(form, { mode: form.dataset.type==='episodes' ? episodeMode || 'full' : dailyMode==='guided'?'guided':'full', onChange: mode => { if(page==='episode')episodeMode=mode;else dailyMode=mode; } });
      bindDraft(form);
    }
    $('#new-baseline')?.addEventListener('click', () => { $('#page').innerHTML = baselineFields({}); bindPage(); });
  }

  function draftKey(form){return 'openfhs-draft-v1:'+animalId+':'+form.dataset.type+':'+(editing?.id||'new');}
  function collectDrafts(){
    const drafts=[...(state.recovered_drafts||[])];
    for(const a of state.animals)for(const type of ['episodes','daily_reports'])for(const id of [null,...state[type].filter(r=>r.animal_id===a.id).map(r=>r.id)]){
      const raw=localStorage.getItem('openfhs-draft-v1:'+a.id+':'+type+':'+(id||'new'));
      if(raw){const draft=JSON.parse(raw),index=drafts.findIndex(d=>d.animal_id===a.id&&d.type===type&&d.record_id===id);if(index>=0)drafts.splice(index,1);drafts.push({...draft,animal_id:a.id,type,record_id:id});}
    }
    return drafts;
  }
    function clearDraft(form,durable=true){return F.removeDraft(localStorage,form.dataset.draftKey||draftKey(form),form.dataset.draftRaw||null,durable);}
  function bindDraft(form){
    if(!['episodes','daily_reports'].includes(form.dataset.type))return;
    const key=draftKey(form);form.dataset.draftKey=key;
    const box=document.createElement('div');box.className='draft-status callout card';box.setAttribute('role','status');form.before(box);
      let stored=null,lastRaw=null,unreadable=false;
      try{lastRaw=localStorage.getItem(key);stored=JSON.parse(lastRaw||'null');if(lastRaw&&(!stored||!stored.fields||typeof stored.fields!=='object'||Array.isArray(stored.fields)||Object.values(stored.fields).some(v=>typeof v!=='string')))unreadable=true;}catch{unreadable=true;}
      form.dataset.draftRaw=lastRaw||'';
      if(unreadable){
        form.inert=true;
        box.innerHTML='<strong>This draft could not be read.</strong><p>Your saved draft has not been overwritten. Download a recovery copy before choosing to discard it.</p><div class="actions"><button type="button" data-recovery>Download recovery copy</button><button type="button" class="secondary" data-discard-broken>Discard unreadable draft</button></div>';
        const message=document.createElement('p');box.append(message);
        box.querySelector('[data-recovery]').onclick=()=>{if(lastRaw===null){message.textContent='Browser storage could not be read. Keep this page open and check browser storage access.';return;}const url=URL.createObjectURL(new Blob([lastRaw],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='openfhs-unreadable-draft.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);};
        box.querySelector('[data-discard-broken]').onclick=()=>{try{clearDraft(form);box.remove();form.inert=false;bindDraft(form);}catch{message.textContent='The draft could not be discarded. It may have changed in another tab, or storage is unavailable.';}};
        return;
      }
      let recovered=(state.recovered_drafts||[]).find(d=>d.animal_id===animalId&&d.type===form.dataset.type&&d.record_id===(editing?.id||null));
    stored ||= recovered;
      function consumeRecovered(){if(recovered){if(!storageUsable)throw Error('The restored draft cannot be removed in a temporary session.');const next=JSON.parse(JSON.stringify(state));next.recovered_drafts=next.recovered_drafts.filter(d=>!(d.animal_id===recovered.animal_id&&d.type===recovered.type&&d.record_id===recovered.record_id));persist(next);recovered=null;}}
    function save(){try{if(localStorage.getItem(key)!==lastRaw)throw Error('Another tab changed this draft');const fields={};for(const f of form.elements)if(f.name)fields[f.name]=f.value;const raw=JSON.stringify({fields,updated:new Date().toISOString()});localStorage.setItem(key,raw);lastRaw=raw;form.dataset.draftRaw=raw;consumeRecovered();box.textContent='Draft saved on this device. Submit when you are ready. Drafts do not count as check-ins.';dirty=false;form.dataset.unsaved='false';}catch{box.textContent='Draft could not be saved, or another tab changed it. Keep this page open and copy your answers before reloading.';dirty=true;}}
    if(stored?.fields){box.innerHTML='<strong>An unfinished entry is here.</strong><p>Continue your saved answers or discard this draft. It has not been submitted.</p><div class="actions"><button type="button" data-resume>Continue unfinished entry</button><button type="button" class="secondary" data-discard>Discard draft</button></div>';form.inert=true;
      const identity=F.draftIdentity(form.dataset.type,stored.fields),context=document.createElement('p');context.dataset.userContent='';context.textContent=[animal()?.name||'',L.translate(identity.kind,X.settings.language),identity.date?L.date(identity.date,X.settings.language):L.translate('Time unknown',X.settings.language),editing?.id||L.translate('New entry',X.settings.language)].join(' · ');box.querySelector('strong').after(context);
      box.querySelector('[data-resume]').onclick=()=>{for(const f of form.elements)if(f.name&&typeof stored.fields[f.name]==='string')f.value=stored.fields[f.name];form.inert=false;dependencies(form);form.dispatchEvent(new Event('change'));};
        box.querySelector('[data-discard]').onclick=()=>{try{if(localStorage.getItem(key)!==lastRaw)throw Error();consumeRecovered();clearDraft(form);lastRaw=null;form.dataset.draftRaw='';form.inert=false;box.textContent='Start fresh. Answers will save here as you type.';}catch{const message=document.createElement('p');message.textContent='The draft could not be discarded. It may have changed in another tab, or storage is unavailable. Your answers remain recoverable.';box.append(message);}};
    }else box.textContent='Answers automatically save here as you type. Complete backups include drafts; submitted-record exports do not.';
    form.addEventListener('input',save);form.addEventListener('change',save);
  }
  function celebrateStreak(){
    const n=F.participation(state.daily_reports,animalId,today).streak;
    if(!X.settings.celebrations||![1,3,7,14,30,60,100,365].includes(n))return;
    const key='openfhs-milestone:'+animalId+':'+n;try{if(localStorage.getItem(key))return;localStorage.setItem(key,'seen');}catch{return;}
    const el=document.createElement('div');el.className='milestone';el.setAttribute('role','status');el.innerHTML='<strong>'+n+' day'+(n===1?'':'s')+' of observations. Thank you.</strong><p>Every honest check-in counts. Taking a break is always okay.</p><button type="button" class="secondary">Close</button>'+Array.from({length:Math.min(36,8+n)},(_,i)=>'<i style="--i:'+i+'">✦</i>').join('');document.body.append(el);el.querySelector('button').onclick=()=>el.remove();setTimeout(()=>el.remove(),4500);
  }

  function dependencies(form) {
    const el = name => form.elements.namedItem(name);
    const disable = (name, condition, clear = false) => { const f = el(name); if (!f) return; f.disabled = condition; if (condition && clear) f.value = ''; };
    if (el('event_time_precision')) {
      disable('event_date', el('event_time_precision').value === 'unknown');
      disable('event_time', el('event_time_precision').value !== 'minute');
      if (el('observed_portion').value !== 'whole' && el('duration_status').value === 'known') el('duration_status').value = 'not_observed';
      el('duration_status').querySelector('option[value="known"]').disabled = el('observed_portion').value !== 'whole';
      disable('duration_value', el('duration_status').value !== 'known', true);
      disable('duration_basis', el('duration_status').value !== 'known');
    }
    if (el('coverage')) {
      if (el('coverage').value === 'none') el('count_status').value = 'not_observed';
      else if (el('count_status').value === 'not_observed') el('count_status').value = 'unknown';
      el('count_status').disabled = false;
      for (const option of el('count_status').options) option.disabled = el('coverage').value === 'none' ? option.value !== 'not_observed' : option.value === 'not_observed';
      disable('observed_episode_count', el('count_status').value !== 'known', true);
      disable('count_precision', el('count_status').value !== 'known');
    }
  }
  async function download(kind) {
    const selected = X.settings.exportScope === 'selected' ? animalId : null;
    let data;
    let media;
    try { media = (await M.list()).filter(r => !selected || r.animal_id === selected); }
    catch { notice('Video metadata could not be read. Export stopped so it cannot silently omit attachments. Open the video library and check storage.'); return; }
    data = F.scope(state, selected, media);
    const json = kind === 'json', readable = kind === 'readable';
    const exported = json ? C.exportJSON(data) : null;
    if (exported) { exported.media = media; exported.export_metadata.media_files_included = false; exported.export_metadata.scope = selected ? 'selected_cat' : 'all_cats'; }
    const content = readable ? F.reportHTML(data, { includeNotes: X.settings.reportNotes, media, language:X.settings.language, translate:value=>L.translate(value,X.settings.language) }) : json ? JSON.stringify(exported, null, 2) : C.exportCSV(data, kind);
    const blob = new Blob([content], { type: readable ? 'text/html;charset=utf-8' : json ? 'application/json' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url;
    link.download = 'openfhs-fictional-' + (json ? 'technical' : kind) + '-' + today + (readable ? '.html' : json ? '.json' : '.csv');
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
    notice(readable ? 'Readable report prepared. Open the downloaded file to read, print, or save as PDF.' : 'Technical export prepared. Video files are kept separate; JSON includes their metadata and permission records.');
  }
  document.addEventListener('click', event => {
    const library = event.target.closest('[data-library]'); if (library && canLeave()) { animalId = library.dataset.library; dirty = false; render(); }
    const draft=event.target.closest('[data-draft-type]');if(draft){const type=draft.dataset.draftType;go(type==='episodes'?'episode':'daily',state[type].find(r=>r.id===draft.dataset.draftRecord)||null);if(page===(type==='episodes'?'episode':'daily')){episodeMode='full';dailyMode='full';render();}}
    const dailyView=event.target.closest('[data-daily-mode]'); if(dailyView){dailyMode=dailyView.dataset.dailyMode;render();}
    const mode = event.target.closest('[data-mode]'); if (mode) { episodeMode = mode.dataset.mode; render(); }
    const nav = event.target.closest('[data-page]'); if (nav) go(nav.dataset.page);
    const edit = event.target.closest('[data-edit]'); if (edit) go({ episodes: 'episode', daily_reports: 'daily', baselines: 'baseline' }[edit.dataset.type], state[edit.dataset.type].find(r => r.id === edit.dataset.edit));
    const exp = event.target.closest('[data-export]'); if (exp) download(exp.dataset.export).catch(error => notice('Export could not be completed: ' + error.message));
  });
  document.addEventListener('click', async event => {
    const remove = event.target.closest('[data-video-remove]');
    if (remove) { remove.closest('.video-record').querySelector('.remove-confirm').hidden = false; return; }
    const cancel = event.target.closest('[data-video-cancel]');
    if (cancel) { cancel.closest('.remove-confirm').hidden = true; return; }
    const confirm = event.target.closest('[data-video-confirm]');
    if (confirm) {
      const token = mediaPageToken;
      confirm.disabled = true;
      try { await M.remove(confirm.dataset.videoConfirm); if (page === 'videos' && token === mediaPageToken) { render(); notice('Local video and its permission record removed. Your original file was not changed.'); } }
      catch (error) { notice(error.message); confirm.disabled = false; }
      return;
    }
    const play = event.target.closest('[data-video-play]');
    if (play) {
      const token = mediaPageToken; play.disabled = true;
      try {
        const clip = await M.get(play.dataset.videoPlay);
        if (page !== 'videos' || token !== mediaPageToken) return;
        if (!clip?.blob || !clip.consent?.local_storage) throw new Error('The clip is no longer available with local-storage permission.');
        const url = URL.createObjectURL(clip.blob); mediaURLs.push(url);
        const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = url; video.setAttribute('aria-label', clip.title);
        const target = play.closest('.video-record').querySelector('.video-preview'); target.replaceChildren(video);
        video.addEventListener('error', () => { const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'This browser cannot play the clip. The original is stored unchanged; try a browser-supported video format.'; target.append(hint); }, { once: true });
      } catch (error) { notice(error.message); play.disabled = false; }
    }
  });

  let scenicClicks=0,scenicLast=0;
  function openScenic(){
    if(document.querySelector('dialog[open]'))return;
    const scene=document.querySelector('#cat-scene');if(!scene)return;
    const dialog=document.createElement('dialog');dialog.className='scenic-dialog'+(X.settings.theme==='arcade'?' pixel-arcade':'');dialog.setAttribute('aria-label','A quiet moment with your cat');
    dialog.innerHTML='<div class="scenic-landscape" aria-hidden="true"><div class="scenic-sun"></div><div class="scenic-cloud cloud-one"></div><div class="scenic-cloud cloud-two"></div><div class="scenic-mountains"></div><div class="scenic-water"></div><div class="scenic-birds"><i></i><i></i><i></i></div><div class="scenic-hill hill-back"></div><div class="scenic-hill hill-front"></div><div class="scenic-tree"><i></i><i></i><i></i></div><div class="scenic-flowers"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="scenic-sparkles"><i></i><i></i><i></i><i></i></div></div><button type="button" class="scenic-close secondary" aria-label="Close scenic view">✕ <span>Close</span></button><p class="scenic-caption"><span data-user-content>'+escape(animal()?.name)+'</span> · '+escape(L.translate('A little care. A clearer record.',X.settings.language))+'</p>';
    const cat=scene.cloneNode(true);cat.removeAttribute('id');cat.removeAttribute('role');cat.removeAttribute('tabindex');cat.removeAttribute('aria-label');cat.classList.add('scenic-cat');dialog.append(cat);
    dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>{dialog.remove();document.querySelector('#cat-scene')?.focus();},{once:true});document.body.append(dialog);dialog.showModal();L.apply(X.settings.language);dialog.querySelector('button').focus();
  }
  function scenicTap(event){if(!event.target.closest('#cat-scene'))return;if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;if(event.type==='keydown')event.preventDefault();const now=Date.now();scenicClicks=now-scenicLast<1800?scenicClicks+1:1;scenicLast=now;if(scenicClicks===3){scenicClicks=0;openScenic();}}
  document.addEventListener('click',scenicTap);document.addEventListener('keydown',scenicTap);

  $('#mobile-menu').addEventListener('click', () => { const expanded = $('.sidebar').classList.toggle('menu-open'); $('#mobile-menu').setAttribute('aria-expanded', String(expanded)); });
  $('.brand').addEventListener('click', event => { event.preventDefault(); go('overview'); });
  $('#active-cat').addEventListener('change', event => { if (!canLeave()) { event.target.value = animalId; return; } animalId = event.target.value; editing = null; dirty = false; render(); });
  $('#add-cat').addEventListener('click', () => { if (!canLeave()) return; $('#cat-error').hidden = true; $('#cat-form').reset(); $('#cat-dialog').showModal(); });
  $('#cancel-cat').addEventListener('click', () => $('#cat-dialog').close());
  $('#cat-form').addEventListener('submit', event => {
    event.preventDefault();
    try { persist(C.save(state, 'animals', Object.fromEntries(new FormData(event.target)))); animalId = state.animals.at(-1).id; editing = null; dirty = false; page = 'baseline'; $('#cat-dialog').close(); render(); notice('Fictional cat added. You can fill in a short baseline or start with an episode.'); }
    catch (error) { $('#cat-error').textContent = L.translate(error.message,X.settings.language); $('#cat-error').hidden = false; }
  });
  document.addEventListener('input',event=>{const form=event.target.closest('form');if(form&&!['cat-form','entry-form'].includes(form.id))form.dataset.unsaved='true';});
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  $('#today-label').textContent = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  render();
  window.addEventListener('openfhs-tour-step',event=>{if(!dirty)go(event.detail.page);});
  X.init();
  try {if(B.recoveryStatus(localStorage))notice('An interrupted import needs checking. Open Settings, then Import recovery. Keep your original backup.');}catch{}

})();
