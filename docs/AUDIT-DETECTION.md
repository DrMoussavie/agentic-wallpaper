# Audit des événements et des animations — Agent Transit

Date : 12 septembre 2026. Audit du prototype local et des documentations officielles. Aucun agent réel n’a été lancé pour les essais : les reproductions utilisent des identifiants fictifs en mémoire.

## Mise à jour après corrections et livraison locale

Les constats initiaux ci-dessous sont conservés comme historique. Les faux positifs de classement, le repos confondu avec une demande d’aide, l’attribution ambiguë de coéquipiers et les envois prématurés ont été corrigés. Un sous-agent n’apparaît que sur un événement identifié ; une reprise conserve son identité. Les outils simultanés restent suivis séparément et un résultat opaque n’est plus assimilé à un succès.

Les scripts d’installation et d’export sont livrés. Les hooks Agent Transit sont ajoutés aux configurations utilisateur Codex et Claude, en préservant les autres paramètres. Leur présence ne prouve pas leur activation : Codex demande encore de vérifier les définitions via `/hooks`. La réception depuis une véritable session Codex ou Claude reste à confirmer, ainsi que la compatibilité de la version locale de Claude.

Les deux robots utilisent désormais un modèle commun figé : Codex blanc à une antenne, Claude sombre à deux antennes. Les 22 actions de chaque famille sont exportées dans `public/assets/animations/{codex,claude}` : une planche de huit étapes, une bande transparente de 24 images et ses métadonnées par action. Avec les deux atlas et la fiche des modèles, cela représente 91 PNG exportés, en plus des deux références conservées.

Validation : 16 tests automatisés réussis. Ils comprennent la normalisation, les identités, les outils concurrents, la disposition adaptative, les différences entre images d’animation, l’installation réversible, le récepteur HTTP et l’exécution réelle des deux scripts de hooks sur des données fictives, avec sorties neutres en cas de panne. La galerie et ses planches ont été ouvertes dans Chromium ; les compositions à 2 et 20 agents ont été contrôlées en portrait, et à 20 agents en paysage. Captures dans `artifacts/`. Le paquet `dist/wallpaper` est exporté ; son import et son exécution dans Wallpaper Engine restent à vérifier.

## Verdict

La création/reprise d’un sous-agent et la fin de sa réponse sont observables. Un petit assistant peut représenter ce sous-agent et être relié à son parent. Son identité doit rester stable : une reprise ne doit pas créer un doublon.

Les 22 animations ne correspondent pas à 22 capteurs. Certaines illustrent des événements, d’autres interprètent un nom d’outil, et plusieurs sont des comportements décoratifs. La démo met en scène ces trois catégories ; le mode réel doit conserver cette distinction.

## État initial du prototype, avant les corrections

- Code dans le dossier du projet (racine du dépôt).
- Serveur local : réponse positive de `/health`, service `agent-transit`, version `1.0.0`.
- Compteurs au moment de l’audit : **0 événement Codex, 0 événement Claude**.
- Aucun fichier utilisateur `~/.codex/hooks.json` ; aucune entrée Agent Transit dans les paramètres Claude examinés. Les éventuels hooks d’autres couches de configuration ne sont pas inventoriés ici.
- Codex CLI installé : `0.153.4`. La version de Claude Code n’a pas été confirmée ; aucun exécutable `claude` n’avait été trouvé dans le PATH lors du contrôle initial.
- Le normaliseur et le récepteur HTTP existent. Les commandes d’installation et d’export annoncées dans l’interface pointent encore vers des scripts absents. L’intégration n’est donc **pas livrée ni vérifiée de bout en bout**.
- Les derniers changements demandés sur les bras, le modèle commun sombre de Claude et les planches détaillées restent à appliquer. La proposition d’ordinateur dont le robot change d’identité est rejetée.

## Sources et portée

