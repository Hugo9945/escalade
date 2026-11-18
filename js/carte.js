// Page d'accueil : carte des voies avec filtres par statut et par projet.

const SANS_PROJET = "__aucun__";

// Sur téléphone, les filtres sont repliés au départ pour laisser la place à la carte.
if (window.matchMedia("(max-width: 700px)").matches) document.getElementById("filtres").open = false;

const carte = L.map("carte").setView([45.55, 6.2], 8); // Alpes du Nord

const fonds = {
  "OpenTopoMap": L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
    maxZoom: 17,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
  }),
  "Plan IGN": L.tileLayer(
    "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    { maxZoom: 19, attribution: '© <a href="https://www.ign.fr">IGN</a>' }
  ),
};
fonds["OpenTopoMap"].addTo(carte);

// Recalcule la taille de la carte quand sa zone change (filtres sur plusieurs lignes, rotation du téléphone…).
new ResizeObserver(() => carte.invalidateSize()).observe(document.getElementById("carte"));
L.control.layers(fonds, null, { position: "topright" }).addTo(carte);

// Légende des couleurs
const legende = L.control({ position: "bottomleft" });
legende.onAdd = () => {
  const div = L.DomUtil.create("div", "legende");
  div.innerHTML =
    Object.values(STATUTS)
      .map((s) => `<div><span class="pastille" style="background:${s.couleur}"></span>${echapper(s.libelle)}</div>`)
      .join("") +
    `<hr>` +
    Object.entries(EQUIPEMENTS)
      .map(([cle, e]) => `<div>${formeSVG(cle, "#8a8f8b", 14)}${echapper(e.libelle)}</div>`)
      .join("") +
    `<div>${formeSVG("couenne", COULEUR_COUENNE, 14)}Site de couenne</div>`;
  return div;
};
legende.addTo(carte);

const statutsCoches = new Set(Object.keys(STATUTS));
let projetChoisi = "";
let envieMin = 0;
let equipementChoisi = "";
let recherche = "";
let zoneChoisie = "";
let cotationMax = null;
let orientationChoisie = "";
let dureeChoisie = "";
let typeChoisi = ""; // "" / "gv" / "couenne"
const points = []; // { voie, marqueur }

/* ---------- Outils pour les nouveaux filtres ---------- */

