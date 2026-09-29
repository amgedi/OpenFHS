/* Files never leave this browser. Metadata and bytes commit in one transaction. */
window.OpenFHSMedia = (() => {
  const DB_NAME = 'openfhs-practice-videos-v1';
  let connection;
  async function db() {
    if (connection) return connection;
    connection = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('videos', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Video storage is unavailable in this browser. Try a regular browser window.'));
      request.onblocked = () => reject(new Error('Close other OpenFHS tabs and try again.'));
    });
    connection.onversionchange = () => { connection.close(); connection = null; };
    return connection;
  }
  async function transaction(mode, operation) {
    const database = await db();
    return new Promise((resolve, reject) => {
      const tx = database.transaction('videos', mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(new Error('Video storage could not complete. Your file has not been removed from your computer. Check available space and try again.'));
      try {
        const request = operation(tx.objectStore('videos'));
        request.onsuccess = () => { result = request.result; };
      } catch(error) {
        // A synchronous clone/key error must abort earlier queued writes too.
        try { tx.abort(); } catch { /* The transaction may already be inactive. */ }
        reject(error);
      }
    });
  }
  async function list() {
    return (await transaction('readonly', store => store.getAll())).map(({ blob, ...metadata }) => metadata);
  }
  async function add(file, options) {
    const metadata = OpenFHSFeatures.mediaRecord(file, { ...options, id: crypto.randomUUID() });
    await transaction('readwrite', store => store.add({ ...metadata, blob: file }));
    return metadata;
  }
  async function get(id) { return transaction('readonly', store => store.get(id)); }
  async function remove(id) { await transaction('readwrite', store => store.delete(id)); }
  async function sample() {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported('video/webm')) throw new Error('This browser cannot create the sample clip. Choose a practice file instead.');
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 270;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(12); const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    return new Promise((resolve, reject) => {
      const chunks = []; let frame = 0;
      const draw = () => { context.fillStyle = '#e7eee0'; context.fillRect(0, 0, 480, 270); context.fillStyle = '#24594d'; context.font = '24px sans-serif'; context.fillText('OpenFHS · fictional sample', 60, 75); context.font = '16px sans-serif'; context.fillText('No animals or people were recorded.', 60, 108); context.beginPath(); context.arc(80 + (frame % 24) * 13, 185, 15, 0, Math.PI * 2); context.fill(); frame++; };
      draw(); const animation = setInterval(draw, 80);
      const stop = setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 2000);
      const cleanup = () => { clearInterval(animation); clearTimeout(stop); stream.getTracks().forEach(track => track.stop()); };
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { cleanup(); reject(new Error('The sample clip could not be created.')); };
      recorder.onstop = () => { cleanup(); resolve(new File(chunks, 'openfhs-fictional-sample.webm', { type: 'video/webm' })); };
      try { recorder.start(); } catch { cleanup(); reject(new Error('This browser cannot record the sample animation.')); }
    });
  }
  async function addBatch(files) { if(!files.length)return; await transaction('readwrite',store=>{let request;for(const file of files)request=store.add(file);return request;}); }
  async function removeBatch(ids) { if(!ids.length)return; await transaction('readwrite',store=>{let request;for(const id of ids)request=store.delete(id);return request;}); }
  return { list, add, get, remove, sample, addBatch, removeBatch };
})();
