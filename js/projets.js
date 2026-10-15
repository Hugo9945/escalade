// Liste des voies regroupées par projet de voyage (les voies sans projet sont à la fin).

function elementVoie(voie) {
  const details = [voie.massif, voie.cotation_globale, voie.cotation_libre_max, voie.hauteur].filter(Boolean).join(" · ");
  return `<li><a href="${lienVoie(voie)}">
    <span><span class="nom">${echapper(voie.nom)}</span><br><span class="details">${echapper(details)}</span></span>
    ${badgeStatut(voie.statut)}
  </a></li>`;
}

function groupe(titre, voies) {
  const triees = [...voies].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  return `<section class="projet">
    <h2>${echapper(titre)} <span class="nb">(${voies.length} voie${voies.length > 1 ? "s" : ""})</span></h2>
    <ul class="liste-voies">${triees.map(elementVoie).join("")}</ul>
  </section>`;
}

chargerVoies()
  .then((voies) => {
    const parProjet = new Map();
    for (const v of voies.filter((v) => v.projet)) {
      if (!parProjet.has(v.projet)) parProjet.set(v.projet, []);
      parProjet.get(v.projet).push(v);
    }
    const noms = [...parProjet.keys()].sort((a, b) => a.localeCompare(b, "fr"));
    const sansProjet = voies.filter((v) => !v.projet);

    let html = noms.map((n) => groupe(n, parProjet.get(n))).join("");
    if (!noms.length) html += `<p>Aucun projet pour l'instant.</p>`;
    if (sansProjet.length) html += groupe("Sans projet", sansProjet);
    document.getElementById("projets").innerHTML = html;
  })
  .catch((e) => afficherErreur(document.getElementById("projets"), e.message));