// Texte sans accents ni majuscules, pour la recherche.
function simplifier(texte) {
  return String(texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Zone = massif sans la précision entre parenthèses, tirets harmonisés (« Écrins (Hautes-Alpes) » → « Écrins »).
function zoneDe(voie) {
  return String(voie.massif || "").replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+[–-]\s+/g, " – ").trim();
}

// Cotation française → nombre comparable (4a = 3, 4b = 4, 4c = 5, 5a = 6…). « 5 » seul compte comme 5a.
function valeurCotation(texte) {
  const m = String(texte || "").match(/\b([3-9])([abc])?(\+)?/);
  if (!m) return null;
  return (Number(m[1]) - 3) * 3 + (m[2] ? "abc".indexOf(m[2]) : 0) + (m[3] ? 0.5 : 0);
}

// Orientations de la voie, ramenées à N / E / S / O (une voie NE compte pour le Nord et pour l'Est).
function orientationsDe(voie) {
  const texte = String(voie.orientation || "").replace(/Ouest/gi, "W").replace(/\bEst\b/gi, "E").replace(/Nord/gi, "N").replace(/\bSud\b/gi, "S");
  const lettres = new Set();
  for (const mot of texte.match(/\b[NSEWO]{1,3}\b/g) || []) for (const l of mot) lettres.add(l === "W" ? "O" : l);
  return lettres;
}

// Durée : « demi » (½ journée), « jour » (1 jour), « plusieurs » (2 jours et plus), ou "" si inconnue.
function dureeDe(voie) {
  const d = String(voie.duree || "").toLowerCase();
  if (/^1\/2|^demi/.test(d)) return "demi";
  if (/\b[23] jours|à [23] jours/.test(d)) return "plusieurs";
  if (/jour/.test(d)) return "jour";
  return "";
}

/* ---------- Filtre météo (prévisions Open-Meteo pour toutes les voies d'un coup) ---------- */
let meteoJour = ""; // date "AAAA-MM-JJ" choisie, ou "" (pas de filtre)
let meteoCondition = "beau"; // beau / sec / toutes
let meteoVeille = false; // exiger aussi une veille sans pluie
let meteoDonnees = null; // { "lat,lon": { time:[], code:[], pluie:[], tmax:[], tmin:[] } }
let meteoChargement = null;

const cleCoord = (c) => `${c.lat},${c.lon}`;

async function chargerMeteoToutes() {
  if (meteoDonnees) return meteoDonnees;
  if (meteoChargement) return meteoChargement;
  const coords = [...new Map(points.map((p) => [cleCoord(p.voie.coordonnees), p.voie.coordonnees])).values()];
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: coords.map((c) => c.lat).join(","),
      longitude: coords.map((c) => c.lon).join(","),
      daily: "weather_code,precipitation_sum,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: 14,
      past_days: 1,
    });
  meteoChargement = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error();
      return r.json();
    })
    .then((rep) => {
      const liste = Array.isArray(rep) ? rep : [rep];
      meteoDonnees = {};
      coords.forEach((c, i) => {
        const d = liste[i]?.daily;
        if (d) meteoDonnees[cleCoord(c)] = { time: d.time, code: d.weather_code, pluie: d.precipitation_sum, tmax: d.temperature_2m_max, tmin: d.temperature_2m_min };
      });
      return meteoDonnees;
    })
    .finally(() => (meteoChargement = null));
  return meteoChargement;
}

// Météo d'une voie pour le jour choisi : { code, pluie, pluieVeille, tmax, tmin } ou null.
function meteoDe(voie) {
  if (!meteoJour || !meteoDonnees) return null;
  const d = meteoDonnees[cleCoord(voie.coordonnees)];
  if (!d) return null;
  const i = d.time.indexOf(meteoJour);
  if (i < 0) return null;
  return { code: d.code[i], pluie: d.pluie[i] ?? 0, pluieVeille: i > 0 ? d.pluie[i - 1] ?? 0 : null, tmax: d.tmax[i], tmin: d.tmin[i] };
}

// Beau : soleil ou peu nuageux, sans pluie. Sec : pas de pluie ni neige (nuages et brouillard acceptés).
function meteoConvient(m) {
  if (!m) return false;
  if (meteoVeille && m.pluieVeille !== null && m.pluieVeille >= 1) return false;
  if (meteoCondition === "beau") return m.code <= 2 && m.pluie < 0.5;
  if (meteoCondition === "sec") return m.code < 51 && m.pluie < 1;
  return true;
}

function pictoMeteo(code) {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫";
  if (code <= 67 || (code >= 80 && code <= 82)) return "🌧";
  if (code <= 77 || code === 85 || code === 86) return "🌨";
  return "⛈";
}

function correspondAuxFiltres(voie) {
  const couenne = estCouenne(voie);
  if (typeChoisi === "gv" && couenne) return false;
  if (typeChoisi === "couenne" && !couenne) return false;
  if (!couenne && !statutsCoches.has(voie.statut)) return false;
  if (meteoJour && meteoDonnees && !meteoConvient(meteoDe(voie))) return false;
  if (envieMin && !((voie.envie || 0) >= envieMin)) return false;
  if (equipementChoisi && voie.equipement !== equipementChoisi) return false;
  if (projetChoisi === SANS_PROJET && voie.projet) return false;
  if (projetChoisi && projetChoisi !== SANS_PROJET && voie.projet !== projetChoisi) return false;
  if (zoneChoisie && zoneDe(voie) !== zoneChoisie) return false;
  if (cotationMax !== null) {
    const v = valeurCotation(couenne ? voie.cotations : voie.cotation_libre_max); // couenne : la plus facile du site
    if (v === null || v > cotationMax) return false;
  }
  if (orientationChoisie && !orientationsDe(voie).has(orientationChoisie)) return false;
  if (dureeChoisie && dureeDe(voie) !== dureeChoisie) return false;
  if (recherche) {
    const texte = simplifier([voie.nom, voie.secteur, voie.massif, voie.sous_titre].join(" "));
    if (!recherche.split(/\s+/).every((mot) => texte.includes(mot))) return false;
  }
  return true;
}

