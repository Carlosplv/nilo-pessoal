const CACHE='nilo-github-local-v2';
const FILES=['./','index.html','app.js','style.css','mobile.js','local-state.js','features.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','icon.svg'];
const URLS=FILES.map(p=>new URL(p,self.registration.scope).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS.map(url=>new Request(url,{cache:"reload"})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!URLS.includes(e.request.url))return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)))});
