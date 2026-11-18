// Fiche détaillée d'une voie (écran) + fiche A4 (impression).

const RAPPEL_SECURITE =
  "Rappel sécurité : aide-mémoire personnel, pas une garantie d'équipement ni de conditions. " +
  "Les points et les anneaux de corde peuvent changer : vérifier, remplacer une lunule douteuse, " +
  "et garder de quoi construire un relais.";

// En-tête de la 1re colonne : « L » si les lignes sont L1, L2…, sinon « Étape ».
function enteteNumero(lignes) {
  return lignes.every((l) => /^L\d/.test(l.n)) ? "L" : "Étape";
}

function tableauLongueurs(groupe, niveauTitre) {
  const lignes = groupe.lignes || [];
  const corps = lignes
    .map(
      (l) => `<tr>
        <td class="court">${echapper(l.n)}</td>
        <td class="court">${echapper(l.cotation || "-")}</td>
        <td class="court">${l.longueur != null ? echapper(l.longueur) : "-"}</td>
        <td>${echapper(l.cheminement)}</td>
      </tr>`
    )
    .join("");
  const titre = groupe.titre ? `<${niveauTitre}>${echapper(groupe.titre)}</${niveauTitre}>` : "";
  return `${titre}<div class="defile"><table class="longueurs">
    <thead><tr><th>${enteteNumero(lignes)}</th><th>Cot.</th><th>m</th><th>Cheminement / relais</th></tr></thead>
    <tbody>${corps}</tbody></table></div>`;
}

// Voies qu'on peut enchaîner avec celle-ci : lien vers leur fiche + explication.
function blocEnchainements(voie) {
  if (vide(voie.enchainements)) return "";
  return "<ul>" + voie.enchainements
    .map((e) => `<li>${e.id ? `<a href="voie.html?id=${encodeURIComponent(e.id)}">${echapper(e.titre || e.id)}</a> : ` : ""}${echapper(e.texte)}</li>`)
    .join("") + "</ul>";
}

// Sites de couenne : tableau des secteurs [{nom, nb_voies, cotations, description}].
function tableauSecteurs(voie) {
  if (vide(voie.secteurs)) return "";
  const lignes = voie.secteurs
    .map((s) => `<tr><td class="court"><strong>${echapper(s.nom || "")}</strong></td><td class="court">${echapper(s.nb_voies || "")}</td><td class="court">${echapper(s.cotations || "")}</td><td>${echapper(s.description || "")}</td></tr>`)
    .join("");
  return `<div class="defile"><table class="longueurs"><thead><tr><th>Secteur</th><th>Voies</th><th>Cotations</th><th>Remarques</th></tr></thead><tbody>${lignes}</tbody></table></div>`;
}

function section(titre, contenu) {
  if (!contenu) return "";
  return `<section class="section"><h2>${echapper(titre)}</h2>${contenu}</section>`;
}

function info(libelle, valeur) {
  if (vide(valeur)) return "";
  return `<div><dt>${echapper(libelle)}</dt><dd>${echapper(valeur)}</dd></div>`;
}

// Prévisions Meteoblue sur 7 jours au point de la voie (ex. …/semaine/45.991N6.463E).
function lienMeteo(c) {
  const lat = `${Math.abs(c.lat).toFixed(3)}${c.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(c.lon).toFixed(3)}${c.lon >= 0 ? "E" : "W"}`;
  return `https://www.meteoblue.com/fr/meteo/semaine/${lat}${lon}`;
}

/* ---------- Météo des 3 prochains jours (Open-Meteo, gratuit, sans clé) ---------- */
// Codes météo WMO → pictogramme et libellé.
function cielWMO(code) {
  if (code === 0) return ["☀️", "Ensoleillé"];
  if (code <= 2) return ["🌤", "Peu nuageux"];
  if (code === 3) return ["☁️", "Couvert"];
  if (code <= 48) return ["🌫", "Brouillard"];
  if (code <= 57) return ["🌦", "Bruine"];
  if (code <= 67) return ["🌧", "Pluie"];
  if (code <= 77) return ["🌨", "Neige"];
  if (code <= 82) return ["🌦", "Averses"];
  if (code <= 86) return ["🌨", "Averses de neige"];
  return ["⛈", "Orages"];
}