function appliquerFiltres() {
  let nb = 0;
  for (const { voie, marqueur } of points) {
    if (correspondAuxFiltres(voie)) {
      marqueur.addTo(carte);
      nb++;
    } else marqueur.remove();
  }
  let texte = `${nb} voie${nb > 1 ? "s" : ""} affichée${nb > 1 ? "s" : ""}`;
  if (meteoJour && meteoDonnees && meteoCondition !== "toutes") {
    texte = `${nb} voie${nb > 1 ? "s" : ""} ${meteoCondition === "beau" ? "au beau" : "au sec"} ${nomJour(meteoJour)}`;
  }
  document.getElementById("nb-visibles").textContent = texte;
  // Nombre de menus réglés dans « Plus de filtres » (pour ne pas oublier un filtre actif quand c'est replié).
  const actifs = [typeChoisi, equipementChoisi, envieMin, projetChoisi, zoneChoisie, cotationMax !== null, orientationChoisie, dureeChoisie, meteoJour].filter(Boolean).length;
  document.getElementById("nb-filtres-actifs").textContent = actifs ? String(actifs) : "";
}

// Cadre la carte sur les voies affichées.
function cadrerSurVisibles() {
  const visibles = points.filter((p) => correspondAuxFiltres(p.voie)).map((p) => p.marqueur.getLatLng());
  if (visibles.length) carte.fitBounds(L.latLngBounds(visibles), { padding: [40, 40], maxZoom: 13 });
}

// « samedi 22 » ; « aujourd'hui » / « demain » pour les deux premiers jours.
function nomJour(date) {
  const auj = new Date();
  const d = new Date(date + "T12:00");
  const ecart = Math.round((d - new Date(auj.getFullYear(), auj.getMonth(), auj.getDate(), 12)) / 86400000);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" });
}

function lignePopupMeteo(voie) {
  const m = meteoDe(voie);
  if (!m) return "";
  return `<p class="meteo-popup">${pictoMeteo(m.code)} ${echapper(nomJour(meteoJour))} : ${Math.round(m.tmax)}° / ${Math.round(m.tmin)}°, pluie ${m.pluie ? m.pluie.toFixed(1) : 0} mm${m.pluieVeille >= 1 ? ` (veille : ${m.pluieVeille.toFixed(1)} mm)` : ""}</p>`;
}

// Met à jour le contenu des bulles (après chargement ou changement de jour météo).
function rafraichirBulles() {
  for (const { voie, marqueur } of points) marqueur.setPopupContent(resume(voie));
}

function resumeCouenne(voie) {
  const lignes = [
    voie.nb_voies && `Voies : ${voie.nb_voies}`,
    voie.cotations && `Cotations : ${voie.cotations}`,
    voie.hauteur && `Hauteur : ${voie.hauteur}`,
    voie.orientation && `Orientation : ${voie.orientation}`,
  ].filter(Boolean);
  return `<div class="popup">
    <h3>${echapper(voie.nom)}</h3>
    ${badgeCouenne()}
    ${lignes.map((l) => `<p>${echapper(l)}</p>`).join("")}
    ${lignePopupMeteo(voie)}
    <a class="lien-fiche" href="${lienVoie(voie)}">Voir la fiche complète →</a>
  </div>`;
}

