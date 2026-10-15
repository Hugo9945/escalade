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

function section(titre, contenu) {
  if (!contenu) return "";
  return `<section class="section"><h2>${echapper(titre)}</h2>${contenu}</section>`;
}

function info(libelle, valeur) {
  if (vide(valeur)) return "";
  return `<div><dt>${echapper(libelle)}</dt><dd>${echapper(valeur)}</dd></div>`;
}

/* ---------- Affichage écran ---------- */
function afficherFiche(voie) {
  document.title = `${voie.nom} – Escalade`;
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
      ${badgeStatut(voie.statut)}
      ${voie.envie ? `<span class="envie-fiche">${etoiles(voie.envie)} ${echapper(ENVIES[voie.envie])}</span>` : ""}
    </div>

    <div class="actions">
      <button class="bouton principal" type="button" onclick="window.print()">🖨 Fiche A4</button>
      ${liensC2C}
      ${c.lat != null ? `<a class="bouton" href="index.html?voie=${encodeURIComponent(voie.id)}">Voir sur la carte</a>` : ""}
    </div>

    <dl class="infos">
      ${info("Cotation globale", voie.cotation_globale)}
      ${info("Libre max", voie.cotation_libre_max)}
      ${info("Obligatoire", voie.cotation_obligatoire)}
      ${info("Engagement", voie.engagement)}
      ${info("Hauteur", voie.hauteur)}
      ${info("Longueurs", voie.nb_longueurs)}
      ${info("Orientation", voie.orientation)}
      ${info("Durée", voie.duree)}
      ${info("Projet / voyage", voie.projet)}
    </dl>

    ${section("Objectif", blocTexte(voie.objectif))}
    ${section("Ambiance", blocTexte(voie.ambiance))}
    ${section("Approche", blocTexte(voie.approche))}
    ${section("Descente", blocTexte(voie.descente))}
    ${section("Matériel conseillé", blocTexte(voie.materiel))}
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
    afficherA4(voie);
    ajusterA4();
    document.fonts?.ready.then(ajusterA4);
  })
  .catch((e) => afficherErreur(document.getElementById("fiche"), e.message));
