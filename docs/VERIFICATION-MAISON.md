# Jardin, props et maison — 12 septembre 2026

29 tests automatisés réussis (`artifacts/test-latest.txt`). Le cycle complet est testé pour Codex et Claude : sortie par la porte, fin de réponse, marche vers la maison, repos invisible à l’intérieur, reprise avec le même identifiant. Les cas de fermeture de session, nouvelle conversation et prompt pendant le retour sont couverts.

Les quatre PNG générés sont chargés dans le navigateur. Leur vraie transparence a été contrôlée par lecture du canal alpha. Les deux variantes à damier opaque sont exclues des assets livrés. La galerie `props.html` affiche les images retenues et les liens de téléchargement. Captures dans `artifacts/props-gallery.png` et `artifacts/garden-*.png`.

Recette navigateur sur données fictives : `outside → home`, compteur de retour 1, aucun avatar visible pendant le repos ; après nouveau prompt, `leaving`, porte ouverte et toujours un seul agent. Le rendu 1440×900 indique 33 pixels par robot. Portrait 1080×1920 et ultralarge 3440×1440 contrôlés également. Aucune erreur JavaScript signalée.

Le pont local a été redémarré avec le nouveau champ de repos. L’export Wallpaper Engine inclut `props.js` et les PNG du dossier `assets/props`. Comme auparavant, ces vérifications n’attestent pas encore la réception de hooks depuis de véritables sessions des deux applications, ni l’exécution dans Wallpaper Engine.

## Ajustement haut gauche et largeur de l’écran

La maison est ancrée en haut à gauche avec une marge ; le jardin occupe la largeur disponible en dessous. Les bordures végétales suivent ce jardin. Les trajets de sortie et de retour accélèrent proportionnellement sur les grandes largeurs pour éviter des traversées excessivement longues, sans agrandir les robots. Les 29 tests restent réussis après ce changement.

Contrôle Chromium avec 12 agents fictifs, quatre props chargés et aucune erreur JavaScript : paysage 1440×900, portrait 1080×1920, ultralarge 3440×1440. Captures `artifacts/garden-top-left-landscape.png`, `garden-top-left-portrait.png` et `garden-top-left-ultrawide.png`. En paysage, maison centrée en (114, 142), toit à y=54 ; limites horizontales des déplacements de x=67 à x=1365.

L’export a été régénéré et ouvert directement comme fichier local dans Chromium : mode réel par défaut, connexion au relais ouverte, quatre props chargés, aucune erreur JavaScript. Contrôle de configuration en lecture seule : 12 événements Codex et 16 Claude déjà installés ; compteur du relais encore à zéro pour les deux fournisseurs. L’activation dans les clients et l’import dans Wallpaper Engine restent à vérifier en situation réelle. La procédure figure dans le README.

## Props sur tout l’écran et diagnostic des apps

Les touffes, fleurs et pierres occupent désormais toute la surface, en groupes espacés et reproductibles. Leur densité dépend de la surface et leur disposition ne dépend pas du nombre d’agents. La maison, sa porte et le chemin restent dégagés. Captures contrôlées : `artifacts/props-full-screen-portrait.png` et `artifacts/props-full-screen-landscape.png`. Les 29 tests passent après ce changement.

Quatre tâches Codex actives confirmées par l’application au moment du diagnostic. Lecture de `hooks/list` avec le moteur local, sans démarrer ni modifier de tâche : les 12 hooks Agent Transit sont activés mais leur `trustStatus` vaut `untrusted`. Le relais fonctionne et reçoit zéro événement. Le code de l’app Windows installée confirme l’écran Paramètres → Hooks, la section « Issus de la configuration », le bouton « Approuver » et « Recharger les hooks ». Aucune approbation n’a été effectuée par ce diagnostic.

Le Studio explique maintenant l’absence d’événements même lorsque le relais est connecté, et distingue la simulation des sessions réelles. Recette navigateur : mode réel connecté avec compteur zéro et instructions pour l’app ; bascule en démo avec six robots ; retour au mode réel. Aucune erreur JavaScript. Capture `artifacts/live-waiting-for-desktop-hooks.png`. Export Wallpaper Engine régénéré. Claude Code Desktop partage les hooks de configuration pour ses sessions locales selon sa documentation officielle ; l’émission réelle depuis cette app reste à confirmer.
