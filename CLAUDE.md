# Sac à topos — site perso d'escalade

Nom du site : « Sac à topos ». Style « Refuge » (choisi le 18/11/2026, après les styles Memphis puis Montagne) : en-tête vert sapin (#2f4a3a) avec des crêtes vert foncé en transparence et un liseré bois (#c8a27a) dessous ; sur Carte et Météo, les crêtes et le liseré sont au bas du bandeau des filtres (vert lui aussi) ; fond beige (#f4efe6) avec de fines courbes de niveau ; blocs crème à coins arrondis ; boutons arrondis vert sapin ; titres de section avec un trait bois, étoiles cuivre (#c0702e), logo ambre (#e3b56a) ; police Inter. Les couleurs de statut de la carte ne changent pas ; la fiche A4 reste en noir et blanc, police système.

Site statique (HTML/CSS/JS, sans build) hébergé sur GitHub Pages. Tout est en français.
Usage perso : un couple qui grimpe surtout en grandes voies et terrain d'aventure.
Le propriétaire ne code pas : expliquer simplement ce qui est fait, poser des questions plutôt que deviner.
**Ne jamais se fier à l'orthographe des noms donnés par le propriétaire** (matériel, voies, lieux) : vérifier le nom exact (site du fabricant, Camptocamp) avant de l'enregistrer, et signaler la correction.
**Toujours répondre au propriétaire en français**, y compris les messages courts et les comptes rendus d'avancement.

## Fichiers

- `index.html` + `js/carte.js` : carte Leaflet (OpenTopoMap / Plan IGN), légende ; recherche (nom, secteur, massif ; Entrée cadre la carte), compteur de voies affichées, filtre statut, et sous « Plus de filtres » : équipement, envie, projet, zone (massif sans la parenthèse), cotation max (lue dans `cotation_libre_max`, « 5 » = 5a ; voies sans cotation masquées quand le filtre est actif), orientation N/E/S/O (lue dans `orientation`), durée (½ journée / 1 jour / plusieurs jours, lue dans `duree` : garder des formulations comme « 1/2 journée », « 1 jour », « 2 jours »). Filtre **Météo** : un jour (aujourd'hui + 13 jours, « indicatif » au-delà de 7) et une condition (Beau = code WMO ≤ 2 et pluie < 0,5 mm ; Sec = code < 51 et pluie < 1 mm ; Toutes) + case « Sec depuis 24 h » (veille < 1 mm) ; une seule requête Open-Meteo pour toutes les coordonnées, au chargement du filtre ; météo du jour ajoutée dans les bulles ; besoin du réseau.
- `sw.js` + `js/hors-ligne.js` : mode hors connexion (service worker). Pages, scripts, styles et données en « réseau d'abord » (4 s max, sinon copie) ; images des fiches préchargées ; dalles de carte déjà vues gardées (≈ 4000). Bandeau « Hors connexion » quand il n'y a pas de réseau. **Si on ajoute un fichier js/css/html, l'ajouter à la liste `ESSENTIEL` de `sw.js`.** Le navigateur intégré de l'app ne gère pas les service workers : tester avec Chrome headless.
- Météo des 3 prochains jours dans chaque fiche (`js/voie.js`, `afficherMeteo`) : API Open-Meteo gratuite, au point `coordonnees` ; à l'écran seulement, pas sur la fiche A4.
- `meteo.html` + `js/meteo.js` : onglet Météo, carte Windy intégrée (embed.windy.com, gratuit) avec boutons de couche (pluie, nuages, température, vent, nouvelle neige) et choix de zone ; le choix est mémorisé dans le navigateur. Le navigateur intégré de l'app peut mettre quelques secondes à afficher l'iframe.
- `voie.html?id=<id>` + `js/voie.js` : fiche détaillée à l'écran ET fiche A4 (affichée seulement à l'impression, voir `@media print` dans `css/style.css`). L'iPhone/iPad ne sait pas imprimer depuis l'icône de l'écran d'accueil : dans ce mode, « 🖨 Fiche A4 » ouvre un aperçu à l'écran (`voie.html?id=<id>&a4=1`, feuilles blanches réduites à la largeur) avec un lien « Ouvrir dans Safari » (`x-safari-https://…`) pour imprimer ou faire un PDF.
- `projets.html` + `js/projets.js` : un dossier par projet de voyage (`projets.html?projet=<nom>` ouvre le dossier) + dossier « Autres voies » pour les voies sans projet.
- `data/projets.json` : liste des projets `[{nom, periode, description}]` ; un projet peut exister sans voie (dossier vide). Le `nom` doit être identique au champ `projet` des voies.
- `js/verrou.js` : écran de code à 4 chiffres (chargé dans le `<head>` de chaque page). Seule l'empreinte SHA-256 de `escalade:<code>` est stockée ; ne jamais écrire le code en clair dans le dépôt. Protection de confort seulement : le dépôt est public.
- `materiel.html` + `js/materiel.js` + `data/materiel.json` : inventaire de notre matériel par catégorie (`[{categorie, articles:[{nom, quantite, marque, details, annee, etat, notes}]}]`). C'est la référence du rack et des cordes pour suggérer un statut : la tenir à jour quand le propriétaire envoie sa liste. La catégorie marquée `"achats": true` (« À acheter », dans un onglet séparé `materiel.html#a-acheter` ; l'inventaire reste l'onglet principal) liste le matériel à acheter (champs en plus : `priorite`) ; quand un article est acheté, le déplacer dans sa catégorie d'inventaire. Pour chaque nouvel article à acheter, demander sa priorité (Haute / Moyenne / Basse) avec le questionnaire à cliquer ; garder la liste triée par priorité.
- `js/commun.js` : statuts (libellés + couleurs), chargement des données, outils.
- `data/voies.json` : toutes les voies (tableau JSON).
- `images/` : topos, croquis, photos. Nom de fichier : `<id-de-la-voie>-<description>.jpg`.
- `modeles/` : PDF modèle de la fiche A4.

Tester en local : `python3 -m http.server 8000` puis http://localhost:8000 (ouvrir le fichier directement ne marche pas, le JSON ne se charge pas).

Publication : dépôt https://github.com/Hugo9945/escalade (GitHub Pages, branche main) → https://hugo9945.github.io/escalade/. GitHub CLI : `~/.local/bin/gh` (connecté au compte Hugo9945). Après chaque modification : commit + push, le site se met à jour en 1-2 min. GitHub Pages fait garder les fichiers 10 min par les navigateurs : quand on modifie un fichier `js/` ou `css/`, augmenter le numéro `?v=N` dans toutes les pages HTML (index, voie, projets, materiel, meteo).

## Format d'une voie (`data/voies.json`)

Laisser un champ vide (`""`, `null` ou `[]`) plutôt que d'inventer. Tous les champs texte sont affichés tels quels.

| Champ | Type | Contenu |
|---|---|---|
| `id` | texte | identifiant unique en minuscules avec tirets, ex. `charmant-som-dalles-e` |
| `nom` | texte | « Sommet – Voie » |
| `sous_titre` | texte | variante, point de départ |
| `massif`, `secteur` | texte | |
| `coordonnees` | `{lat, lon, repere}` | pied de voie ou parking ; `repere` dit lequel et la précision |
| `topos` | `[{titre, url}]` (optionnel) | topos gratuits et légaux en ligne (PDF ou page officielle : club, comité FFME/FSGT, collectivité) ; bouton « 📘 Topo » sur la fiche (menu s'il y en a plusieurs). Jamais de topo payant piraté. Vérifier que le lien répond avant de l'ajouter |
| `parkings` | `[{nom, lat, lon, altitude}]` | parkings / points d'accès pour le bouton « 🚗 Y aller » (Plans, Google Maps, Waze) : les points `access` associés à l'itinéraire C2C (`associations.waypoints`, coordonnées via `/waypoints/<id>`), celui de l'approche décrite en premier ; `[]` si inconnu (le bouton prend alors `coordonnees` avec un avertissement) |
| `camptocamp` | `[{titre, url}]` | un ou plusieurs itinéraires C2C |
| `objectif` | texte | ce qu'on vise (et les options) |
| `cotation_globale`, `cotation_libre_max`, `cotation_obligatoire`, `engagement` | texte | |
| `hauteur`, `nb_longueurs`, `orientation`, `duree` | texte | |
| `ambiance` | texte | type de rocher, style |
| `statut` | `faisable` / `engagee` / `bientot` / `materiel` / `fait` / `a_etudier` | `a_etudier` (gris) = pas encore étudié par le propriétaire ; mettre alors `statut_suggere` (une des autres valeurs) et `raison_suggestion` (une phrase), affichés comme « Suggestion de Claude » ; quand il valide, remplacer `statut` et supprimer la suggestion. `engagee` = « Faisable mais engagée (PG13) » : dans le niveau mais protection espacée, relais douteux, chutes potentiellement méchantes (échelle US G/PG/PG13/R/X) |
| `equipement`, `cote_equipement` | `equipee` / `semi` / `trad` ou null ; texte | tirés de `equipment_rating` C2C : P1/P1+ → equipee, P2/P2+ → semi, P3 à P4+ → trad ; `cote_equipement` = la cote brute (ex. « P2+ »). Forme du point sur la carte : rond / losange / triangle |
| `envie` | `1` / `2` / `3` ou absent | étoiles d'envie données par le propriétaire (★ pourquoi pas, ★★ envie, ★★★ très envie) ; ne jamais l'inventer, demander |
| `enchainements` | `[{id, titre, texte}]` (optionnel) | voie(s) qu'on peut enchaîner, avec lien vers leur fiche ; mettre le lien dans les DEUX fiches. Affiché à l'écran et dans la Stratégie de la fiche A4 |
| `projet` | texte ou `null` | nom du projet/voyage, identique à un `nom` de `data/projets.json` (l'y ajouter s'il est nouveau) |
| `approche`, `descente`, `materiel`, `horaires`, `notes` | texte | `notes` = notes perso, ne jamais les remplir sans demande |
| `longueurs` | `[{titre, lignes:[{n, cotation, longueur, cheminement}]}]` | un ou plusieurs tableaux (ex. option bas / objectif haut) ; `longueur` en m (nombre) ou `null` |
| `strategie`, `retex` | liste de textes | une puce par élément |
| `images` | `[{fichier, legende}]` | la 1re image = page 2 de la fiche A4 (pleine page) ; les suivantes = pages en plus |
| `sources` | liste de textes | toujours remplir, avec la date de consultation |

## Sites de couenne (`"type": "couenne"`)

Depuis le 18/11/2026, `data/voies.json` contient aussi des sites de couenne (falaises d'une longueur), choisis par le propriétaire pour profiter du filtre météo.
- **Pas de `statut` ni d'`envie`** (décision du propriétaire) : ne pas poser le questionnaire statut/étoiles ; demander seulement le projet s'il n'est pas évident.
- Sur la carte : carré brun (`COULEUR_COUENNE` dans `js/commun.js`), toujours affiché quel que soit le filtre de statut ; filtre « Type » (Tout / Grandes voies / Sites de couenne) ; le filtre de cotation compare la cotation la plus facile du site (début de `cotations`).
- Champs propres : `type: "couenne"`, `nb_voies` (texte, ex. « env. 120 voies »), `cotations` (texte « 3c à 7b »), `saison` (texte, meilleures périodes), `secteurs` (`[{nom, nb_voies, cotations, description}]`, optionnel). Champs communs réutilisés : `id`, `nom` (« Site » ou « Site – secteur »), `sous_titre`, `massif`, `secteur`, `coordonnees` (pied des voies ou parking), `parkings`, `camptocamp`, `hauteur`, `orientation`, `ambiance` (rocher, style), `equipement`/`cote_equipement`, `approche` (avec le temps de marche), `materiel` (longueur de corde, nombre de dégaines), `strategie` (bon à savoir : pluie, chaleur, enfants, restrictions), `retex`, `images`, `notes`, `sources`, `projet`. Laisser vides `longueurs`, `cotation_*`, `duree`, `nb_longueurs`, `descente`.
- Sur Camptocamp, un site de couenne est un point (`/waypoints/<id>?cook=fr`, `waypoint_type` = `climbing_outdoor`) : `routes_quantity`, `climbing_rating_min/max`, `height_min/max/median`, `orientations`, `best_periods`, `rock_types`, `climbing_styles`, `access_time`, `equipment_ratings`, `rain_proof`, `children_proof` ; les points d'accès sont dans `associations.waypoints` (type `access`). Sorties récentes : `https://api.camptocamp.org/outings?w=<id>&limit=15`.

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

## Déroulé habituel quand le propriétaire envoie une voie

1. Vérifier qu'elle n'est pas déjà dans `data/voies.json` (chercher l'id C2C dans les URL `camptocamp`) ; si oui, le dire avec son statut/étoiles actuels.
2. Si le lien est une **sortie** (`/outings/…`), retrouver l'itinéraire associé (`associations.routes`).
3. Récupérer l'itinéraire + jusqu'à 15 sorties récentes (RETEX daté, formulé comme des retours).
4. Demander au propriétaire, **avec le questionnaire à cliquer**, le statut (suggestion en premier, avec la raison ; proposer toujours **Faisable**, **Engagée** et **Bientôt**, plus « Matériel manquant » si du matériel manque, sinon « Fait ») et les étoiles d'envie ; demander le projet seulement s'il n'est pas évident (Europe → « Autres voies » par défaut s'il l'a dit).
5. Image : seulement une photo/croquis C2C **avec le tracé** et en licence collaborative/personal (sinon pas d'image). Jamais de scan de livre en ligne.
6. Remplir aussi `equipement`/`cote_equipement` et `parkings`, vérifier la fiche A4 (1 page de texte idéalement), publier (commit + push) et confirmer en ligne.
7. Signaler les points de vigilance (fermetures saisonnières, accès, matériel absent du rack, névés) et proposer les enchaînements sans les ajouter d'office.
8. Pour plusieurs voies (≥ 5), répartir la rédaction entre des sous-agents puis tout vérifier (cotations vs C2C, images présentes) avant d'assembler.

## Profil (pour suggérer un statut)

- Niveau : 6c en salle, 6a en extérieur, grandes voies jusqu'à 5b pour l'instant. Prend de la marge (a facilement peur) : rester prudent dans les suggestions.
- Rack : friends Black Diamond en double du 0.5 au 3 (trois #2), plus un 0.4 ; 1 Omega Pacific Link Cam orange (#2) ; Aliens : 1 gris, 1 rouge, 2 jaunes, 2 verts, 1 noir ; jeu complet de nuts DMM, jeu complet de nuts Black Diamond, jeu complet d'offsets DMM ; 5 Aliens offset (hybrides) ; 12 dégaines alpines, 21 dégaines ; sangles, mousquetons, cordelettes et matériel d'autosecours détaillés dans `data/materiel.json`. **Rien au-dessus du friend #3.**
- Cordes : simple 70 m en 9,5 (Mammut 9.5 Crag We Care Classic, 05/2025) ; double 60 m en 8,6 (2 brins Simond, 10/2026) ; simple d'environ 30 m.
- **Pas de matériel d'alpinisme** pour l'instant (ni crampons, ni piolet) : le signaler quand une voie en demande (approche ou descente enneigée, névés).

## À traiter plus tard

- **Vraie protection (en pause, décision du propriétaire le 21/10/2026)** : migration vers Cloudflare Pages + dépôt GitHub privé. `functions/_middleware.js` (page de connexion côté serveur, mot de passe dans le secret Cloudflare `SITE_PASSWORD`) est prêt et testé mais inactif sur GitHub Pages. Le propriétaire a un compte Cloudflare ; il reste à créer le projet Pages `sac-a-topos` relié au dépôt, saisir le mot de passe, tester, puis passer le dépôt en privé et retirer `js/verrou.js`. En attendant : **ne pas publier de scans de topos de livres** (site public) ; s'en servir seulement pour remplir les fiches, en citant le livre.

- **Check-list matériel par voie (idée validée le 18/11/2026, à faire plus tard)** : sur chaque fiche, une liste « à emporter » tirée de `data/materiel.json` (friends jusqu'à tel numéro, corde double pour les rappels de 50 m, crampons…), avec en rouge ce qui manque. Proposition détaillée faite le 18/11/2026, à reprendre le 19/11 : bloc « 🎒 À emporter » à cocher (coches gardées sur l'appareil, bouton « Nouvelle sortie »), « sac de base » commun + liste propre à chaque voie (rédigée pour les 132 fiches, couenne comprise), comparaison automatique avec l'inventaire (rouge si absent, mention si déjà dans « À acheter »), version A4 à cases. Questions ouvertes posées au propriétaire : afficher le sac de base dans chaque liste ? coches partagées avec Marine (compliqué sans serveur) ? filtre carte « faisable avec notre matériel » ? Le carnet de sorties n'est pas voulu (le propriétaire en tient un sur papier).
- **Maroc** : 28 voies ajoutées le 16/10/2026 avec le statut `a_etudier` et une suggestion. Le propriétaire les étudie avec le topo papier : ensuite, lui envoyer le questionnaire voie par voie (statut, suggestion présélectionnée, puis étoiles).
- **Enchaînements repérés, non encore proposés en détail** : Arêtes de la Bruyère + Éperon des Moulinettes (refuge du Clot des Vaches) ; Index de la Glière + Mani pulite (C2C 54601) ; Brumes de l'automne + traversée Montaubert–Beccaz–Mouche (C2C 56812) ; Baulmes Grande Arête + Petite Arête (C2C 658103) ; Orpierre + Merci M'sieur (C2C 57749) ; Roche Fendue + Dents du Loup (C2C 57077).
