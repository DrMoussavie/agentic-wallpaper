# Reset, vérification locale et spectre audio

Dans la station : **En ce moment → Reset et revérification**.
Le bouton reconstruit uniquement le monde affiché. Aucun arrêt, redémarrage ou
message n’est envoyé à Codex ou Claude.

Les conversations Codex déjà observées sont retrouvées par leur identifiant :
leur dernier tour est lu dans la table de métadonnées locale `thread_turns`.
Seules les colonnes identifiant, statut et dates sont interrogées, en lecture
seule ; les messages et résultats d’outils ne sont pas lus.
Un Codex dont le dernier tour est `inProgress` reste présent après reset.
Les identités sans état vérifiable, dont les conversations principales Claude, reviennent au prochain
hook réel. Le reset ne découvre pas les sessions qui n’ont jamais envoyé de hook.
Le compteur d’événements repart de zéro.

Toutes les **60 secondes**, le relais vérifie les identités déjà observées,
au maximum 64. Une fin confirmée postérieure au dernier hook fait rentrer
le robot dans la maison. Un délai de silence ne suffit jamais à arrêter un agent.
Un hook arrivé pendant la lecture est prioritaire.
Le format local de Codex peut évoluer : si la base ou son schéma ne sont pas
disponibles, le relais conserve les états existants et indique le nombre inconnu.
Les sous-agents Claude déjà identifiés sont aussi vérifiés dans leurs journaux locaux : fin de réponse explicite ou marqueur exact d’interruption. Une reprise postérieure reste prioritaire. Les conversations principales Claude restent suivies par leurs hooks. Le lecteur ne renvoie que le statut et sa date, lit au maximum 256 Ko par sous-agent, et met les fichiers inchangés en cache. Aucun arrêt n’est déduit de la seule durée du silence.

Une base Codex peut aussi conserver un ancien tour `inProgress` après sa fin.
Le relais compare donc ce résultat avec les marqueurs `task_started`,
`task_complete` et `turn_aborted` dans les 256 Ko de fin du journal de la session
correspondante. Seuls le type et l’horodatage de ces enveloppes sont retenus ;
les textes de conversation présents dans les blocs lus ne sont ni retournés,
ni sauvegardés, ni envoyés au fond. Les fichiers inchangés utilisent le cache.
La preuve la plus récente prime, et un hook plus récent garde la priorité.
La même vérification s’effectue au redémarrage du relais.

Les relations parent/enfant manquées à l’activation des hooks Codex sont
récupérées depuis le premier en-tête des fichiers de sessions locaux.
L’en-tête est plafonné à 256 Ko et mis en cache ; aucun dialogue n’est transféré.
Les sous-agents sont plus petits et comptés séparément des conversations.

## Son du PC

Wallpaper Engine et le navigateur utilisent par défaut le même flux du relais : 48 bandes logarithmiques de 40 Hz à 20 kHz. Le mode natif WE sans relais reste une option explicitement décorative, avec ses étiquettes Graves / Aigus. Il ne remplace jamais automatiquement le spectre précis. Le titre et l’artiste utilisent son intégration multimédia Windows, quand un lecteur les fournit. La largeur du spectre est réglable de 20 à 100 %, ancrée en bas à gauche.

Les détails de mesure ci-dessous concernent le spectre précis, dans le navigateur comme dans Wallpaper Engine.

Le bas de l’écran affiche **48 bandes logarithmiques de 40 Hz à 20 kHz**.
WASAPI récupère la sortie Windows par défaut en mode partagé, à 48 kHz.
Une fenêtre de Hann de 8 192 échantillons sert à calculer le spectre 20 fois
par seconde (résolution FFT : environ 5,86 Hz). Les niveaux de chaque bande
ont une échelle visuelle en décibels, lissée, avec un seuil à −65 dBFS.
Ce n’est pas une mesure du niveau sonore acoustique de la pièce.
Les puissances des canaux sont combinées après FFT pour éviter l’annulation
de signaux stéréo en opposition de phase.

Il n’y a aucune acquisition du microphone, sauvegarde audio, transcription ou
transfert extérieur. Le relais reçoit uniquement les 48 niveaux, jamais le PCM.
La sortie par défaut est revérifiée toutes les 3 secondes. Au silence les barres
retombent à zéro ; en cas de panne, l’interface indique « Audio indisponible ».
Certains périphériques/sons protégés peuvent ne pas être capturables.

Un seul processus d’analyse alimente tous les aperçus et fonds ouverts.
Il est arrêté après 10 secondes sans client audio. Les aperçus masqués, la pause
et la propriété audio désactivée ferment leur connexion. Le rendu normal reste
plafonné à 30 images/s, ou au réglage Wallpaper Engine.

Déjà installé sur ce PC dans `.local/audio-venv`. Pour réinstaller :
`Installer-Audio.ps1`, puis relancer le relais. Python 3.11+ est nécessaire.
`TRANSIT_PYTHON` peut désigner un interpréteur Python direct. Sur Windows,
le relais utilise l’interpréteur de base de l’environnement pour éviter de
laisser un processus enfant de lanceur Python après un arrêt.

Dans Wallpaper Engine, réimporter/mettre à jour `dist/wallpaper` et laisser
le relais local lancé. La propriété **Spectre du son du PC** active les barres.
Le spectre utilise la sortie par défaut Windows, indépendamment du périphérique
audio choisi dans Wallpaper Engine.
L’API audio Web de Wallpaper Engine fournit des bandes sans correspondance
exacte documentée en hertz ; le calcul local permet ici d’afficher une échelle Hz.

Sources : [API audio Wallpaper Engine](https://docs.wallpaperengine.io/en/web/audio/visualizer.html),
[SoundCard / WASAPI](https://soundcard.readthedocs.io/en/stable/).

## Vérification

`npm.cmd test` couvre les hooks, les deux familles, le rendu, la filiation tardive,
le reset, les événements concurrents et le clic dans la partie basse.
`python tests/audio_status_test.py` vérifie les fréquences connues (80 Hz à
19 kHz), le silence, la stéréo inversée et une base de statuts fictive.
Ces tests ne créent pas de conversation réelle et ne diffusent aucun son.

Le 12 septembre 2026, une capture non silencieuse a révélé un échec de SoundCard
0.4.5 avec NumPy 2.4.6 : cette version utilisait le mode binaire supprimé de
`numpy.fromstring`. La dépendance est maintenant fixée à **SoundCard 0.4.6**,
qui utilise `frombuffer(...).copy()`. `tests/wasapi_capture_test.py` exerce la
conversion réelle du tampon non silencieux avec des données fictives ; il se
lance avec `.local/audio-venv/Scripts/python.exe`.

Le contrôle réel `node scripts/check-audio.mjs --require-signal` a ensuite reçu
60 trames, toutes non nulles, dont 59 différentes, en 2,918 secondes. Le rapport
agrégé est dans `artifacts/audio-live-verified.json`. Aucun enregistrement audio
n’est conservé. Un test silencieux seul ne démontre pas une capture fonctionnelle
quand du son est effectivement joué.

Toutes les fréquences partagent maintenant le même dégradé vertical : vert doux
en bas, jaune puis orange, et rouge au sommet. La couleur représente la hauteur
de la barre, pas sa fréquence. Les nouvelles interactions et le chien sont
documentés dans [INTERACTIONS.md](INTERACTIONS.md).
