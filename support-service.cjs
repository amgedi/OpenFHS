'use strict';
// Optional pilot service. Secrets stay on the server; never bundle them in the EXE.
const {createHash}=require('node:crypto');
const F=require('./prototype/features.js');
function createSupportService({apiKey='',sender='',origin='',fetchImpl=fetch,now=Date.now}={}){
 const enabled=!!(apiKey&&sender&&origin), attempts=new Map(),requests=new Map();
 async function send(key,to,subject,text,replyTo){
  const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify({from:sender,to:[to],subject,text,...(replyTo?{reply_to:replyTo}:{})}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('Support delivery is temporarily unavailable. Keep your report and retry later.');
  const result=await response.json();if(typeof result.id!=='string'||!result.id)throw Error('The mail service did not confirm acceptance.');
 }
 return {enabled,async submit(body,{requestOrigin,address='unknown'}={}){
  if(!enabled)return {status:503,body:{error:'In-app sending is not connected yet. You can download your report or open an email draft.'}};
  if(requestOrigin!==origin)return {status:403,body:{error:'This support request did not come from the configured app.'}};
  let report,email;
  try{if(!body||typeof body!=='object'||body.consent!==true||!/^[-a-zA-Z0-9]{16,80}$/.test(body.requestId||''))throw Error('Review your report and agree to send it first.');report=F.supportReport(body);email=F.supportEmail(body.email);if(!email)throw Error('Enter a reply email address.');}catch(error){return {status:400,body:{error:error.message}};}
  const time=now();for(const [key,value]of attempts)if(value.until<=time)attempts.delete(key);for(const [key,value]of requests)if(value.until<=time)requests.delete(key);
  const fingerprint=createHash('sha256').update(report).digest('hex');
  const existing=requests.get(body.requestId);
  if(existing){if(existing.fingerprint!==fingerprint)return {status:409,body:{error:'This report changed. Review it again before sending.'}};return existing.result;}
  const rateKeys=['ip:'+address,'email:'+createHash('sha256').update(email.toLowerCase()).digest('hex'),'global'];
  const rates=rateKeys.map(key=>attempts.get(key)||{count:0,until:time+3600000});
  if(rates.some((rate,i)=>rate.count>=(i===2?50:5))||requests.size>=500)return {status:429,body:{error:'Too many support attempts. Keep your report and try again later.'}};
  rates.forEach((rate,i)=>{rate.count++;attempts.set(rateKeys[i],rate);});
  const reference='FHS-'+body.requestId;
  const result=(async()=>{try{
   await send(reference+'-report','openfhs@gmail.com','OpenFHS support '+reference+': '+body.kind,report,email);
   let receiptQueued=false;
   try{await send(reference+'-receipt',email,'We received your OpenFHS support request',`Thank you for contacting OpenFHS. Your request has been accepted by our support mail service.\n\nReference: ${reference}\n\nA person has not reviewed it yet. We are a small volunteer project, so replies may take time. You can reply to this email with a correction or follow-up.\n\nDo not send passwords, recovery phrases, private diary backups, or videos. This inbox is not monitored for urgent veterinary care.\n\nOpenFHS\nopenfhs@gmail.com`,'openfhs@gmail.com');receiptQueued=true;}catch{}
   return {status:202,body:{accepted:true,reference,receiptQueued}};
  }catch(error){requests.delete(body.requestId);return {status:502,body:{error:error.message}};}})();
  requests.set(body.requestId,{fingerprint,result,until:time+86400000});
  return result;
 }};
}
module.exports={createSupportService};