function resume(voie) {
  if (estCouenne(voie)) return resumeCouenne(voie);
  const lignes = [
    voie.cotation_globale && `Cotation : ${voie.cotation_globale}`,
    voie.cotation_libre_max && `Libre max : ${voie.cotation_libre_max}`,
    voie.hauteur && `Hauteur : ${voie.hauteur}`,
  ].filter(Boolean);
  return `<div class="popup">
    <h3>${echapper(voie.nom)}</h3>
    ${voie.envie ? `<p class="envie-popup">${etoiles(voie.envie)} ${echapper(ENVIES[voie.envie])}</p>` : ""}
    ${badgeStatut(voie.statut)}
    ${blocSuggestion(voie)}
    <p class="equipement-popup">${formeSVG(voie.equipement, STATUTS[voie.statut]?.couleur || "#777", 14)} Équipement : ${echapper(texteEquipement(voie))}</p>
    ${lignes.map((l) => `<p>${echapper(l)}</p>`).join("")}
    ${lignePopupMeteo(voie)}
    <a class="lien-fiche" href="${lienVoie(voie)}">Voir la fiche complète →</a>
  </div>`;
}

function construireFiltres(voies) {
  const zone = document.getElementById("filtre-statuts");
  for (const [cle, s] of Object.entries(STATUTS)) {
    const nb = voies.filter((v) => v.statut === cle).length;
    const label = document.createElement("label");
    label.className = "filtre-statut";
    label.style.setProperty("--c", s.couleur);
    label.innerHTML = `<input type="checkbox" checked><span class="pastille"></span>${echapper(s.libelle)} <span class="nb">(${nb})</span>`;
    label.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) statutsCoches.add(cle);
      else statutsCoches.delete(cle);
      appliquerFiltres();
    });
    zone.appendChild(label);
  }

  document.getElementById("filtre-equipement").addEventListener("change", (e) => {
    equipementChoisi = e.target.value;
    appliquerFiltres();
  });

  document.getElementById("filtre-envie").addEventListener("change", (e) => {
    envieMin = Number(e.target.value);
    appliquerFiltres();
  });

  const select = document.getElementById("filtre-projet");
  const projets = [...new Set(voies.map((v) => v.projet).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  for (const p of projets) select.add(new Option(p, p));
  select.add(new Option("Sans projet", SANS_PROJET));
  select.addEventListener("change", () => {
    projetChoisi = select.value;
    appliquerFiltres();
    // Un projet choisi : on cadre la carte sur ses voies ; « Tous » : retour aux Alpes du Nord.
    if (projetChoisi) cadrerSurVisibles();
    else carte.setView([45.55, 6.2], 8);
  });

  // Zone : construite à partir des massifs des voies.
  const choixZone = document.getElementById("filtre-zone");
  const zones = [...new Set(voies.map(zoneDe).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  for (const z of zones) choixZone.add(new Option(`${z} (${voies.filter((v) => zoneDe(v) === z).length})`, z));
  choixZone.addEventListener("change", () => {
    zoneChoisie = choixZone.value;
    appliquerFiltres();
    if (zoneChoisie) cadrerSurVisibles();
  });

  document.getElementById("filtre-type").addEventListener("change", (e) => {
    typeChoisi = e.target.value;
    appliquerFiltres();
  });
  document.getElementById("filtre-cotation").addEventListener("change", (e) => {
    cotationMax = e.target.value ? valeurCotation(e.target.value) : null;
    appliquerFiltres();
  });
  document.getElementById("filtre-orientation").addEventListener("change", (e) => {
    orientationChoisie = e.target.value;
    appliquerFiltres();
  });
  document.getElementById("filtre-duree").addEventListener("change", (e) => {
    dureeChoisie = e.target.value;
    appliquerFiltres();
  });

  // Météo : choix du jour (aujourd'hui + 13 jours), de la condition, et « sec depuis 24 h ».
  const choixJour = document.getElementById("filtre-meteo-jour");
  const choixCondition = document.getElementById("filtre-meteo-condition");
  const caseVeille = document.getElementById("filtre-meteo-veille");
  const etat = document.getElementById("meteo-etat");
  const auj = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(auj.getFullYear(), auj.getMonth(), auj.getDate() + i, 12);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const libelle = i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    choixJour.add(new Option(i >= 7 ? `${libelle} (indicatif)` : libelle, iso));
  }
  async function majMeteo() {
    meteoJour = choixJour.value;
    meteoCondition = choixCondition.value;
    meteoVeille = caseVeille.checked;
    choixCondition.disabled = caseVeille.disabled = !meteoJour;
    if (meteoJour && !meteoDonnees) {
      etat.textContent = "Chargement de la météo…";
      try {
        await chargerMeteoToutes();
        etat.textContent = "";
      } catch (e) {
        etat.textContent = "Météo indisponible (pas de connexion ?)";
      }
    }
    rafraichirBulles();
    appliquerFiltres();
  }
  choixJour.addEventListener("change", majMeteo);
  choixCondition.addEventListener("change", majMeteo);
  caseVeille.addEventListener("change", majMeteo);

  // Recherche : filtre en direct ; Entrée cadre la carte sur les résultats.
  const champ = document.getElementById("filtre-recherche");
  champ.addEventListener("input", () => {
    recherche = simplifier(champ.value).trim();
    appliquerFiltres();
  });
  champ.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      cadrerSurVisibles();
      champ.blur();
    }
  });
}