async function afficherMeteo(c) {
  const zone = document.getElementById("meteo-fiche");
  if (!zone) return;
  const url =
    "https://api.open-meteo.com/v1/forecast?" +
    new URLSearchParams({
      latitude: c.lat,
      longitude: c.lon,
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
      timezone: "auto",
      forecast_days: 3,
    });
  try {
    const rep = await fetch(url);
    if (!rep.ok) throw new Error();
    const m = await rep.json();
    const d = m.daily;
    const jours = d.time.map((date, i) => {
      const nom = i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : new Date(date + "T12:00").toLocaleDateString("fr-FR", { weekday: "long" });
      const [icone, ciel] = cielWMO(d.weather_code[i]);
      const pluie = d.precipitation_sum[i];
      const proba = d.precipitation_probability_max?.[i];
      return `<div class="meteo-jour">
        <div class="jour">${echapper(nom.charAt(0).toUpperCase() + nom.slice(1))}</div>
        <div class="icone" aria-hidden="true">${icone}</div>
        <div class="ciel">${ciel}</div>
        <div class="temp">${Math.round(d.temperature_2m_max[i])}° <span class="min">/ ${Math.round(d.temperature_2m_min[i])}°</span></div>
        <div class="detail">💧 ${pluie ? `${pluie.toFixed(1)} mm` : "0 mm"}${proba != null ? ` (${proba} %)` : ""}</div>
        <div class="detail">💨 ${Math.round(d.wind_speed_10m_max[i])} km/h</div>
      </div>`;
    });
    zone.innerHTML = `<h2>Météo des 3 prochains jours</h2>
      <div class="meteo-jours">${jours.join("")}</div>
      <p class="meteo-note">Prévision Open-Meteo au point de la fiche (altitude du modèle : environ ${Math.round(m.elevation)} m). En montagne, elle peut varier fortement avec l'altitude.
      <a href="${lienMeteo(c)}" target="_blank" rel="noopener">Détail sur Meteoblue ↗</a></p>`;
  } catch (e) {
    zone.innerHTML = `<h2>Météo des 3 prochains jours</h2><p class="meteo-note">Météo indisponible (pas de connexion ?). <a href="${lienMeteo(c)}" target="_blank" rel="noopener">Voir sur Meteoblue ↗</a></p>`;
  }
}

/* ---------- Bouton « Y aller » : itinéraire en voiture jusqu'au parking ---------- */
function liensItineraire(lat, lon) {
  const p = `${lat},${lon}`;
  return `<a href="https://maps.apple.com/?daddr=${p}&dirflg=d" target="_blank" rel="noopener">Plans</a>
    <a href="https://www.google.com/maps/dir/?api=1&destination=${p}&travelmode=driving" target="_blank" rel="noopener">Google Maps</a>
    <a href="https://waze.com/ul?ll=${p}&navigate=yes" target="_blank" rel="noopener">Waze</a>`;
}

function boutonYAller(voie) {
  const parkings = (voie.parkings || []).filter((p) => p.lat != null && p.lon != null);
  const c = voie.coordonnees || {};
  let lignes;
  if (parkings.length) {
    lignes = parkings.map(
      (p) => `<div class="y-aller-ligne"><span class="y-aller-nom">🅿️ ${echapper(p.nom)}${p.altitude ? ` (${p.altitude} m)` : ""}</span><span class="y-aller-liens">${liensItineraire(p.lat, p.lon)}</span></div>`
    );
    if (parkings.length > 1) lignes.push(`<p class="y-aller-note">Plusieurs accès possibles : le premier est celui de l'approche décrite dans la fiche.</p>`);
  } else if (c.lat != null) {
    lignes = [
      `<div class="y-aller-ligne"><span class="y-aller-nom">📍 Point de la fiche</span><span class="y-aller-liens">${liensItineraire(c.lat, c.lon)}</span></div>`,
      `<p class="y-aller-note">Pas de parking connu : ce point est souvent la voie ou le sommet, pas le parking. Regarde l'approche avant de partir.</p>`,
    ];
  } else return "";
  return `<details class="y-aller"><summary class="bouton">🚗 Y aller</summary><div class="y-aller-menu">${lignes.join("")}</div></details>`;
}

/* ---------- Bouton « Topo » : liens vers les topos en ligne (champ topos : [{titre, url}]) ---------- */
function boutonTopo(voie) {
  const topos = (voie.topos || []).filter((t) => t.url);
  if (!topos.length) return "";
  if (topos.length === 1) {
    return `<a class="bouton" href="${echapper(topos[0].url)}" target="_blank" rel="noopener" title="${echapper(topos[0].titre || "")}">📘 Topo ↗</a>`;
  }
  const lignes = topos
    .map((t) => `<a class="topo-lien" href="${echapper(t.url)}" target="_blank" rel="noopener">${echapper(t.titre || t.url)} ↗</a>`)
    .join("");
  return `<details class="y-aller"><summary class="bouton">📘 Topos (${topos.length})</summary><div class="y-aller-menu">${lignes}</div></details>`;
}

