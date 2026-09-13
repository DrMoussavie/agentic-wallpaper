# Petites interactions du jardin

## Prompts, réponses et bulles

Les événements `UserPromptSubmit` Codex et Claude Code deviennent des enveloppes
`PROMPT`. Elles partent du terminal, accélèrent dans un conduit temporaire,
laissent une traînée de pixels puis ralentissent à l’arrivée. Le robot annonce
« Incoming! », « New mission! » ou « Oh, a prompt! », puis reçoit le courrier
avec une petite gerbe de pixels et « New quest! ». Le contenu du prompt n’est
jamais affiché. Un robot encore dans la maison reçoit son courrier à la porte.

Le signal `Stop` envoie une enveloppe `REPLY` vers le terminal. Le robot célèbre
la fin de son tour puis rentre avec une variante comme « Clocking out! » ou
« Home, sweet home! ». Cela marque la fin d’une réponse, pas la validation de
l’objectif complet. Une nouvelle demande fait ressortir la même identité.

Les autres petits points restent des transferts d’activité. Les messages vers
un autre agent nécessitent un destinataire connu et un résultat d’envoi reconnu.
Le réglage des conduits masque les lignes ; les enveloppes de prompt et réponse
restent visibles pour garder l’événement compréhensible.

Les bulles sont en anglais, brèves et avec plusieurs variantes. Des apartés
occasionnels (« Listening. .. ... .. . », « Seriously, bits? »…) et des réactions
au volume donnent du caractère. Les réactions au son utilisent les niveaux déjà
calculés pour le spectre, sans nouvelle capture. Il s’agit d’animations
décoratives : aucune écoute sémantique ni humeur réelle de l’agent n’est déduite.
Les attentes et erreurs gardent la priorité. Le modèle des robots est inchangé.
Le réglage **Taille des bulles** agrandit les textes et leur cadre ensemble,
indépendamment des robots. Il est aussi exporté dans les propriétés Wallpaper Engine.

## Le chien et la balle

Activer **Chien guide · attentes et erreurs** et **Balle à lancer**.

- Cliquer dans un espace vide sort une seule balle pixel art.
- La saisir puis glisser-lâcher permet de la lancer. Passer le curseur dessous
  la fait rebondir. Les rebonds sur les bords et le sol s’amortissent.
- Une petite bulle « Grab me! » apparaît occasionnellement au-dessus de la balle.
- Après **4 secondes d’immobilité**, le chien vient chercher la balle.
- Si le joueur la reprend ou la fait rebondir avant qu’il la touche, le chien
  abandonne immédiatement et reprend sa promenade.
- Une fois attrapée, le chien la porte puis la range dans le petit panier près
  de la maison. Cliquer le panier permet de la ressortir.
- Un agent qui attend une intervention ou rencontre une erreur passe avant le
  jeu. Cliquer le chien permet alors de repérer cet agent.
- Sans chien disponible, la balle se range automatiquement après 25 secondes
  sans interaction. Désactiver la balle la masque immédiatement.

La balle est un seul objet Canvas, sans moteur physique externe ni intervalle
supplémentaire. Sa physique utilise des pas bornés dans la boucle du fond.
La pause et le masquage du fond suspendent sa simulation. La capture du pointeur
est libérée si la fenêtre perd le focus ou si le geste est annulé.

## Les mini-bots

`SubagentStart` et `SubagentStop` sont normalisés pour Codex et Claude Code avec
les identifiants enfant et parent. L’en-tête de session Codex peut aussi compléter
une filiation manquée. Sans relation observée, le jardin n’invente pas de groupe.

Un sous-agent affiche le même modèle à 62 % de la taille du robot principal.
Il sort de la maison puis rejoint une orbite douce autour de son parent, avec
des places espacées et plusieurs anneaux si nécessaire. Son animation d’outil
reste visible pendant ce mouvement. Une attente ou une erreur arrête son orbite.
Si le parent n’est plus dehors, il poursuit sa vie individuellement. Sa propre
fin de tour le fait rentrer. Les mouvements ne créent aucune session réelle.

Dans **Démo animée**, deux boutons permettent de montrer un prompt et une bande
de mini-bots des deux familles. Ces exemples restent strictement dans la démo.

## Installation Wallpaper Engine

Lancer `Lancer-Agent-Transit.ps1`, puis importer
`dist/wallpaper/wallpaper.html` dans **Créer un fond d’écran** de l’éditeur
Wallpaper Engine. Enregistrer puis sélectionner le fond et l’écran voulu.
Garder le mode démo désactivé. Activer le chien dans les propriétés du fond.

Le relais local doit rester lancé pour les vrais agents et le son du PC.
Après redémarrage du PC, relancer le script. Fermer le navigateur ne coupe pas
le relais. Aucun démarrage automatique Windows n’est installé.
Wallpaper Engine copie les fichiers : après une nouvelle version, refaire
`npm run export` puis mettre à jour la copie du projet importé, accessible via
**Édition → Ouvrir dans l’explorateur**.

Source : [import d’un fond Web dans Wallpaper Engine](https://docs.wallpaperengine.io/en/web/first/gettingstarted.html).
Le rendu a été exécuté dans le navigateur local ; l’exécution dans Wallpaper
Engine reste à vérifier sur ce poste.
