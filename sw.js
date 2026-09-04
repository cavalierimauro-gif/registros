/* ============================================================
   sw.js — Service worker de "Registros de Publicadores"
   Da funcionamiento offline garantizado.
   Estrategia: RED PRIMERO (para recibir actualizaciones cuando hay
   conexión) con RESPALDO A CACHÉ (para funcionar sin conexión).

   Actualizar la app: subís el nuevo index.html reemplazando el
   anterior; los usuarios online lo reciben en la siguiente carga.
   Si hacés un cambio grande y querés forzar la limpieza de caché en
   todos los dispositivos, cambiá "registros-v1" por "registros-v2"
   (y así sucesivamente) y volvé a subir este sw.js.
   ============================================================ */

const CACHE = "registros-v1";
const APP_SHELL = ["./", "./index.html"];

// Instalación: precargamos el "cascarón" de la app.
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activación: borramos versiones viejas de la caché.
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Búsquedas: red primero; si falla (offline), servimos desde la caché.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                 // solo lecturas
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // solo mismo origen

  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || caches.match("./index.html"))
      )
  );
});
