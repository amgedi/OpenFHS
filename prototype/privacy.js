(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.OpenFHSPrivacy=api;})(globalThis,()=>{
  'use strict';
  const VERSION='privacy-preferences-v1';
  const PURPOSES=['research','training','public'];
  const TEXT='Optional future-use preferences for this fictional diary only. Separate choices cover research, model training, and public sharing of this cat’s records or this individual video. No upload, enrollment, public release, or commercial-use permission is created. Changes apply to the local eligibility lists immediately.';
  function current(state,scope,id){return state.privacy?.decisions?.find(r=>r.scope===scope&&r.subject_id===id)?.choices||{research:false,training:false,public:false};}
  function set(state,scope,id,choices,now=new Date().toISOString()){
    if(!['cat','video'].includes(scope)||!id)throw Error('Choose a valid privacy subject.');
    if(scope==='cat'&&!state.animals.some(a=>a.id===id))throw Error('Cat not found.');
    for(const key of PURPOSES)if(typeof choices[key]!=='boolean')throw Error('Each purpose needs an explicit choice.');
    const next=JSON.parse(JSON.stringify(state));
    next.privacy ||= {version:VERSION,decisions:[],history:[]};
    const previous={...current(next,scope,id)}, clean=Object.fromEntries(PURPOSES.map(k=>[k,choices[k]]));
    next.privacy.decisions=next.privacy.decisions.filter(r=>!(r.scope===scope&&r.subject_id===id));
    next.privacy.decisions.push({scope,subject_id:id,choices:clean,updated_at:now,policy_version:VERSION});
    next.privacy.history.push({scope,subject_id:id,previous,choices:clean,changed_at:now,policy_version:VERSION,text:TEXT});
    return next;
  }
  function organized(state,media){
    return Object.fromEntries(PURPOSES.map(purpose=>[purpose,{
      cats:state.animals.filter(a=>current(state,'cat',a.id)[purpose]===true),
      videos:media.filter(v=>v.consent?.local_storage===true&&state.animals.some(a=>a.id===v.animal_id)&&current(state,'cat',v.animal_id)[purpose]===true&&current(state,'video',v.id)[purpose]===true)
    }]));
  }
  return {VERSION,PURPOSES,TEXT,current,set,organized};
});