chargerVoies()
  .then((voies) => {
    construireFiltres(voies);
    // Les voies les plus désirées sont ajoutées en dernier : elles passent au-dessus des autres.
    const ordre = [...voies].sort((a, b) => (a.envie || 0) - (b.envie || 0));
    // Plusieurs voies au même point exact (point général d'un secteur sur Camptocamp) :
    // on les écarte un peu en cercle, pour l'affichage seulement, afin de toutes les voir.
    const memePoint = {};
    for (const v of voies) {
      const c = v.coordonnees;
      if (c && c.lat != null) (memePoint[`${c.lat},${c.lon}`] ||= []).push(v.id);
    }
    for (const voie of ordre) {
      const c0 = voie.coordonnees;
      if (!c0 || c0.lat == null || c0.lon == null) continue;
      const groupe = memePoint[`${c0.lat},${c0.lon}`];
      let c = c0;
      if (groupe.length > 1) {
        const angle = (2 * Math.PI * groupe.indexOf(voie.id)) / groupe.length;
        c = { lat: c0.lat + 0.0025 * Math.cos(angle), lon: c0.lon + 0.0032 * Math.sin(angle) };
      }
      const couleur = estCouenne(voie) ? COULEUR_COUENNE : STATUTS[voie.statut]?.couleur || "#777";
      // Couleur = statut, forme = type d'équipement (rond, losange, triangle) ; carré brun = site de couenne.
      const icone = L.divIcon({
        className: "point-voie",
        html: formeSVG(estCouenne(voie) ? "couenne" : voie.equipement, couleur),
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -10],
      });
      const marqueur = L.marker([c.lat, c.lon], { icon: icone, title: voie.nom, zIndexOffset: 100 * (voie.envie || 0) }).bindPopup(resume(voie), { maxWidth: Math.min(260, window.innerWidth - 80), autoPanPadding: [24, 24] });
      points.push({ voie, marqueur });
    }
    appliquerFiltres();

    // Lien « voir sur la carte » depuis une fiche : index.html?voie=identifiant
    const demande = new URLSearchParams(location.search).get("voie");
    const cible = points.find((p) => p.voie.id === demande);
    if (cible) {
      carte.setView(cible.marqueur.getLatLng(), 14);
      cible.marqueur.openPopup();
    }
  })
  .catch((e) => {
    const zone = document.querySelector(".filtres");
    zone.insertAdjacentHTML("afterend", `<p class="erreur">${echapper(e.message)}</p>`);
  });
