const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createSupportService}=require('../support-service.cjs');
const config={apiKey:'test-key-not-real',sender:'Support <support@example.org>',origin:'https://example.org'};
const input=()=>({requestId:crypto.randomUUID(),kind:'Something is broken',area:'Not sure',email:'tester@example.org',detail:'Fictional button issue',consent:true});
const meta={requestOrigin:config.origin,address:'test-client'};
test('support stays disabled without credentials and rejects cross-origin requests',async()=>{
 assert.equal((await createSupportService().submit(input(),meta)).status,503);
 const service=createSupportService({...config,fetchImpl:()=>{throw Error('must not send');}});
 assert.equal((await service.submit(input(),{...meta,requestOrigin:'https://other.example'})).status,403);
 assert.equal((await service.submit({...input(),email:'a@example.org\r\nBcc: b@example.org'},meta)).status,400);
 assert.equal((await service.submit({...input(),consent:false},meta)).status,400);
});
test('support sends fixed-destination report and safe receipt only once for concurrent retries',async()=>{
 const sent=[];const service=createSupportService({...config,fetchImpl:async(url,options)=>{sent.push(JSON.parse(options.body));return {ok:true,json:async()=>({id:'provider-id'})};}});
 const body=input();const results=await Promise.all([service.submit(body,meta),service.submit(body,meta)]);
 assert.equal(results[0].status,202);assert.equal(results[1].body.reference,results[0].body.reference);
 assert.equal(sent.length,2);assert.deepEqual(sent[0].to,['openfhs@gmail.com']);assert.equal(sent[0].reply_to,body.email);
 assert.deepEqual(sent[1].to,[body.email]);assert.doesNotMatch(sent[1].text,/Fictional button issue/);
 assert.equal((await service.submit({...body,detail:'changed'},meta)).status,409);
});
test('support never claims acceptance on provider failure and preserves accepted report when receipt fails',async()=>{
 const failed=createSupportService({...config,fetchImpl:async()=>({ok:false})});
 assert.equal((await failed.submit(input(),meta)).status,502);
 let calls=0;const partial=createSupportService({...config,fetchImpl:async()=>++calls===1?{ok:true,json:async()=>({id:'report-id'})}:{ok:false}});
 const result=await partial.submit(input(),meta);assert.equal(result.status,202);assert.equal(result.body.receiptQueued,false);
});
test('support limits receipt abuse across different client addresses',async()=>{
 const service=createSupportService({...config,fetchImpl:async()=>({ok:true,json:async()=>({id:'id'})})});
 for(let i=0;i<5;i++)assert.equal((await service.submit(input(),{...meta,address:'client-'+i})).status,202);
 assert.equal((await service.submit(input(),{...meta,address:'another-client'})).status,429);
});
