window.OpenFHSExperience = (() => {
  const KEY = 'openfhs-preferences-v1';
  const themes = ['light','dark','ocean','lavender','sand','rose','midnight','park'];
  const defaults = { mode: 'ask', motion: 'gentle', theme: themes[Math.floor(Math.random()*themes.length)], language: 'en', intro: true, exportScope: 'selected', reportNotes: true, companion:'auto', celebrations:true, glass:false, panelStyle:'glass' };
  let settings = { ...defaults };
  try { const stored = JSON.parse(localStorage.getItem(KEY) || '{}'); for (const key of Object.keys(defaults)) if (typeof stored[key] === typeof defaults[key]) settings[key] = stored[key]; } catch { /* Keep accessible defaults. */ }
  try { const stored=JSON.parse(localStorage.getItem(KEY)||'{}');if(localStorage.getItem(KEY)!==null&&!stored.panelStyle)settings.panelStyle=(stored.glass||stored.theme==='park')?'translucent':'normal'; } catch {}
  // Choose once, not on every launch. Never replace saved preferences or unreadable data.
  try { if(localStorage.getItem(KEY)===null)localStorage.setItem(KEY,JSON.stringify(settings)); } catch { /* Storage may be unavailable; the diary still opens. */ }
  function apply() {
    document.documentElement.dataset.motion = settings.motion;
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.dataset.glass = 'false';
    document.documentElement.dataset.panel = ['normal','translucent','glass'].includes(settings.panelStyle)?settings.panelStyle:'normal';
  }
  function save(next) {
    const candidate = { ...settings, ...next };
    localStorage.setItem(KEY, JSON.stringify(candidate)); settings = candidate; apply();
  }
  let introTimer;
  function intro(force = false) {
    let seen = false; try { seen = sessionStorage.getItem('openfhs-intro-seen') === 'yes'; } catch { /* Intro can still be dismissed. */ }
    if (!force && (!settings.intro || seen)) { tutorial(); return; }
    const dialog = document.querySelector('#intro-dialog');
    clearTimeout(introTimer); dialog.showModal();
    introTimer = setTimeout(() => dialog.close(), 7000);
  }
  function init() {
    apply();
    const dialog = document.querySelector('#intro-dialog');
    dialog.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { clearTimeout(introTimer); try { sessionStorage.setItem('openfhs-intro-seen', 'yes'); } catch { /* No storage required to continue. */ } tutorial(); });
    dialog.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); dialog.close(); } });
    const privacy = document.querySelector('#privacy-welcome');
    let acknowledged=false;try{acknowledged=localStorage.getItem('openfhs-privacy-notice')==='v1';}catch{}
    const acknowledge=()=>{try{localStorage.setItem('openfhs-privacy-notice','v1');}catch{}privacy.close();};
    document.querySelector('#privacy-continue').addEventListener('click',()=>{acknowledge();intro();});
    document.querySelector('#privacy-settings').addEventListener('click',()=>{acknowledge();document.querySelector('.settings-gear').click();});
    if(acknowledged)intro();else privacy.showModal();
  }
  function tutorial(force=false){
    let seen=false;try{seen=localStorage.getItem('openfhs-tutorial-v2')==='seen';}catch{}
    if((!force&&seen)||document.querySelector('dialog[open]'))return;
    const steps=[
      ['overview','#active-cat','Choose your cat','Each cat has separate records. Switch cats here.'],
      ['daily','#page [data-daily-mode="guided"], #page .recording-toolbar button, #page .card button','One small check-in','Choose guided questions or the full form. Only submitting completes the day.'],
      ['episode','#page [data-mode="guided"], #page .recording-toolbar button','Record what you saw','Unknown and not observed are valid answers. You can skip uncertain questions.'],
      ['records','#page [data-export="readable"]','Keep control of your records','Review corrections and download readable or technical records here.'],
      ['settings','#settings-form select[name="theme"]','Make yourself comfortable','Choose language, motion and appearance. Complete backups and privacy choices are farther down this page.']
    ];
    const dialog=document.createElement('dialog');dialog.className='tutorial-dialog spotlight-tour';dialog.setAttribute('aria-labelledby','tutorial-title');let step=0,target;
    dialog.innerHTML='<div class="tour-highlight" aria-hidden="true"></div><section class="tour-panel"><p class="eyebrow" id="tour-count"></p><h2 id="tutorial-title" tabindex="-1"></h2><p id="tutorial-copy"></p><div class="actions"><button type="button" data-tour-back>Back</button><button type="button" data-tour-next>Next</button><button type="button" class="secondary" data-tour-skip>Skip tutorial</button></div></section>';
    function position(){if(!target)return;const r=target.getBoundingClientRect(),h=dialog.querySelector('.tour-highlight');const left=Math.max(2,r.left-3),top=Math.max(2,r.top-3),right=Math.min(innerWidth-2,r.right+3),bottom=Math.min(innerHeight-2,r.bottom+3);h.style.left=left+'px';h.style.top=top+'px';h.style.width=Math.max(0,right-left)+'px';h.style.height=Math.max(0,bottom-top)+'px';const panel=dialog.querySelector('.tour-panel'),ph=panel.getBoundingClientRect().height;panel.style.bottom='auto';panel.style.right='auto';panel.style.left=Math.max(12,Math.min(innerWidth-panel.offsetWidth-12,r.left+r.width/2-panel.offsetWidth/2))+'px';panel.style.top=(top>ph+24?Math.max(12,top-ph-16):bottom+ph+24<innerHeight?bottom+16:Math.max(12,innerHeight-ph-16))+'px';}
    function show(){window.dispatchEvent(new CustomEvent('openfhs-tour-step',{detail:{page:steps[step][0]}}));target=document.querySelector(steps[step][1]);target?.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});dialog.querySelector('#tour-count').textContent='Question '+(step+1)+' of '+steps.length;dialog.querySelector('h2').textContent=steps[step][2];dialog.querySelector('#tutorial-copy').textContent=steps[step][3];dialog.querySelector('[data-tour-back]').disabled=step===0;dialog.querySelector('[data-tour-next]').textContent=step===steps.length-1?'Start exploring':'Next';window.OpenFHSLanguages?.apply(settings.language);position();requestAnimationFrame(()=>requestAnimationFrame(position));dialog.querySelector('h2').focus({preventScroll:true});}
    dialog.querySelector('[data-tour-back]').onclick=()=>{step--;show();};dialog.querySelector('[data-tour-next]').onclick=()=>{if(step===steps.length-1)dialog.close();else{step++;show();}};dialog.querySelector('[data-tour-skip]').onclick=()=>dialog.close();
    dialog.addEventListener('close',()=>{try{localStorage.setItem('openfhs-tutorial-v2','seen');}catch{}window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);document.body.classList.remove('tour-active');dialog.remove();document.querySelector('#page-title')?.focus();},{once:true});
    document.body.classList.add('tour-active');document.body.append(dialog);dialog.showModal();window.addEventListener('resize',position);window.addEventListener('scroll',position,true);show();
  }
  // One existing form, two views: changing views never discards values.
  function guided(form, { mode, onChange }) {
    const toolbar = document.createElement('div'); toolbar.className = 'recording-toolbar';
    toolbar.innerHTML = '<span>Recording style</span><div class="segmented"><button type="button" data-view="guided">One question at a time</button><button type="button" data-view="full">Full form</button></div>';
    form.before(toolbar);
    const fields = [...form.querySelectorAll('input,select,textarea')];
    const parts = fields.map(field => ({ field, box: field.closest('.behavior-row') || field.closest('label') }));
    const chrome = [...form.querySelectorAll('legend,.hint,.callout')];
    const progress = document.createElement('div'); progress.className = 'question-progress'; progress.setAttribute('aria-live', 'polite');
    const controls = document.createElement('div'); controls.className = 'question-controls';
    controls.innerHTML = '<button type="button" class="secondary" data-step="back">← Back</button><button type="button" class="secondary" data-step="unsure">Not sure / skip</button><button type="button" data-step="next">Next question →</button>';
    form.prepend(progress); form.append(controls);
    const submitActions = form.querySelector('.actions');
    let index = 0, view = mode, review = false;
    function eligible() { return parts.filter(p => !p.field.disabled); }
    function show(focus = false) {
      form.classList.toggle('guided-form', view === 'guided');
      toolbar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
      const list = eligible(); index = Math.min(index, list.length - 1);
      const current = list[index];
      parts.forEach(p => { p.box.hidden = view === 'guided' && !review && p !== current; });
      chrome.forEach(el => { el.hidden = view === 'guided'; });
      form.querySelectorAll('fieldset').forEach(fs => { fs.hidden = view === 'guided' && !review && !fs.contains(current.field); });
      submitActions.hidden = view === 'guided' && !review;
      controls.hidden = view !== 'guided' || review; progress.hidden = view !== 'guided';
      controls.querySelector('[data-step="back"]').disabled = index === 0;
      controls.querySelector('[data-step="next"]').textContent = index === list.length - 1 ? 'Review answers →' : 'Next question →';
      progress.textContent = review ? 'Review your answers, then save. Your answers are still a draft until you submit.' : `Question ${index + 1} of ${list.length}`;
      if (view === 'guided' && !review) {
        const help = document.createElement('p'); help.className = 'question-help';
        if (current.field.name.startsWith('behavior_')) help.textContent = 'Yes: seen. No: watched for and absent. Unknown: unclear. Not observed: you did not watch that part. You can leave it unanswered.';
        else if (current.field.name === 'utc_offset') help.textContent = 'Optional. Leave this blank if you do not know the time offset. We will keep it unknown.';
        else if (current.field.name === 'duration_status') help.textContent = 'Full duration can only be recorded if you saw the entire event.';
        else help.textContent = 'Take your time. Describe only what you know; optional details can stay blank.';
        form.querySelector('.question-help')?.remove(); progress.after(help);
      } else form.querySelector('.question-help')?.remove();
      if(focus && view==='guided' && !review){current.box.classList.remove('question-arrive');void current.box.offsetWidth;current.box.classList.add('question-arrive');}
      if (focus && view === 'guided' && !review) current.field.focus({ preventScroll: true });
      window.OpenFHSLanguages?.apply(settings.language);
    }
    toolbar.addEventListener('click', event => {
      const target = event.target.closest('[data-view]'); if (!target) return;
      view = target.dataset.view; review = false; show(); onChange?.(view);
    });
    controls.addEventListener('click', event => {
      const action = event.target.closest('[data-step]')?.dataset.step; if (!action) return;
      const current = eligible()[index];
      if(action==='unsure'){
        const field=current.field;
        const fallback=field.tagName==='SELECT' ? ['unknown','not_answered','declined'].find(v=>[...field.options].some(o=>o.value===v&&!o.disabled)) : null;
        if(fallback)field.value=fallback;
        else if(['event_date','event_time'].includes(field.name)){form.elements.event_time_precision.value='unknown';}
        else if(field.name==='duration_value'){form.elements.duration_status.value='unknown';}
        else if(field.name==='observed_episode_count'){form.elements.count_status.value='unknown';}
        else if(field.name==='timezone'||field.name==='utc_offset')field.value='unknown';
        else if(field.tagName==='TEXTAREA'&&!field.required)field.value='';
        else {progress.textContent='This answer anchors the record or explains its correction. Choose a value you know, or return later; your draft stays here.';return;}
        field.setCustomValidity('');form.dispatchEvent(new Event('change'));
        if(!field.disabled&&index<eligible().length-1)index++;
        else if(index===eligible().length-1)review=true;
        show(true);return;
      }
      if (action === 'next') {
        if (!current.field.checkValidity()) { current.field.reportValidity(); return; }
        const mustFill = ['event_date', 'event_time', 'duration_value', 'correction_reason'];
        if (mustFill.includes(current.field.name) && !current.field.value) { current.field.setCustomValidity('Please enter this answer, or go back and choose an unknown option.'); current.field.reportValidity(); current.field.addEventListener('input', () => current.field.setCustomValidity(''), { once: true }); return; }
        if (index === eligible().length - 1) review = true; else index++;
      } else index--;
      show(true); form.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    form.addEventListener('change', () => show());
    form.addEventListener('keydown', event => { if (view === 'guided' && !review && event.key === 'Enter' && event.target.tagName !== 'TEXTAREA' && event.target.tagName !== 'BUTTON') { event.preventDefault(); controls.querySelector('[data-step="next"]').click(); } });
    form.addEventListener('submit', event => { if (view === 'guided' && !review) { event.preventDefault(); event.stopImmediatePropagation(); controls.querySelector('[data-step="next"]').click(); } }, true);
    show();
  }
  return { get settings() { return settings; }, save, apply, init, intro, guided, tutorial };
})();