// Un clic ailleurs referme les menus « Y aller » et « Topos ».
document.addEventListener("click", (e) => {
  document.querySelectorAll("details.y-aller[open]").forEach((d) => {
    if (!d.contains(e.target)) d.open = false;
  });
});

/* ---------- Affichage écran ---------- */
function afficherFiche(voie) {
  document.title = `${voie.nom} – Sac à topos`;
  const c = voie.coordonnees || {};
  const liensC2C = (voie.camptocamp || [])
    .map((l) => `<a class="bouton" href="${echapper(l.url)}" target="_blank" rel="noopener">Camptocamp : ${echapper(l.titre)} ↗</a>`)
    .join("");

  const lieu = [voie.massif, voie.secteur].filter(Boolean).join(" · ");

  document.getElementById("fiche").innerHTML = `
    <div class="fiche-titre">
      <h1>${echapper(voie.nom)}</h1>
      ${voie.sous_titre ? `<p class="sous-titre">${echapper(voie.sous_titre)}</p>` : ""}
      ${lieu ? `<p class="lieu">${echapper(lieu)}</p>` : ""}
      ${estCouenne(voie) ? badgeCouenne() : badgeStatut(voie.statut)}
      ${blocSuggestion(voie)}
      ${voie.envie ? `<span class="envie-fiche">${etoiles(voie.envie)} ${echapper(ENVIES[voie.envie])}</span>` : ""}
    </div>

    <div class="actions">
      <button class="bouton principal" type="button" onclick="window.print()">🖨 Fiche A4</button>
      ${boutonYAller(voie)}
      ${boutonTopo(voie)}
      ${liensC2C}
      ${c.lat != null ? `<a class="bouton" href="index.html?voie=${encodeURIComponent(voie.id)}">Voir sur la carte</a>` : ""}
      ${c.lat != null ? `<a class="bouton" href="${lienMeteo(c)}" target="_blank" rel="noopener">🌤 Météo (Meteoblue) ↗</a>` : ""}
    </div>

    <dl class="infos">
      ${info("Nombre de voies", voie.nb_voies)}
      ${info("Cotations", voie.cotations)}
      ${info("Saison", voie.saison)}
      ${info("Cotation globale", voie.cotation_globale)}
      ${info("Libre max", voie.cotation_libre_max)}
      ${info("Obligatoire", voie.cotation_obligatoire)}
      ${info("Engagement", voie.engagement)}
      ${info("Équipement", voie.equipement ? texteEquipement(voie) : "")}
      ${info("Hauteur", voie.hauteur)}
      ${info("Longueurs", voie.nb_longueurs)}
      ${info("Orientation", voie.orientation)}
      ${info("Durée", voie.duree)}
      ${info("Projet / voyage", voie.projet)}
    </dl>

    ${c.lat != null ? `<section class="section" id="meteo-fiche"><h2>Météo des 3 prochains jours</h2><p class="meteo-note">Chargement…</p></section>` : ""}
    ${section("Objectif", blocTexte(voie.objectif))}
    ${section("Ambiance", blocTexte(voie.ambiance))}
    ${section("Approche", blocTexte(voie.approche))}
    ${section("Descente", blocTexte(voie.descente))}
    ${section("Matériel conseillé", blocTexte(voie.materiel))}
    ${section("Secteurs", tableauSecteurs(voie))}
    ${section("Longueurs", (voie.longueurs || []).map((g) => tableauLongueurs(g, "h3")).join(""))}
    ${section("Stratégie", blocTexte(voie.strategie))}
    ${section("Enchaînement possible", blocEnchainements(voie))}
    ${section("RETEX", blocTexte(voie.retex))}
    ${section("Horaires indicatifs", blocTexte(voie.horaires))}
    ${section("Notes perso", blocTexte(voie.notes))}
    ${section(
      "Images",
      vide(voie.images)
        ? ""
        : `<div class="images">${voie.images
            .map(
              (im) => `<figure><a href="${echapper(im.fichier)}" target="_blank"><img src="${echapper(im.fichier)}" alt="${echapper(im.legende || "")}" loading="lazy"></a>
                ${im.legende ? `<figcaption>${echapper(im.legende)}</figcaption>` : ""}</figure>`
            )
            .join("")}</div>`
    )}
    ${section(
      "Position",
      c.lat != null ? `<p>${echapper(c.lat)}, ${echapper(c.lon)}${c.repere ? ` – ${echapper(c.repere)}` : ""}</p>` : ""
    )}
    ${section("Sources", vide(voie.sources) ? "" : `<div class="sources">${blocTexte(voie.sources)}</div>`)}
  `;
}

