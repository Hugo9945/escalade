// Mode hors connexion (« service worker ») : garde une copie du site sur l'appareil.
// - Pages, scripts, styles, données : réseau d'abord (pour avoir les dernières mises à jour),
//   copie enregistrée si pas de réseau ou réseau trop lent (plus de 4 s).
// - Images des voies : préchargées une fois, puis servies depuis la copie.
// - Fonds de carte : les dalles déjà vues sont gardées (jusqu'à environ 4000).
// Changer VERSION seulement si on veut forcer l'effacement des anciennes copies.

const VERSION = "v1";
const SITE = `site-${VERSION}`;
const TUILES = `tuiles-${VERSION}`;
const MAX_TUILES = 4000;

const ESSENTIEL = [
  "./",
  "index.html",
  "voie.html",
  "projets.html",
  "materiel.html",
  "meteo.html",
  "css/style.css",
  "js/commun.js",
  "js/carte.js",
  "js/voie.js",
  "js/projets.js",
  "js/materiel.js",
  "js/meteo.js",
  "js/verrou.js",
  "js/hors-ligne.js",
  "data/voies.json",
  "data/projets.json",
  "data/materiel.json",
  "apple-touch-icon.png",
  "manifest.webmanifest",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SITE)
      .then((c) => Promise.all(ESSENTIEL.map((u) => c.add(new Request(u, { cache: "reload" })).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((k) => k !== SITE && k !== TUILES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Préchargement de toutes les images des fiches (demandé par la page une fois chargée).
async function prechargerImages() {
  const c = await caches.open(SITE);
  let voies = [];
  try {
    voies = await (await fetch("data/voies.json")).json();
  } catch (e) {
    return;
  }
  const fichiers = [...new Set(voies.flatMap((v) => (v.images || []).map((im) => im.fichier)))];
  for (const f of fichiers) {
    if (await c.match(f)) continue;
    try {
      const r = await fetch(f);
      if (r.ok) await c.put(f, r);
    } catch (e) {}
  }
}

self.addEventListener("message", (e) => {
  if (e.data === "precharger") e.waitUntil(prechargerImages());
});

function estTuile(url) {
  return url.hostname.endsWith("tile.opentopomap.org") || url.hostname === "data.geopf.fr";
}

async function limiterTuiles() {
  const c = await caches.open(TUILES);
  const cles = await c.keys();
  for (let i = 0; i < cles.length - MAX_TUILES; i++) await c.delete(cles[i]);
}

// Réseau d'abord, avec un délai maximum ; sinon la copie (en ignorant ?v=… et ?id=…).
async function reseauDabord(req) {
  const c = await caches.open(SITE);
  const reseau = fetch(req).then((r) => {
    if (r.ok) c.put(req, r.clone());
    return r;
  });
  const delai = new Promise((res) => setTimeout(res, 4000));
  try {
    const r = await Promise.race([reseau, delai]);
    if (r) return r;
  } catch (e) {}
  const copie = (await c.match(req)) || (await c.match(req, { ignoreSearch: true }));
  if (copie) return copie;
  return reseau; // pas de copie : on attend quand même le réseau
}

// Copie d'abord (images, fonds de carte, polices) ; sinon réseau, puis on garde une copie.
async function copieDabord(req, nomCache) {
  const c = await caches.open(nomCache);
  const copie = await c.match(req, { ignoreSearch: nomCache === SITE });
  if (copie) return copie;
  const r = await fetch(req);
  if (r.ok || r.type === "opaque") {
    c.put(req, r.clone());
    if (nomCache === TUILES) limiterTuiles();
  }
  return r;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (estTuile(url)) return e.respondWith(copieDabord(req, TUILES));
  if (url.origin === location.origin) {
    if (url.pathname.includes("/images/")) return e.respondWith(copieDabord(req, SITE));
    return e.respondWith(reseauDabord(req));
  }
  if (url.hostname === "unpkg.com" || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    return e.respondWith(copieDabord(req, SITE));
  }
  // Le reste (Open-Meteo, Windy, Camptocamp…) passe normalement par le réseau.
});
