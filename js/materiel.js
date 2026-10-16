// Page Matériel : inventaire de notre matériel, rangé par catégorie (data/materiel.json).

const zone = document.getElementById("materiel");

// Colonnes possibles ; une colonne vide dans toute une catégorie n'est pas affichée.
const COLONNES = [
  ["nom", "Article"],
  ["quantite", "Qté"],
  ["details", "Taille / détails"],
  ["marque", "Marque"],
  ["annee", "Année"],
  ["etat", "État"],
  ["priorite", "Priorité"],
  ["notes", "Notes"],
];

function ancre(texte) {
  return "cat-" + texte.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-");
}

function tableau(articles) {
  const cols = COLONNES.filter(([cle]) => articles.some((a) => !vide(a[cle])));
  return `<div class="defile"><table class="longueurs inventaire">
    <thead><tr>${cols.map(([, titre]) => `<th>${titre}</th>`).join("")}</tr></thead>
    <tbody>${articles
      .map((a) => `<tr>${cols.map(([cle]) => `<td${cle === "nom" ? ' class="court"' : ""}>${echapper(a[cle] || "")}</td>`).join("")}</tr>`)
      .join("")}</tbody>
  </table></div>`;
}

// Deux onglets : l'inventaire (par défaut) et la liste « À acheter » (materiel.html#a-acheter).
function afficher(categories) {
  const achats = categories.filter((c) => c.achats);
  const inventaire = categories.filter((c) => !c.achats);
  const nbArticles = inventaire.reduce((n, c) => n + c.articles.length, 0);
  const nbAchats = achats.reduce((n, c) => n + c.articles.length, 0);
  const ongletAchats = location.hash === "#a-acheter";

  const onglets = `<nav class="onglets">
    <a href="#inventaire" class="${ongletAchats ? "" : "actif"}">Inventaire <span class="nb">${nbArticles}</span></a>
    <a href="#a-acheter" class="${ongletAchats ? "actif" : ""}">🛒 À acheter <span class="nb">${nbAchats}</span></a>
  </nav>`;

  const bloc = (c) => `<section class="section${c.achats ? " achats" : ""}" id="${ancre(c.categorie)}">
      <h2>${echapper(c.categorie)}</h2>
      ${c.note ? `<p class="note-cat">${echapper(c.note)}</p>` : ""}
      ${c.articles.length ? tableau(c.articles) : c.achats ? `<p class="a-completer">Rien pour l'instant.</p>` : c.note ? "" : `<p class="a-completer">À compléter</p>`}
    </section>`;

  let contenu;
  if (ongletAchats) {
    contenu = achats.map(bloc).join("");
  } else {
    const sommaire = inventaire
      .map((c) => `<a class="puce-cat" href="#${ancre(c.categorie)}">${echapper(c.categorie)} <span class="nb">${c.articles.length}</span></a>`)
      .join("");
    contenu = `<p class="intro-materiel">Pour ajouter ou modifier du matériel, envoie la liste à Claude.</p>
      <nav class="sommaire">${sommaire}</nav>
      ${inventaire.map(bloc).join("")}`;
  }
  zone.innerHTML = `<h1>Notre matériel</h1>${onglets}${contenu}`;
}

fetch("data/materiel.json", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error("Impossible de lire data/materiel.json");
    return r.json();
  })
  .then((categories) => {
    afficher(categories);
    // Changer d'onglet sans recharger ; les liens du sommaire (#cat-…) restent dans l'inventaire.
    window.addEventListener("hashchange", () => {
      const avant = zone.querySelector(".onglets .actif")?.getAttribute("href");
      const maintenant = location.hash === "#a-acheter" ? "#a-acheter" : "#inventaire";
      if (avant !== maintenant) {
        afficher(categories);
        if (!location.hash.startsWith("#cat-")) window.scrollTo(0, 0);
        else document.querySelector(location.hash)?.scrollIntoView();
      }
    });
  })
  .catch((e) => afficherErreur(zone, e.message));
