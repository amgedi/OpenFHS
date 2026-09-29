const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
test('a synchronous media batch error aborts previously queued writes',async()=>{
 let aborted=false,writes=0;
 const tx={objectStore:()=>({add:()=>{if(++writes===2)throw Error('DataCloneError');return {};}}),abort:()=>{aborted=true;}};
 const database={transaction:()=>tx};
 const indexedDB={open:()=>{const request={result:database};queueMicrotask(()=>request.onsuccess());return request;}};
 const context={window:{},indexedDB};vm.runInNewContext(fs.readFileSync('prototype/media.js','utf8'),context);
 await assert.rejects(()=>context.window.OpenFHSMedia.addBatch([{id:'one'},{id:'two'}]),/DataCloneError/);
 assert.equal(writes,2);assert.equal(aborted,true);
});
