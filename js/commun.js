// Code partagé par toutes les pages : statuts, chargement des voies, petits outils d'affichage.

const STATUTS = {
  faisable: { libelle: "Faisable maintenant", couleur: "#2e7d32" },
  engagee: { libelle: "Faisable mais engagée (PG13)", couleur: "#7b1fa2" },
  bientot: { libelle: "Bientôt (niveau presque là)", couleur: "#ef8f00" },
  materiel: { libelle: "Matériel manquant", couleur: "#c62828" },
  fait: { libelle: "Fait", couleur: "#1e5fa8" },
};

async function chargerVoies() {
  const reponse = await fetch("data/voies.json", { cache: "no-cache" });
  if (!reponse.ok) throw new Error("Impossible de lire data/voies.json");
  return reponse.json();
}

// Protège le texte avant de l'insérer dans la page.
function echapper(texte) {
  return String(texte ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function vide(valeur) {
  return valeur == null || valeur === "" || (Array.isArray(valeur) && valeur.length === 0);
}

// Une liste devient une liste à puces, un texte devient des paragraphes.
function blocTexte(valeur) {
  if (vide(valeur)) return "";
  if (Array.isArray(valeur)) return "<ul>" + valeur.map((v) => `<li>${echapper(v)}</li>`).join("") + "</ul>";
  return String(valeur).split(/\n+/).map((p) => `<p>${echapper(p)}</p>`).join("");
}

function badgeStatut(cle) {
  const s = STATUTS[cle];
  if (!s) return "";
  return `<span class="badge" style="--c:${s.couleur}"><span class="pastille"></span>${echapper(s.libelle)}</span>`;
}

function lienVoie(voie) {
  return `voie.html?id=${encodeURIComponent(voie.id)}`;
}

function afficherErreur(conteneur, message) {
  conteneur.innerHTML = `<p class="erreur">${echapper(message)}</p>`;
}
