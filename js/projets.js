// Page Projets : un dossier par projet de voyage ; un clic ouvre le dossier et liste ses voies.
// projets.html            → tous les dossiers
// projets.html?projet=Nom → les voies du projet « Nom »

const AUTRES = "__autres__";
const zone = document.getElementById("projets");

function elementVoie(voie) {
  const details = [voie.massif, voie.cotation_globale, voie.cotation_libre_max, voie.hauteur].filter(Boolean).join(" · ");
  return `<li><a href="${lienVoie(voie)}">
    <span><span class="nom">${echapper(voie.nom)}</span> ${etoiles(voie.envie)}<br><span class="details">${echapper(details)}</span></span>
    ${badgeStatut(voie.statut)}
  </a></li>`;
}

function lienProjet(nom) {
  return `projets.html?projet=${encodeURIComponent(nom)}`;
}

// Petites pastilles « 3 Fait · 1 Bientôt » sur chaque dossier.
function resumeStatuts(voies) {
  return Object.entries(STATUTS)
    .map(([cle, s]) => [s, voies.filter((v) => v.statut === cle).length])
    .filter(([, n]) => n)
    .map(([s, n]) => `<span class="mini-statut"><span class="pastille" style="background:${s.couleur}"></span>${n} ${echapper(s.libelle.split(" (")[0])}</span>`)
    .join("");
}

function dossier(nom, lien, voies, periode) {
  const nb = voies.length ? `${voies.length} voie${voies.length > 1 ? "s" : ""}` : "Aucune voie pour l'instant";
  return `<li><a class="dossier" href="${lien}">
    <span class="icone" aria-hidden="true">📁</span>
    <span class="contenu">
      <span class="titre">${echapper(nom)}</span>
      ${periode ? `<span class="periode">${echapper(periode)}</span>` : ""}
      <span class="nb">${nb}</span>
      <span class="statuts">${resumeStatuts(voies)}</span>
    </span>
  </a></li>`;
}

function afficherDossiers(projets, voies) {
  // Projets déclarés dans data/projets.json, puis ceux qui n'existent que dans les voies.
  const noms = projets.map((p) => p.nom);
  for (const v of voies) if (v.projet && !noms.includes(v.projet)) noms.push(v.projet);

  let html = noms
    .map((nom) => {
      const p = projets.find((x) => x.nom === nom) || {};
      return dossier(nom, lienProjet(nom), voies.filter((v) => v.projet === nom), p.periode);
    })
    .join("");
  const autres = voies.filter((v) => !v.projet);
  if (autres.length) html += dossier("Autres voies", lienProjet(AUTRES), autres, "Sans projet de voyage");
  zone.innerHTML = `<h1>Projets de voyage</h1><ul class="dossiers">${html}</ul>`;
}

function afficherProjet(nom, projets, voies) {
  const estAutres = nom === AUTRES;
  const titre = estAutres ? "Autres voies" : nom;
  const p = projets.find((x) => x.nom === nom) || {};
  const liste = voies.filter((v) => (estAutres ? !v.projet : v.projet === nom)).sort((a, b) => (b.envie || 0) - (a.envie || 0) || a.nom.localeCompare(b.nom, "fr")); // plus d'envie en premier
  document.title = `${titre} – Escalade`;
  zone.innerHTML = `
    <a class="retour" href="projets.html">← Tous les projets</a>
    <h1>📂 ${echapper(titre)}</h1>
    ${p.periode ? `<p class="periode">${echapper(p.periode)}</p>` : ""}
    ${p.description ? blocTexte(p.description) : ""}
    ${liste.length ? `<ul class="liste-voies">${liste.map(elementVoie).join("")}</ul>` : `<p>Aucune voie pour l'instant.</p>`}`;
}

async function chargerProjets() {
  try {
    const r = await fetch("data/projets.json", { cache: "no-cache" });
    return r.ok ? r.json() : [];
  } catch (e) {
    return [];
  }
}

Promise.all([chargerProjets(), chargerVoies()])
  .then(([projets, voies]) => {
    const nom = new URLSearchParams(location.search).get("projet");
    if (nom) afficherProjet(nom, projets, voies);
    else afficherDossiers(projets, voies);
  })
  .catch((e) => afficherErreur(zone, e.message));