[Hooks Codex](https://learn.chatgpt.com/docs/hooks) : les événements de cycle de vie exposent notamment le démarrage, le prompt, les appels d’outils locaux, la compaction, les sous-agents, la fin de réponse et l’interruption. Les outils hébergés ne passent pas tous par ces hooks. Les définitions ajoutées doivent être reconnues comme fiables par Codex avant leur exécution.

[Hooks Claude Code](https://code.claude.com/docs/en/hooks) : le cycle de vie comprend les sous-agents, les outils, les notifications et les échecs. `SubagentStart` peut également correspondre à une reprise. `Stop` ne couvre pas une interruption utilisateur. Les notifications ont des conditions de disponibilité et parfois un délai ; leur présence dépend aussi de la version et du client.

Les décisions visuelles ci-dessous sont celles du projet, pas une garantie de couverture universelle fournie par ces produits. Une disponibilité documentée n’est pas une validation sur cette installation.

## Inventaire des 22 animations

**D** : événement documenté, sous réserve de réception effective du hook. **I** : interprétation ou état calculé. **V** : comportement visuel décoratif. « Partiel » signifie que toutes les variantes d’une action ne sont pas observables.

| Animation | Codex | Claude Code | Déclenchement à retenir | Limite et mise en scène proposée |
|---|---|---|---|---|
| 01. Arrivée | D | D | Démarrage/reprise de session | Un changement d’onglet n’est pas un démarrage. Sas, sortie, salut. |
| 02. Veille | I | I | Session connue sans travail en cours confirmé | Absence d’événements ≠ certitude qu’un agent est inactif. Regards et clignements. |
| 03. Marche | V | V | Trajet dans le décor | Déplacement créé par le fond d’écran. Marche réelle en plusieurs poses. |
| 04. Réflexion | I | I | Prompt reçu, attente de la prochaine action | Aucune lecture du raisonnement interne. Grattement de tête et petits pas. |
| 05. Lecture | D/I, partiel | D/I, partiel | Outil de lecture connu ; commande reconnue avec prudence | Un nom d’outil générique ne suffit pas. Sortir, ouvrir, tourner les pages, ranger. |
| 06. Recherche | D/I, partiel | D/I, partiel | Outil de recherche connu | Ne pas promettre la couverture des recherches hébergées Codex. Loupe, inspection, rangement. |
| 07. Écriture | D/I, partiel | D/I, partiel | Outil d’édition connu | Distinguer tentative et succès. Sortir le portable, ouvrir, taper, fermer. |
| 08. Exécution | D, partiel | D, partiel | Début/retour d’un outil observable | Le pré-hook signale une intention ; un autre hook peut encore bloquer l’outil. Machine et clé. |
| 09. Vérification | I | I | Commande ou outil de test explicitement reconnu | Le mot « test » dans une chaîne ne suffit pas. Résultat inconnu sans signal exploitable. Éprouvettes. |
| 10. Envoi | D/I, partiel | D/I, partiel | Appel d’un outil d’envoi identifié | Distinguer demande, résultat accepté et réception. Aucun échange inter-fournisseurs inventé. Capsule. |
| 11. Réception | D pour un retour d’outil | D pour un retour d’outil | Retour d’outil, ou réception explicitement identifiée | Un envoi réussi ne prouve pas à lui seul une lecture par le destinataire. Attraper et ouvrir. |
| 12. Délégation | D | D | Identifiant du sous-agent + session parente | Même ID = même personnage. Retour de résultat distinct d’une destruction. Mini-assistant au sas. |
| 13. Besoin de toi | D/I, partiel | D/I, partiel | Autorisation, outil de question, notification précise | Une question en texte libre n’est pas toujours captée. Un repos n’est pas une autorisation. Drapeau. |
| 14. Incident | D/I, partiel | D/I, partiel | Échec explicite, code de sortie ou statut structuré | Ne pas considérer un résultat opaque comme un succès. Sursaut, fumée, réparation. |
| 15. Tour terminé | D | D | Fin de réponse | Ni réussite de tous les tests, ni objectif achevé ; un hook peut prolonger le travail. Petit salut. |
| 16. Rangement mémoire | D | D selon version | Début/fin de compaction | Compression de contexte, pas suppression de fichiers. Empiler et fermer une boîte. |
| 17. Interruption | D | Partiel | Hook d’interruption Codex ; signal spécifique éventuel côté Claude | Aucun hook global Claude `Interrupt` confirmé dans l’inventaire consulté. Ne pas le simuler comme réel. |
| 18. Sieste | I/V | I/V | Délai après un repos ou une fin observés | Jamais déclenchée seulement parce qu’un outil long reste silencieux. Bâillement, installation, respiration. |
| 19. Réveil | I/V | I/V | Nouveau prompt reçu alors que le personnage repose | Transition visuelle calculée. Œil ouvert, redressement, étirement. |
| 20. Au casier | D/I/V | D/I/V | Fin de session ou retrait visuel après délai | Ni preuve d’archivage réel, ni suppression de conversation. Ouvrir, descendre, refermer. |
| 21. Petit ménage | V | V | Interlude facultatif | Ne représente pas un nettoyage de fichiers. Balai et petits pixels. |
| 22. Signal perdu | D local | D local | Connexion du fond au pont rompue | Cela ne prouve pas que les agents sont arrêtés. Afficher un état inconnu. |

## Défauts reproduits lors de l’audit initial

### Majeurs : exactitude des événements

1. **Faux classement d’outils.** `classifyTool('credit_balance', {})` renvoie `type`, car « edit » est recherché comme simple sous-chaîne dans « credit ». `Bash` avec `echo test` est classé comme test ; `echo type` comme lecture. Il faut des noms explicites ou des commandes réellement identifiées, avec repli générique.
2. **Repos confondu avec demande d’aide.** `Notification` / `idle_prompt` est converti en `wait`. Créer un état de repos distinct ; réserver le drapeau aux demandes précises. D’autres types de notification documentés ne sont pas encore traités.
3. **Risque d’attribution au mauvais agent.** `TeammateIdle` est actuellement traité comme `stop` sans résolution du nom de coéquipier. Il peut arrêter visuellement le parent. Ne rien attribuer tant que la correspondance d’identité n’est pas établie.
4. **Appel d’envoi prématuré.** Une capsule part dès `PreToolUse`, avant le résultat de l’envoi. Un destinataire inconnu est remplacé par le hub. Montrer le chargement avant retour, expédier après résultat approprié et ne pas fabriquer le destinataire.
5. **Délégation confondue avec tentative.** Un outil classé `spawn` peut montrer la gestuelle de délégation avant qu’un sous-agent soit confirmé. La création du personnage doit dépendre exclusivement de l’événement de sous-agent identifié.
6. **Couverture d’erreurs incomplète.** Quelques statuts explicites sont analysés ; tous les formats de sortie possibles ne le sont pas. Conserver « résultat reçu » quand la réussite est inconnue.

### Majeurs : livraison et validation

7. Hooks non installés ; aucun événement réel reçu. Ajouter l’installateur non destructif, tester sur fixtures, puis valider une session de chaque produit. Ne pas annoncer « suivi réel opérationnel » avant cela.
8. Scripts d’export et d’installation absents alors que l’interface les annonce. Les livrer ou corriger l’interface.
9. Le raccord entre toutes les formes d’identifiants de sous-agents, sessions et destinataires n’a pas été testé en situation réelle. Les relations parent/enfant doivent être vérifiées avant tout pet représentant un agent.

### Visuel

10. Le modèle doit être figé avant les nouvelles planches : Codex = petit robot carré blanc de la référence lecture ; Claude = variante sombre à deux antennes. Une seule géométrie de tête/corps partagée par toutes les actions, bras courts et petites moufles.
11. Les planches générées isolément ont dérivé de style. Produire les planches finales à partir du même modèle animé, avec une fiche par action et plusieurs instants réellement différents.

## Reproduction positive : parent / enfant

Dans un `World` isolé en mode live, injection de fixtures `prompt(parent)`, `subagent_start(parent, child)`, puis `subagent_stop(parent, child)` :

```text
parent : id=codex:parent ; parent=null ; état=spawn
enfant : id=codex:child ; parent=codex:parent ; état=arrive
après fin enfant : enfant=celebrate ; parent=spawn
```

Cela valide la relation de base en mémoire, pas la réception de hooks émis par une application réelle.

## Petits compagnons : idées compatibles avec l’audit

- **Mini-assistant réel** : même famille graphique que son parent, plus petit, avec identifiant propre et lien vers le parent. Sort d’un sas à sa première apparition ; se réveille en cas de reprise ; transporte une capsule de résultat au retour. Ne pas le recréer à chaque reprise.
- **Animal résident décoratif** : petit chat ou escargot de maintenance, facultatif. Suit les capsules, joue avec un pixel, dort près des casiers. Ne compte pas dans le nombre d’agents et ne reçoit pas un faux statut de tâche.
- **Messager mécanique** : petit véhicule qui porte les paquets ; c’est un effet du réseau, pas un sous-agent supplémentaire.

## Ordre de correction

1. Corriger les faux positifs, les identités et la distinction tentative / résultat / repos.
2. Tester la chaîne d’événements avec fixtures isolées, y compris deux agents simultanés, reprise, interruption, outil long, erreur et déconnexion.
3. Livrer la connexion locale et confirmer ce qui arrive réellement depuis les deux applications.
4. Figer les deux modèles, détailler les 22 séquences et exporter une planche par action.
5. Ajouter les compagnons optionnels sans brouiller la lecture de l’activité.

Cette liste décrit les constats initiaux. La section de mise à jour en tête du document précise les corrections livrées et les validations qui restent à effectuer.
