const CACHE='pmp-v6-sim-v2.7-matching-voiceover-order';
const ASSETS=['./','./index.html','./styles.css?v=0.2.7','./matching-a11y.css?v=0.2.7','./core.js?v=0.2.7','./demo-data.js?v=0.2.7','./app.js?v=0.2.7','./matching-ui.js?v=0.2.7','./accessibility-fixes.js?v=0.2.7','./manifest.webmanifest?v=0.2.7','./icon-192.svg','./icon-512.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(response=>{
      if(response&&response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(c=>c.put(e.request,copy));
      }
      return response;
    }).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):undefined)))
  );
});
