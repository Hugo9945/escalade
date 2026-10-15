# Site perso d'escalade

Site statique (HTML/CSS/JS, sans build) hébergé sur GitHub Pages. Tout est en français.
Usage perso : un couple qui grimpe surtout en grandes voies et terrain d'aventure.
Le propriétaire ne code pas : expliquer simplement ce qui est fait, poser des questions plutôt que deviner.

## Fichiers

- `index.html` + `js/carte.js` : carte Leaflet (OpenTopoMap / Plan IGN), filtres statut + projet, légende.
- `voie.html?id=<id>` + `js/voie.js` : fiche détaillée à l'écran ET fiche A4 (affichée seulement à l'impression, voir `@media print` dans `css/style.css`).
- `projets.html` + `js/projets.js` : voies regroupées par projet de voyage.
- `js/commun.js` : statuts (libellés + couleurs), chargement des données, outils.
- `data/voies.json` : toutes les voies (tableau JSON).
- `images/` : topos, croquis, photos. Nom de fichier : `<id-de-la-voie>-<description>.jpg`.
- `modeles/` : PDF modèle de la fiche A4.

Tester en local : `python3 -m http.server 8000` puis http://localhost:8000 (ouvrir le fichier directement ne marche pas, le JSON ne se charge pas).

## Format d'une voie (`data/voies.json`)

Laisser un champ vide (`""`, `null` ou `[]`) plutôt que d'inventer. Tous les champs texte sont affichés tels quels.

| Champ | Type | Contenu |
|---|---|---|
| `id` | texte | identifiant unique en minuscules avec tirets, ex. `charmant-som-dalles-e` |
| `nom` | texte | « Sommet – Voie » |
| `sous_titre` | texte | variante, point de départ |
| `massif`, `secteur` | texte | |
| `coordonnees` | `{lat, lon, repere}` | pied de voie ou parking ; `repere` dit lequel et la précision |
| `camptocamp` | `[{titre, url}]` | un ou plusieurs itinéraires C2C |
| `objectif` | texte | ce qu'on vise (et les options) |
| `cotation_globale`, `cotation_libre_max`, `cotation_obligatoire`, `engagement` | texte | |
| `hauteur`, `nb_longueurs`, `orientation`, `duree` | texte | |
| `ambiance` | texte | type de rocher, style |
| `statut` | `faisable` / `bientot` / `materiel` / `fait` | |
| `projet` | texte ou `null` | nom du projet/voyage, identique entre voies d'un même projet |
| `approche`, `descente`, `materiel`, `horaires`, `notes` | texte | `notes` = notes perso, ne jamais les remplir sans demande |
| `longueurs` | `[{titre, lignes:[{n, cotation, longueur, cheminement}]}]` | un ou plusieurs tableaux (ex. option bas / objectif haut) ; `longueur` en m (nombre) ou `null` |
| `strategie`, `retex` | liste de textes | une puce par élément |
| `images` | `[{fichier, legende}]` | la 1re image = page 2 de la fiche A4 (pleine page) ; les suivantes = pages en plus |
| `sources` | liste de textes | toujours remplir, avec la date de consultation |

## Ajouter une voie depuis Camptocamp

API publique : `https://api.camptocamp.org/routes/<id>?cook=fr` (itinéraire), `https://api.camptocamp.org/outings?r=<id>&limit=20` (sorties récentes), puis `https://api.camptocamp.org/outings/<id>?cook=fr` pour le détail.
Les coordonnées C2C sont en Web Mercator (EPSG:3857) : convertir en lat/lon.

Règles :
- Ne jamais rien inventer. Si une info manque : champ vide, ou demander.
- Garder les incertitudes (« à vérifier sur place »). Ne pas transformer une impression d'un grimpeur en fait (« un retour signale… »).
- Citer les sources (numéros d'itinéraire/sorties C2C, date de consultation, livres).
- Suggérer un statut d'après le profil ci-dessous, mais c'est toujours le propriétaire qui décide : demander.

## Profil (pour suggérer un statut)

- Niveau : 6c en salle, 6a en extérieur, grandes voies jusqu'à 5b pour l'instant. Prend de la marge (a facilement peur) : rester prudent dans les suggestions.
- Rack : friends Black Diamond en double du 0.5 au 3, plus un 0.4 ; Aliens : 1 gris, 1 rouge, 2 jaunes, 2 verts, 1 noir ; jeu complet de nuts DMM, jeu complet de nuts Black Diamond, jeu complet d'offsets DMM ; ~12 dégaines rallongeables, ~20 dégaines classiques, sangles et mousquetons en quantité. **Rien au-dessus du friend #3.**
- Cordes : simple 70 m en 9,5 ; double 60 m en 8,6 ; simple d'environ 30 m.
