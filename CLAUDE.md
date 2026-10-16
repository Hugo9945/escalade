# Sac à topos — site perso d'escalade

Nom du site : « Sac à topos ». Style « Memphis » années 80 (turquoise, jaune, rose, violet, contours noirs épais ; titres Bungee, texte Rubik). Les couleurs de statut de la carte ne changent pas ; la fiche A4 reste en noir et blanc, police système.

Site statique (HTML/CSS/JS, sans build) hébergé sur GitHub Pages. Tout est en français.
Usage perso : un couple qui grimpe surtout en grandes voies et terrain d'aventure.
Le propriétaire ne code pas : expliquer simplement ce qui est fait, poser des questions plutôt que deviner.
**Ne jamais se fier à l'orthographe des noms donnés par le propriétaire** (matériel, voies, lieux) : vérifier le nom exact (site du fabricant, Camptocamp) avant de l'enregistrer, et signaler la correction.
**Toujours répondre au propriétaire en français**, y compris les messages courts et les comptes rendus d'avancement.

## Fichiers

- `index.html` + `js/carte.js` : carte Leaflet (OpenTopoMap / Plan IGN), filtres statut + projet, légende.
- `voie.html?id=<id>` + `js/voie.js` : fiche détaillée à l'écran ET fiche A4 (affichée seulement à l'impression, voir `@media print` dans `css/style.css`).
- `projets.html` + `js/projets.js` : un dossier par projet de voyage (`projets.html?projet=<nom>` ouvre le dossier) + dossier « Autres voies » pour les voies sans projet.
- `data/projets.json` : liste des projets `[{nom, periode, description}]` ; un projet peut exister sans voie (dossier vide). Le `nom` doit être identique au champ `projet` des voies.
- `js/verrou.js` : écran de code à 4 chiffres (chargé dans le `<head>` de chaque page). Seule l'empreinte SHA-256 de `escalade:<code>` est stockée ; ne jamais écrire le code en clair dans le dépôt. Protection de confort seulement : le dépôt est public.
- `materiel.html` + `js/materiel.js` + `data/materiel.json` : inventaire de notre matériel par catégorie (`[{categorie, articles:[{nom, quantite, marque, details, annee, etat, notes}]}]`). C'est la référence du rack et des cordes pour suggérer un statut : la tenir à jour quand le propriétaire envoie sa liste. La catégorie marquée `"achats": true` (« À acheter », affichée en premier, non comptée dans l'inventaire) liste le matériel à acheter (champs en plus : `priorite`) ; quand un article est acheté, le déplacer dans sa catégorie d'inventaire.
- `js/commun.js` : statuts (libellés + couleurs), chargement des données, outils.
- `data/voies.json` : toutes les voies (tableau JSON).
- `images/` : topos, croquis, photos. Nom de fichier : `<id-de-la-voie>-<description>.jpg`.
- `modeles/` : PDF modèle de la fiche A4.

Tester en local : `python3 -m http.server 8000` puis http://localhost:8000 (ouvrir le fichier directement ne marche pas, le JSON ne se charge pas).

