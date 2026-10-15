// Page d'accueil : carte des voies avec filtres par statut et par projet.

const SANS_PROJET = "__aucun__";

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
L.control.layers(fonds, null, { position: "topright" }).addTo(carte);

// Légende des couleurs
const legende = L.control({ position: "bottomleft" });
legende.onAdd = () => {
  const div = L.DomUtil.create("div", "legende");
  div.innerHTML = Object.values(STATUTS)
    .map((s) => `<div><span class="pastille" style="background:${s.couleur}"></span>${echapper(s.libelle)}</div>`)
    .join("");
  return div;
};
legende.addTo(carte);

const statutsCoches = new Set(Object.keys(STATUTS));
let projetChoisi = "";
const points = []; // { voie, marqueur }

function correspondAuxFiltres(voie) {
  if (!statutsCoches.has(voie.statut)) return false;
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
    ${badgeStatut(voie.statut)}
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

  const select = document.getElementById("filtre-projet");
  const projets = [...new Set(voies.map((v) => v.projet).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  for (const p of projets) select.add(new Option(p, p));
  select.add(new Option("Sans projet", SANS_PROJET));
  select.addEventListener("change", () => {
    projetChoisi = select.value;
    appliquerFiltres();
  });
}

chargerVoies()
  .then((voies) => {
    construireFiltres(voies);
    for (const voie of voies) {
      const c = voie.coordonnees;
      if (!c || c.lat == null || c.lon == null) continue;
      const couleur = STATUTS[voie.statut]?.couleur || "#777";
      const marqueur = L.circleMarker([c.lat, c.lon], {
        radius: 9,
        color: "#fff",
        weight: 2,
        fillColor: couleur,
        fillOpacity: 0.95,
      }).bindPopup(resume(voie));
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
