// Onglet Météo : carte Windy intégrée (gratuite), avec choix de la couche et de la zone.
// Windy fournit les prévisions (modèle ECMWF) ; la frise du bas permet de faire défiler les jours.

const COUCHES = [
  { cle: "rain", libelle: "🌧 Pluie" },
  { cle: "clouds", libelle: "☁️ Nuages" },
  { cle: "temp", libelle: "🌡 Température" },
  { cle: "wind", libelle: "💨 Vent" },
  { cle: "snowAccu", libelle: "❄️ Nouvelle neige" },
];

// Zones où se trouvent nos voies (centre de la carte et zoom).
const ZONES = [
  { nom: "France", lat: 46.4, lon: 2.6, zoom: 5 },
  { nom: "Alpes", lat: 45.6, lon: 7.0, zoom: 6 },
  { nom: "Écrins – Briançonnais", lat: 44.92, lon: 6.45, zoom: 9 },
  { nom: "Suisse", lat: 46.75, lon: 8.2, zoom: 7 },
  { nom: "Massif central", lat: 45.5, lon: 2.9, zoom: 7 },
  { nom: "Provence – Calanques", lat: 43.6, lon: 5.5, zoom: 7 },
  { nom: "Pyrénées", lat: 42.7, lon: 1.0, zoom: 7 },
  { nom: "Maroc", lat: 31.5, lon: -6.5, zoom: 6 },
  { nom: "Europe", lat: 46.0, lon: 8.0, zoom: 4 },
];

const MEMOIRE = "sac-a-topos-meteo";
let reglages = { couche: "rain", zone: "Alpes" };
try {
  Object.assign(reglages, JSON.parse(localStorage.getItem(MEMOIRE) || "{}"));
} catch (e) {}

const cadre = document.getElementById("meteo-carte");
const champCouches = document.getElementById("meteo-couches");
const choixZone = document.getElementById("meteo-zone");
const lienWindy = document.getElementById("meteo-windy");

function zoneActuelle() {
  return ZONES.find((z) => z.nom === reglages.zone) || ZONES[1];
}

function afficher() {
  const z = zoneActuelle();
  const params = new URLSearchParams({
    type: "map",
    location: "coordinates",
    metricRain: "mm",
    metricTemp: "°C",
    metricWind: "km/h",
    zoom: z.zoom,
    overlay: reglages.couche,
    product: "ecmwf",
    level: "surface",
    lat: z.lat,
    lon: z.lon,
    message: "true",
  });
  cadre.src = "https://embed.windy.com/embed.html?" + params.toString();
  lienWindy.href = `https://www.windy.com/?${reglages.couche},${z.lat},${z.lon},${z.zoom}`;
  champCouches.querySelectorAll("button").forEach((b) => b.classList.toggle("actif", b.dataset.cle === reglages.couche));
  try {
    localStorage.setItem(MEMOIRE, JSON.stringify(reglages));
  } catch (e) {}
}

COUCHES.forEach((c) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "filtre-statut meteo-couche";
  b.dataset.cle = c.cle;
  b.textContent = c.libelle;
  b.addEventListener("click", () => {
    reglages.couche = c.cle;
    afficher();
  });
  champCouches.appendChild(b);
});

ZONES.forEach((z) => {
  const o = document.createElement("option");
  o.value = z.nom;
  o.textContent = z.nom;
  choixZone.appendChild(o);
});
choixZone.value = zoneActuelle().nom;
choixZone.addEventListener("change", () => {
  reglages.zone = choixZone.value;
  afficher();
});

afficher();