Publication : dépôt https://github.com/Hugo9945/escalade (GitHub Pages, branche main) → https://hugo9945.github.io/escalade/. GitHub CLI : `~/.local/bin/gh` (connecté au compte Hugo9945). Après chaque modification : commit + push, le site se met à jour en 1-2 min. GitHub Pages fait garder les fichiers 10 min par les navigateurs : quand on modifie un fichier `js/` ou `css/`, augmenter le numéro `?v=N` dans les 3 pages HTML.

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
| `statut` | `faisable` / `engagee` / `bientot` / `materiel` / `fait` | `engagee` = « Faisable mais engagée (PG13) » : dans le niveau mais protection espacée, relais douteux, chutes potentiellement méchantes (échelle US G/PG/PG13/R/X) |
| `equipement`, `cote_equipement` | `equipee` / `semi` / `trad` ou null ; texte | tirés de `equipment_rating` C2C : P1/P1+ → equipee, P2/P2+ → semi, P3 à P4+ → trad ; `cote_equipement` = la cote brute (ex. « P2+ »). Forme du point sur la carte : rond / losange / triangle |
| `envie` | `1` / `2` / `3` ou absent | étoiles d'envie données par le propriétaire (★ pourquoi pas, ★★ envie, ★★★ très envie) ; ne jamais l'inventer, demander |
| `enchainements` | `[{id, titre, texte}]` (optionnel) | voie(s) qu'on peut enchaîner, avec lien vers leur fiche ; mettre le lien dans les DEUX fiches. Affiché à l'écran et dans la Stratégie de la fiche A4 |
| `projet` | texte ou `null` | nom du projet/voyage, identique à un `nom` de `data/projets.json` (l'y ajouter s'il est nouveau) |
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
- Suggérer un statut d'après le profil ci-dessous, mais c'est toujours le propriétaire qui décide : demander (voie par voie quand il y en a plusieurs).
- Une fiche = un seul itinéraire. Si la fiche C2C ou les sorties évoquent un itinéraire complémentaire à enchaîner (ex. voie des Cristaux + arête du Bouquetin), ne pas l'intégrer d'office : le proposer au propriétaire, qui décide (le plus souvent : un seul itinéraire).
- Projets : ne pas ranger d'office dans un dossier ; demander si le projet n'est pas évident (pour l'instant, les voies hors Europe ne sont pas traitées sans demande).

## Profil (pour suggérer un statut)

- Niveau : 6c en salle, 6a en extérieur, grandes voies jusqu'à 5b pour l'instant. Prend de la marge (a facilement peur) : rester prudent dans les suggestions.
- Rack : friends Black Diamond en double du 0.5 au 3 (trois #2), plus un 0.4 ; 1 Omega Pacific Link Cam orange (#2) ; Aliens : 1 gris, 1 rouge, 2 jaunes, 2 verts, 1 noir ; jeu complet de nuts DMM, jeu complet de nuts Black Diamond, jeu complet d'offsets DMM ; 5 Aliens offset (hybrides) ; 12 dégaines alpines, 21 dégaines ; sangles, mousquetons, cordelettes et matériel d'autosecours détaillés dans `data/materiel.json`. **Rien au-dessus du friend #3.**
- Cordes : simple 70 m en 9,5 (Mammut 9.5 Crag We Care Classic, 05/2025) ; double 60 m en 8,6 (2 brins Simond, 10/2026) ; simple d'environ 30 m.
- **Pas de matériel d'alpinisme** pour l'instant (ni crampons, ni piolet) : le signaler quand une voie en demande (approche ou descente enneigée, névés).

## À traiter plus tard

- **Maroc** (repérées dans les onglets du propriétaire le 15/10/2026, à traiter quand il le demandera, statut à demander voie par voie, dossier « Maroc ») : itinéraires C2C 1740320 (High Sierra Dome – Wide Sierra), 1893930 (High Sierra Dome – Dièdre sud-ouest), 1740329 (Adrar Iffran – Lone Tree Rib), 1849844 (Tafraout – Akida : Alabama buttress), 1849860 (Azrou el Doutoumdah – Curved Ridge), 1849985 (Adrar Umlil 5 – South Ridge), 1851086 (Adrar Umlil 1 – Noir c'est noir), 1851890 (Great Rock – Labyrinth Ridge), 1894552 (Middle Eagle – Éperon E).
- **Enchaînements repérés, non encore proposés en détail** : Arêtes de la Bruyère + Éperon des Moulinettes (refuge du Clot des Vaches) ; Index de la Glière + Mani pulite (C2C 54601) ; Brumes de l'automne + traversée Montaubert–Beccaz–Mouche (C2C 56812) ; Baulmes Grande Arête + Petite Arête (C2C 658103) ; Orpierre + Merci M'sieur (C2C 57749) ; Roche Fendue + Dents du Loup (C2C 57077).