/* ---------- Fiche A4 (impression) ---------- */
function ligneCle(libelle, valeur, libelle2, valeur2) {
  if (vide(valeur) && vide(valeur2)) return "";
  if (libelle2 === undefined) return `<tr><th>${echapper(libelle)}</th><td colspan="3">${echapper(valeur || "")}</td></tr>`;
  return `<tr><th>${echapper(libelle)}</th><td>${echapper(valeur || "")}</td><th>${echapper(libelle2)}</th><td>${echapper(valeur2 || "")}</td></tr>`;
}

function blocA4(titre, contenu) {
  if (!contenu) return "";
  return `<div class="bloc"><h2>${echapper(titre)}</h2>${contenu}</div>`;
}

function afficherA4(voie) {
  const cotation = [
    voie.cotation_globale,
    voie.cotation_libre_max && `libre max ${voie.cotation_libre_max}`,
    voie.cotation_obligatoire && `oblig. ${voie.cotation_obligatoire}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const acces = [blocTexte(voie.approche), voie.descente ? blocTexte("Descente : " + voie.descente) : ""].join("");

  const images = (voie.images || [])
    .map(
      (im) => `<figure class="page-image"><img src="${echapper(im.fichier)}" alt="">
        ${im.legende ? `<figcaption>${echapper(im.legende)}</figcaption>` : ""}</figure>`
    )
    .join("");

  document.getElementById("a4").innerHTML = `
    <div class="page1">
    <h1>${echapper(voie.nom)}</h1>
    ${voie.sous_titre ? `<p class="sous-titre">${echapper(voie.sous_titre)}</p>` : ""}

    <table class="cles">
      ${ligneCle("Objectif", voie.objectif)}
      ${estCouenne(voie) ? ligneCle("Site de couenne", voie.nb_voies, "Cotations", voie.cotations) : ""}
      ${ligneCle("Saison", voie.saison)}
      ${ligneCle("Cotation", cotation, "Engagement", voie.engagement)}
      ${ligneCle("Hauteur", voie.hauteur, "Longueurs", voie.nb_longueurs)}
      ${ligneCle("Durée", voie.duree, "Orientation", voie.orientation)}
      ${ligneCle("Ambiance", voie.ambiance)}
      ${ligneCle("Matériel", voie.materiel)}
    </table>

    <div class="colonnes">
      ${blocA4("Stratégie conseillée", blocTexte([...(voie.strategie || []), ...(voie.enchainements || []).map((e) => "Enchaînable : " + e.texte)]))}
      ${blocA4("Accès et liaison", acces)}
      ${blocA4("RETEX à retenir", blocTexte(voie.retex))}
      ${blocA4("Horaires indicatifs", blocTexte(voie.horaires))}
    </div>

    ${vide(voie.secteurs) ? "" : `<div class="tableau"><h2>Secteurs</h2>${tableauSecteurs(voie)}</div>`}
    ${(voie.longueurs || []).map((g) => `<div class="tableau">${tableauLongueurs(g, "h2")}</div>`).join("")}

    ${voie.notes ? `<div class="notes"><strong>Notes perso :</strong> ${echapper(voie.notes)}</div>` : ""}
    <div class="securite">${echapper(RAPPEL_SECURITE)}</div>
    ${vide(voie.sources) ? "" : `<div class="sources-a4"><strong>Sources :</strong> ${voie.sources.map(echapper).join(" ; ")}.</div>`}
    </div>

    ${images}
  `;
}

// Resserre le texte de la fiche A4 jusqu'à ce que la page 1 tienne sur une page (sans descendre sous ~6,3 pt).
function ajusterA4() {
  const a4 = document.getElementById("a4");
  const page = a4.querySelector(".page1");
  if (!page) return;
  const limite = (281 * 96) / 25.4 - 6; // hauteur utile d'une page A4 (297 mm - 2 × 8 mm de marge), en pixels
  let k = 1;
  a4.style.setProperty("--k", k);
  while (page.offsetHeight > limite && k > 0.82) {
    k = Math.round((k - 0.02) * 100) / 100;
    a4.style.setProperty("--k", k);
  }
}
window.addEventListener("beforeprint", ajusterA4);

/* ---------- Chargement ---------- */
const id = new URLSearchParams(location.search).get("id");
chargerVoies()
  .then((voies) => {
    const voie = voies.find((v) => v.id === id);
    if (!voie) throw new Error("Voie introuvable. Retourne à la carte pour en choisir une.");
    afficherFiche(voie);
    if (voie.coordonnees && voie.coordonnees.lat != null) afficherMeteo(voie.coordonnees);
    afficherA4(voie);
    ajusterA4();
    document.fonts?.ready.then(ajusterA4);
  })
  .catch((e) => afficherErreur(document.getElementById("fiche"), e.message));
