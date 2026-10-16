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
      .join("");
  return div;
};
legende.addTo(carte);

const statutsCoches = new Set(Object.keys(STATUTS));
let projetChoisi = "";
let envieMin = 0;
let equipementChoisi = "";
const points = []; // { voie, marqueur }

function correspondAuxFiltres(voie) {
  if (!statutsCoches.has(voie.statut)) return false;
  if (envieMin && !((voie.envie || 0) >= envieMin)) return false;
  if (equipementChoisi && voie.equipement !== equipementChoisi) return false;
  if (projetChoisi === SANS_PROJET) return !voie.projet;
  if (projetChoisi) return voie.projet === projetChoisi;
  return true;
}

function appliquerFiltres() {
  for (const { voie, marqueur } of points) {
    if (correspondAuxFiltres(voie)) marqueur.addTo(carte);
    else marqueur.remove();
  }
}

function resume(voie) {
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
    const visibles = points.filter((p) => correspondAuxFiltres(p.voie)).map((p) => p.marqueur.getLatLng());
    if (projetChoisi && visibles.length) carte.fitBounds(L.latLngBounds(visibles), { padding: [40, 40], maxZoom: 13 });
    else if (!projetChoisi) carte.setView([45.55, 6.2], 8);
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
      const couleur = STATUTS[voie.statut]?.couleur || "#777";
      // Couleur = statut, forme = type d'équipement (rond, losange, triangle).
      const icone = L.divIcon({
        className: "point-voie",
        html: formeSVG(voie.equipement, couleur),
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
