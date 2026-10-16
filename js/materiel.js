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

fetch("data/materiel.json", { cache: "no-cache" })
  .then((r) => {
    if (!r.ok) throw new Error("Impossible de lire data/materiel.json");
    return r.json();
  })
  .then((categories) => {
    // La liste « À acheter » est affichée en premier et n'est pas comptée dans l'inventaire.
    const achats = categories.filter((c) => c.achats);
    const inventaire = categories.filter((c) => !c.achats);
    const nbArticles = inventaire.reduce((n, c) => n + c.articles.length, 0);
    categories = [...achats, ...inventaire];
    const sommaire = categories
      .map((c) => `<a class="puce-cat${c.achats ? " achats-puce" : ""}" href="#${ancre(c.categorie)}">${echapper(c.categorie)} <span class="nb">${c.articles.length}</span></a>`)
      .join("");
    const blocs = categories
      .map(
        (c) => `<section class="section${c.achats ? " achats" : ""}" id="${ancre(c.categorie)}">
          <h2>${c.achats ? "🛒 " : ""}${echapper(c.categorie)}</h2>
          ${c.note ? `<p class="note-cat">${echapper(c.note)}</p>` : ""}
          ${c.articles.length ? tableau(c.articles) : c.achats ? `<p class="a-completer">Rien pour l'instant.</p>` : c.note ? "" : `<p class="a-completer">À compléter</p>`}
        </section>`
      )
      .join("");
    zone.innerHTML = `
      <h1>Notre matériel</h1>
      <p class="intro-materiel">${nbArticles} lignes d'inventaire. Pour ajouter ou modifier du matériel, envoie la liste à Claude.</p>
      <nav class="sommaire">${sommaire}</nav>
      ${blocs}`;
  })
  .catch((e) => afficherErreur(zone, e.message));
