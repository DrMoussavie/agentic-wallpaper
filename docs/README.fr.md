# Agentic Wallpaper

*Documentation détaillée en français. Version courte en anglais : [README.md](../README.md) · [Tuto d'installation Wallpaper Engine](INSTALLATION-WALLPAPER-ENGINE.fr.md) · [Démo en ligne](https://drmoussavie.github.io/agentic-wallpaper/)*

Un petit jardin procédural en pixel art sur fond noir. Les robots, plus petits, sortent d’une maison commune et rejoignent des destinations calculées dans le jardin. Herbe, fleurs, pierres et maison sont de vraies images générées, conservées dans `public/assets/props`. La maison est ancrée en haut à gauche, avec une marge. Les déplacements s’étendent en dessous sur la largeur disponible de l’écran ; leur profondeur s’ajuste à la population et à la hauteur disponible. Les props se répartissent en petits groupes espacés sur toute la surface de l’écran, y compris au centre et en bas. Leur densité suit la surface disponible et leur disposition reste stable quand le nombre d’agents change.

## Ouvrir

Sur le PC configuré, le relais démarre automatiquement à l’ouverture de la session Windows, sans navigateur ni console. Le raccourci `Agent Transit - relais.lnk` du dossier Démarrage appelle `scripts/start-relay.ps1` et réutilise le relais s’il fonctionne déjà. Wallpaper Engine utilise son propre démarrage automatique. Pour un lancement manuel de développement :

```powershell
npm start
```

- Studio : http://127.0.0.1:49157/
- Atelier des 22 animations : http://127.0.0.1:49157/boards.html
- Fond seul, événements réels : http://127.0.0.1:49157/wallpaper.html?mode=live

Le fond et le Studio affichent uniquement les événements réels. Le mode démo, ses boutons et ses paramètres Wallpaper Engine ont été supprimés. Les anciennes URL avec `mode=demo` ouvrent désormais le mode réel, sans faux agents.

## La vie dans le fond

- `public/life.js` calcule le jardin et le cycle maison → sortie par la porte → activité → retour → repos à l’intérieur. Les sorties sont espacées. Une nouvelle disposition change les destinations ; un redimensionnement conserve les identités et réajuste les chemins.
- Le signal `Stop` marque une fin de réponse, pas forcément la fin définitive d’une conversation. Après son petit salut, le robot reste dans le jardin en tenant sa lettre de réponse levée (« All yours! ») : la réponse est livrée, rien ne dit qu’elle est lue — aucun hook ne le signale. Il rentre à la maison au prochain signal de repos du relais (sieste 5 min après le dernier événement, archivage à 8 min) ou au plus tard 5 minutes après sa réponse, pour ne pas s’entasser dehors. Un sous-agent, lui, rentre tout de suite après son rapport. Il reste associé à sa session. Un nouveau prompt le fait ressortir ; une nouvelle conversation reçoit sa propre identité. Un prompt reçu pendant le trajet de retour le fait repartir sans téléportation. Une fermeture de session termine également le trajet avant de masquer le personnage.
- `public/free-renderer.js` utilise les quatre PNG référencés dans `public/props.js` et le modèle de robot inchangé. Les robots mesurent environ 33 pixels sur un écran au petit côté de 1080 pixels, contre 132 précédemment. Les étiquettes ont été supprimées ; la taille des bulles reste réglable.
- Les agents disponibles se promènent doucement près de leur secteur, se saluent ou échangent un pixel décoratif. Un sous-agent rejoint le secteur du parent après sa sortie. Le chien optionnel parcourt le jardin, signale les attentes et erreurs et rapporte la balle abandonnée. Les sous-agents tournent autour de leur parent sous forme de mini-bots, tout en conservant leur activité.
- Un prompt ne vole vers un robot que lorsqu’il est placé dans le jardin : l’enveloppe attend au terminal (avec un petit halo) pendant qu’il sort de la maison, puis descend le conduit et finit exactement dans ses mains. Le robot s’immobilise et lève les yeux pendant le vol ; le geste de réception démarre capsule en main, synchronisé avec l’arrivée. Un robot qui sort pour un prompt laisse un éclat à la porte ; un prompt reçu pendant le retour produit le même éclat sur place. Deux prompts rapprochés ne donnent qu’une enveloppe.
- Pendant « Calling backup! », le parent ouvre un portail à côté de lui : le mini-bot en sort au moment où l’animation l’ouvre (environ 2,8 s), avec un éclat, puis rejoint son orbite. Si le parent est encore dans la maison, le sous-agent sort par la porte comme avant.
- Le coffre à jouets près de la maison montre la balle rangée dedans. Le coffre, le panier, la balle, le chien et les robots partagent le même ordre de profondeur : un robot qui passe derrière est bien dessiné derrière.
- Un panier de basket est toujours présent, sur un emplacement libre du jardin (jamais sur la maison, les props, le banc, le terminal ni le coffre), ouvert vers le centre de l’écran ; à chaque panier marqué, il change de place. Glisser-lâcher la balle à travers le cerceau marque un point ; le cerceau (large, avec une petite aide au tir près du centre) et le panneau renvoient les tirs manqués. La vitesse du lancer vient du geste complet des 160 dernières millisecondes, pas seulement du dernier événement souris : Wallpaper Engine, qui transmet les mouvements à cadence réduite, lance la balle dans la trajectoire du curseur au lieu de la laisser tomber. Un robot disponible va de lui-même chercher la balle (par terre ou dans le coffre), se place à bonne distance, la lève, tire (environ 60 % de réussite), puis salue ou boude. Tout événement réel, une attente, une erreur ou un clic sur la balle interrompt le jeu : la balle tombe sur place. Série en cours au-dessus du panneau, points et meilleure série sous le poteau ; la meilleure série est mémorisée par le navigateur (`localStorage`). Aucun panier ne peut sortir des limites du jardin.
- Le jour, un papillon traverse le jardin, se pose sur une touffe de fleurs, et repart ; le chien lui court après quand rien ne presse et le fait s’envoler. La nuit (21 h – 7 h, heure du PC), des lucioles clignotent à sa place. Maintenir le clic une seconde sur le chien fait apparaître un petit cœur.
- Quand les graves du son du PC restent hauts quelques secondes, les robots au repos dansent (tête, bras, petits sauts), le chien remue la queue et les touffes de fleurs vibrent avec les médiums. Ça s’arrête tout seul quand le rythme retombe.
- Cliquer dans le jardin attire jusqu’à deux robots disponibles ; cliquer sur un robot disponible déclenche un salut. Le travail, les erreurs, les attentes et les trajets vers la maison gardent la priorité.
- Les promenades et les rencontres se désactivent séparément. La pause du fond et celle de Wallpaper Engine suspendent le mouvement. Une connexion réelle perdue fige les promenades et affiche l’état inconnu.

Les rencontres entre Codex et Claude sont des jeux décoratifs. Elles ne créent aucun événement, message ou sous-agent réel et ne modifient pas le statut des sessions. Seuls les paquets issus du suivi d’activité utilisent les conduits de données.

Le réseau représente les événements reçus. Les petits transferts génériques sont limités à trois visibles ; les prompts et réponses ont leurs propres enveloppes animées, avec des trajets qui suivent le destinataire. Les conduits s’affichent pendant le transit. Un échange entre agents exige des identifiants connus et un résultat explicite. Le réglage réseau masque les lignes et les points génériques ; les enveloppes restent visibles.

Galerie des props : http://127.0.0.1:49157/props.html. Les prompts exacts et les variantes rejetées sont documentés dans [PROPS-PROMPTS.md](PROPS-PROMPTS.md). `node scripts/props-manifest.mjs` vérifie la transparence et régénère les cadres d’affichage sans modifier les PNG.

L’aperçu propose quatre proportions pour observer le comportement ; elles ne limitent pas les formats utilisables. Le fond seul remplit les dimensions de sa fenêtre.

## Personnages et fichiers image

Le modèle est figé dans `public/rig.js` : tête et corps communs à toutes les animations. Codex est blanc, cyan, avec une antenne. Claude est sombre, ambre, avec deux antennes. Les articulations et les accessoires sont animés dans `public/gestures.js`.

Les fichiers livrés sont dans `public/assets` :

- `model-01.png` : les deux personnages de référence.
- `animations/codex/` et `animations/claude/` : 22 planches par famille, une PNG de huit étapes par action.
- Dans ces mêmes dossiers, `*-sprites.png` : 24 images successives par action, fond transparent, cellules 96 × 80 ; fichier JSON voisin avec durée, ancrage et étapes.
- `sprites/codex.png` et `sprites/claude.png` : atlas récapitulatifs à 16 images par action et leur JSON.
- `index.json` : inventaire des fichiers.
- `reading-reference-v2.png` : référence générée retenue pour la silhouette. Les PNG opérationnels sont rendus depuis le modèle commun pour éviter les dérives entre générations indépendantes.

La planche de référence initiale `character-reference.png` reste conservée comme étape de travail, pas comme atlas de production. La génération de l’ordinateur qui changeait l’identité du robot a été rejetée.

Dans l’atelier, **Planche** ouvre une action en grand avec lecture/pause, curseur temporel, étapes et téléchargements. Le petit chien mécanique est un compagnon décoratif facultatif ; il n’est pas compté comme agent. Les sous-agents observés possèdent leur propre identifiant et leur lien de parenté.

## Brancher Codex et Claude Code

```powershell
npm run hooks:install
```

L’installation fusionne les entrées Agent Transit avec les configurations utilisateur, conserve les autres paramètres et sauvegarde les fichiers existants dans `.local/backups`. Pour retirer uniquement ces hooks : `npm run hooks:remove`.

Dans **l’application Codex**, ouvrir **Paramètres → Hooks → Issus de la configuration**, examiner les commandes qui pointent vers `fond écran/bridge/hook.mjs codex` et cliquer sur **Approuver** pour chacune. Le bouton **Recharger les hooks** actualise la liste. Ce chemin et les libellés ont été vérifiés dans les fichiers de l’application Windows installée, version 26.903.9818.0. Les définitions non approuvées sont ignorées. Reprendre ou démarrer les sessions concernées après activation. L’alternative pour les utilisateurs du terminal est `codex` puis `/hooks`. Source : [confiance des hooks Codex](https://learn.chatgpt.com/docs/hooks).

Dans **l’application Claude, onglet Code, sessions locales**, les hooks du fichier `~/.claude/settings.json` s’appliquent aussi : l’app et le CLI partagent cette configuration. Les versions actuelles rechargent normalement les modifications ; reprendre ou ouvrir une session pour vérifier la réception. Les sessions cloud ou SSH s’exécutent ailleurs et ne sont pas automatiquement reliées au relais Windows. Sources : [configuration partagée de Claude Code Desktop](https://code.claude.com/docs/en/desktop#shared-configuration) et [rechargement de la configuration](https://code.claude.com/docs/en/debug-your-config).

Pour vérifier le branchement, laisser le relais lancé, ouvrir le Studio en mode réel (`http://127.0.0.1:49157/?mode=live`), puis envoyer un message dans une session locale de chaque application. Le compteur d’événements doit augmenter et un robot doit apparaître. `http://127.0.0.1:49157/health` indique séparément les compteurs Codex et Claude. La présence des hooks dans un fichier ne prouve pas encore leur exécution par l’application. Ces chemins concernent les clients Windows locaux ; un client dans WSL ou sur une autre machine utilise un autre environnement.

Les hooks ne prennent aucune décision d’autorisation et renvoient `{}` même si le pont est indisponible. Ils ont une durée bornée. Les identifiants sont hachés ; les prompts, messages et commandes ne sont pas transmis au navigateur. Le nom du dossier de projet peut servir d’étiquette. Le pont écoute uniquement `127.0.0.1`. Aucun appel à une API de modèle ni clé API de modèle n’est nécessaire.

Les événements observables et leurs limites sont détaillés dans [AUDIT-DETECTION.md](AUDIT-DETECTION.md). En particulier :

- Début/reprise et retour d’un sous-agent : identifiant stable, sans doublon à la reprise. Les sous-agents Claude connus sont revérifiés toutes les 60 secondes : leurs marqueurs locaux de fin ou d’interruption peuvent corriger un hook de fin manqué. Les lectures sont bornées à 256 Ko par fichier, mises en cache, et une reprise plus récente est prioritaire. Un silence seul ne suffit pas.
- Lecture, édition, recherche, tests : catégorie fiable avec un outil explicite, sinon reconnaissance prudente ou geste générique.
- Une fin de réponse ne signifie pas que l’objectif complet est validé.
- Une capsule vers un autre agent n’est expédiée que si un résultat d’envoi explicite est reconnu et le destinataire identifié.
- Une notification de repos n’est pas une demande d’autorisation.
- Les pensées internes, les messages non exposés par un outil et les échanges automatiques Codex ↔ Claude ne sont pas inventés.
- Les actions rapides peuvent interrompre la séquence précédente : le mode réel donne priorité à l’état récent. L’atelier permet d’observer chaque cycle complet.

## Wallpaper Engine

```powershell
npm run export
```

Le dossier prêt à importer est `dist/wallpaper`. Copier ce dossier dans `projects/myprojects/agent-transit` de Wallpaper Engine conserve le `project.json` contenant les propriétés. Puis sélectionner **Agent Transit** et l’écran voulu dans Wallpaper Engine. Le dossier contient uniquement le fond et ses ressources, sans hooks, données locales ou dépendances du relais.

Réglages disponibles : fond, personnages, conduits, chien, promenades, rencontres, bulles et leur taille, balle, panier de basket, papillons et lucioles, spectre et sa largeur (20–100 %, 35 % par défaut), titre et artiste. Le spectre reste en bas à gauche, avec une marge basse de 80 pixels CSS pour dégager la barre des tâches (réglage 0–200 px). Le titre suit la même marge. Le canvas utilise la résolution native et la densité de pixels de l’écran : agrandir les personnages ou les bulles ne grossit plus un texte rasterisé en basse résolution. Le spectre garde un dégradé vertical vert → jaune → orange → rouge. Le mode démo et les petites étiquettes ont été retirés.

Par défaut, Wallpaper Engine et le navigateur utilisent exactement les mêmes 48 bandes du relais WASAPI, de 40 Hz à 20 kHz, avec les mêmes graduations. Les niveaux déjà calculés ne sont ni amplifiés ni reconvertis. Le relais partage un seul calcul FFT entre tous les clients. Une coupure de connexion masque le signal et indique une déconnexion, sans passer silencieusement à une autre source.

Le réglage **Source du spectre** propose aussi **Audio natif WE (décoratif, sans relais)** pour un usage autonome. Cette option utilise les valeurs natives brutes, sans la conversion logarithmique artificielle retirée. Elle affiche « Graves / Aigus » et ne prétend pas représenter les bandes Hz du relais. Ce mode est facultatif et désactivé par défaut. Source : [audio natif](https://docs.wallpaperengine.io/en/web/audio/visualizer.html).

Le titre et l’artiste apparaissent sur deux lignes discrètes au-dessus du spectre, tronquées à sa largeur. Activer l’intégration multimédia dans Wallpaper Engine et utiliser un lecteur qui renseigne les sessions multimédias Windows. Les informations se masquent lorsqu’elles sont absentes, à l’arrêt ou si l’intégration est désactivée ; la pause a une icône dédiée. Cette fonction native est absente du navigateur local. Source : [intégration multimédia](https://docs.wallpaperengine.io/en/web/audio/media.html).

### Démarrage automatique local

Le relais reste nécessaire pour les vrais agents et leurs sous-agents. Pour configurer une autre installation locale avec Node et les hooks déjà installés :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/configure-startup.ps1
```

Cela crée un seul raccourci dans le dossier Démarrage de l’utilisateur. Aucun droit administrateur, aucune modification permanente de la stratégie PowerShell, aucun démarrage supplémentaire de Wallpaper Engine. Le relais réutilise le processus existant et n’ouvre pas de navigateur. Journaux bornés par écrasement au démarrage dans `.local/autostart-*.log`. Pour retirer uniquement ce démarrage : même commande avec `-Remove`. Conserver le projet à son emplacement actuel ; refaire cette configuration après déplacement du dossier.

Dans Wallpaper Engine : **Paramètres → Général → Démarrer avec Windows**. Cette option est déjà enregistrée et activée sur le PC de développement. Sélectionner Agent Transit une première fois sur l’écran voulu ; Wallpaper Engine restaure ensuite le fond choisi. [Démarrage officiel](https://help.wallpaperengine.io/en/functionality/automaticstartup.html).

### Distribution Workshop

Un abonné peut utiliser le décor, la balle, le chien et l’audio natif sans installer de compagnon. Les vrais agents nécessitent en plus le relais local et les hooks autorisés : le fond Web ne peut pas installer ces composants ou lancer un exécutable à la place de l’utilisateur. Aucune détection fictive ne remplace une connexion absente. Les fonds de type Application ont été retirés du Workshop public : ils ne constituent pas une solution de distribution du relais. [Annonce Wallpaper Engine](https://store.steampowered.com/news/posts/?appids=431960).

Ce projet n’est pas encore publié sur le Workshop. Une mise à jour demande de refaire l’export puis de recopier les fichiers dans le projet Wallpaper Engine. Les réglages de pause et de FPS sont pris en charge, avec un plafond de 60 FPS et 30 FPS par défaut.

## Licence

Ce projet est publié sous [CC BY-NC 4.0](../LICENSE) : usage et modification libres, attribution demandée, usage commercial interdit. Les noms Claude Code et Codex appartiennent à leurs éditeurs respectifs ; ce projet n'est affilié à aucun d'eux.
