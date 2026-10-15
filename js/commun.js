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

// Type d'équipement (tiré de la cote d'équipement Camptocamp) : forme du point sur la carte.
// P1/P1+ = équipée, P2/P2+ = semi-équipée, P3 à P4+ = trad.
const EQUIPEMENTS = {
  equipee: { libelle: "Équipée", detail: "P1, P1+", forme: "rond" },
  semi: { libelle: "Semi-équipée", detail: "P2, P2+", forme: "losange" },
  trad: { libelle: "Trad", detail: "P3 à P4", forme: "triangle" },
};

// Petit dessin SVG (rond, losange ou triangle) rempli de la couleur du statut.
function formeSVG(cleEquipement, couleur, taille = 22) {
  const forme = EQUIPEMENTS[cleEquipement]?.forme || "rond";
  const contour = `fill="${couleur}" stroke="#fff" stroke-width="2" stroke-linejoin="round"`;
  const dessin = {
    rond: `<circle cx="11" cy="11" r="8.5" ${contour}/>`,
    losange: `<polygon points="11,1.5 20.5,11 11,20.5 1.5,11" ${contour}/>`,
    triangle: `<polygon points="11,1.5 21,19.5 1,19.5" ${contour}/>`,
  }[forme];
  return `<svg width="${taille}" height="${taille}" viewBox="0 0 22 22" aria-hidden="true">${dessin}</svg>`;
}

function texteEquipement(voie) {
  const e = EQUIPEMENTS[voie.equipement];
  if (!e) return "non renseigné";
  return voie.cote_equipement ? `${e.libelle} (${voie.cote_equipement})` : e.libelle;
}

// Envie de faire la voie : 1 à 3 étoiles (champ « envie »), rien si non noté.
const ENVIES = { 1: "Pourquoi pas", 2: "Envie", 3: "Très envie" };
function etoiles(n) {
  if (!ENVIES[n]) return "";
  return `<span class="etoiles" title="${ENVIES[n]}" aria-label="Envie : ${n} sur 3">${"★".repeat(n)}<span class="vides">${"★".repeat(3 - n)}</span></span>`;
}

function lienVoie(voie) {
  return `voie.html?id=${encodeURIComponent(voie.id)}`;
}

function afficherErreur(conteneur, message) {
  conteneur.innerHTML = `<p class="erreur">${echapper(message)}</p>`;
}
