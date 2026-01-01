// App-Hülle offline verfügbar halten; alles immer zuerst frisch aus dem Netz holen –
// am HTTP-Zwischenspeicher vorbei (GitHub Pages cacht sonst bis zu 10 Minuten die alte Version).
const CACHE = "lifehub-v25";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/h/")) return; // PDFs & fremde Seiten nicht anfassen
  if (url.searchParams.has("t")) return; // Daten-Abrufe mit Zeitstempel nicht speichern (sonst wächst der Speicher endlos; offline gilt lh_data)
  e.respondWith(
    fetch(url.href, {cache: "no-cache", credentials: "same-origin"})
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
