# Monde procédural — vérification du 12 septembre 2026

Le fond principal et le paquet Wallpaper Engine utilisent maintenant `life.js` et `free-renderer.js`. Les anciens moteurs à postes fixes ne sont plus chargés par les pages actuelles.

## Contrôles exécutés

- `npm test` : 26 tests réussis, aucun échec. Les dix nouveaux tests couvrent la génération par graine, les déplacements et rencontres, les priorités d’activité, la séparation après redimensionnement, les limites pour 2/20/64 agents sur six proportions, le rendu réel sur Canvas pour quatre formats et le ciblage des clics avec des dimensions non multiples de la taille des pixels.
- `npm run export` : le paquet local est régénéré avec le moteur procédural et les réglages de promenades et rencontres.
- Chromium : studio et fond seul chargés, 20 personnages présents, positions et compteurs de marche/rencontre évolutifs, aucune erreur JavaScript signalée. Captures portrait 1080×1920, carré 1024×1024 et ultralarge 3440×1440 dans `artifacts/free-*.png`.
- Le bouton de détail des planches et les sprites restent dans l’atelier ; les robots du monde utilisent exactement le même modèle `rig.js`.

## Limites vérifiées

Les rencontres, saluts, clics et le petit pixel échangé sont de la mise en scène. Ils n’envoient aucun message et ne modifient ni événements, ni outils en attente, ni état réel d’une session. Les avatars supplémentaires ne proviennent que des sessions/sous-agents reçus, ou de la démo explicitement fictive.

Les simulations d’événements des tests sont isolées. La réception depuis de véritables sessions Codex/Claude et l’exécution dans Wallpaper Engine ne sont toujours pas confirmées par ces tests de rendu. Les hooks doivent être actifs pour voir les agents réels. Les clics du fond dépendent aussi de l’acheminement de la souris par Wallpaper Engine.

Le navigateur automatisé a vérifié les handlers par exécution DOM et le ciblage du canvas ; l’accès au navigateur visible via CUA a expiré. L’ouverture de l’aperçu dans Codex est demandée séparément.
