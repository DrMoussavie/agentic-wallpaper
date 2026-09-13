# Installer Agent Transit sur Wallpaper Engine

*English version: [INSTALL-WALLPAPER-ENGINE.md](INSTALL-WALLPAPER-ENGINE.md)*

Agent Transit est un **fond Web** : un dossier avec un `project.json`, une page HTML et ses ressources. Wallpaper Engine l'affiche avec son navigateur intégré. Pas d'installateur, pas de droits administrateur.

Il y a deux niveaux :

| Niveau | Ce que tu obtiens | Il faut |
|---|---|---|
| **Fond seul** | Le jardin, la maison, le chien, la balle, le spectre audio natif, tous les réglages visuels | Wallpaper Engine (Steam, Windows) |
| **Agents réels** | Tes vraies sessions Claude Code / Codex en robots, les sous-agents, le spectre précis 40 Hz–20 kHz, le titre de la musique | + le relais local (Node ≥ 20) et les hooks, voir [partie 2](#partie-2--brancher-tes-vrais-agents) |

Commence par la partie 1 ; elle fonctionne seule.

---

## Partie 1 — Le fond d'écran (5 minutes)

### 1. Télécharger

Récupère le dernier **`agent-transit-wallpaper.zip`** sur la [page Releases](https://github.com/DrMoussavie/agentic-wallpaper/releases/latest) et décompresse-le. Tu obtiens un dossier `agent-transit` contenant `project.json`, `wallpaper.html`, `preview.png` et un dossier `assets`.

> Pour le construire toi-même : `npm install && npm run export` produit le même dossier dans `dist/wallpaper`.

### 2. Trouver le dossier de Wallpaper Engine

Dans Steam : **Bibliothèque → Wallpaper Engine → clic droit → Gérer → Parcourir les fichiers locaux**. En général :

```
C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine
```

### 3. Copier le dossier

Place le dossier décompressé ici (crée `myprojects` s'il n'existe pas) :

```
…\wallpaper_engine\projects\myprojects\agent-transit\
    ├── project.json
    ├── wallpaper.html
    ├── preview.png
    ├── assets\
    └── *.js
```

`project.json` doit être directement dans `agent-transit`, pas un niveau plus bas.

### 4. Le sélectionner dans Wallpaper Engine

1. Ouvre Wallpaper Engine (icône de la zone de notification → **Ouvrir Wallpaper Engine**).
2. Dans l'onglet **Installés**, le fond **Agent Transit** apparaît avec son aperçu. Si tu as beaucoup de fonds, utilise le filtre à droite et coche **Mes projets** / **Local**, ou tape `Agent Transit` dans la recherche.
3. Clique dessus. Avec plusieurs écrans, choisis d'abord l'écran en bas de la fenêtre.

Le jardin s'affiche tout de suite : la maison en haut à gauche, l'herbe, les pierres, et le message « LE JARDIN EST PRÊT » tant qu'aucun agent n'est connecté.

### 5. Réglages (panneau de droite)

Tout s'applique en direct, sans redémarrage.

| Réglage | Défaut | Notes |
|---|---|---|
| Fond | Noir absolu | Aussi : bleu nuit, micro-points |
| Taille des personnages | Petits | Miniatures / Petits / Plus grands |
| Conduits de données | activé | Les lignes animées qui transportent prompts et résultats |
| Chien guide | activé | Patrouille, signale attentes et erreurs, rapporte la balle |
| Balle à lancer | activé | Glisse sur le bureau pour lancer ; le chien la range |
| Promenades / Rencontres | activé | Les robots disponibles se baladent et se saluent |
| Bulles / taille | activé / Lisibles | Petites phrases en anglais |
| Spectre du son du PC | activé | En bas à gauche, 48 bandes |
| Source du spectre | Relais local | Passe sur **Audio natif WE** si tu **ne** lances **pas** le relais |
| Largeur du spectre | 35 % | 20–100 % |
| Marge basse | 80 px | Garde le spectre au-dessus de la barre des tâches |
| Titre et artiste | désactivé | Nécessite l'*intégration multimédia* de Wallpaper Engine |

**Si tu ne lances pas le relais**, mets *Source du spectre* sur *Audio natif WE* — sinon le spectre affiche « RELAIS AUDIO DÉCONNECTÉ ». C'est voulu : le fond n'invente jamais de signal.

### 6. Réglages Wallpaper Engine conseillés

- **Paramètres → Général → Démarrer avec Windows** : activé, pour avoir le jardin dès le démarrage.
- **Paramètres → Performance** : le fond suit les FPS choisis (30 par défaut, 60 max) et se met en pause quand une application plein écran tourne.
- **Paramètres → Général → Entrée audio** : à garder activée si tu utilises le spectre natif.

### Dépannage

| Symptôme | Solution |
|---|---|
| Agent Transit n'apparaît pas dans Installés | Vérifie que `project.json` est directement dans `projects\myprojects\agent-transit\`. Redémarre Wallpaper Engine. |
| Écran noir, rien de dessiné | Wallpaper Engine → Paramètres → Général → vérifie que le moteur navigateur (CEF) n'est pas bloqué par un antivirus. Teste un autre fond Web pour confirmer. |
| « RELAIS AUDIO DÉCONNECTÉ » | Lance le relais (partie 2) ou passe *Source du spectre* sur *Audio natif WE*. |
| Aucun robot n'apparaît | Normal sans relais. Le fond n'affiche que de vraies sessions ; il n'y a pas de faux agents. |
| Texte flou | Wallpaper Engine → Paramètres → Performance → qualité *Élevée* ; le fond rend à la résolution native. |

---

## Partie 2 — Brancher tes vrais agents

C'est ce qui rend le jardin vivant. Il faut [Node.js 20+](https://nodejs.org/) et un clone de ce dépôt, laissé en place (les hooks pointent dessus).

### Option rapide : laisser ton agent installer

Colle ce texte dans **Claude Code** ou **Codex** sur ton PC Windows. Il installe exactement ce qu'il faut, pour les deux applications, puis te liste les deux clics qu'il ne peut pas faire à ta place.

```text
Install Agent Transit from https://github.com/DrMoussavie/agentic-wallpaper on this Windows PC so it works with BOTH Claude Code and Codex.

1. Check Node.js >= 20 is available (install it with winget if not).
2. Clone the repo into a permanent folder, e.g. %USERPROFILE%\agent-transit, then run: npm install
3. Run: npm run hooks:install  (it merges the hooks into ~/.claude/settings.json and the Codex config, keeps backups, changes nothing else).
4. Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/configure-startup.ps1  so the relay starts with Windows, then start it now in the background with: npm start
5. Verify http://127.0.0.1:49157/health answers.
6. Run: npm run export  and copy dist/wallpaper to <Steam>\steamapps\common\wallpaper_engine\projects\myprojects\agent-transit (find my Steam library path first).
7. Finish by listing what I must do by hand: approve the hooks in the Codex app (Settings → Hooks → From configuration → Approve), and select "Agent Transit" in Wallpaper Engine → Installed.

Do not touch anything else in my Claude Code or Codex settings.
```

### Option manuelle

```powershell
git clone https://github.com/DrMoussavie/agentic-wallpaper
cd agentic-wallpaper
npm install
npm run hooks:install
```

`hooks:install` fusionne les entrées Agent Transit dans `~/.claude/settings.json` (Claude Code) et dans la configuration Codex, sauvegarde les originaux dans `.local/backups` et ne touche à rien d'autre. `npm run hooks:remove` les retire.

### Approuver les hooks

- **Application Codex** : *Paramètres → Hooks → Issus de la configuration*, vérifie les commandes qui pointent vers `bridge/hook.mjs codex`, clique **Approuver** sur chacune. Les hooks non approuvés sont ignorés en silence.
- **Claude Code** (application, onglet *Code*, ou CLI) : les hooks de `~/.claude/settings.json` sont pris en compte automatiquement ; redémarre ou reprends une session pour être sûr.

### Lancer le relais

```powershell
npm start
```

Le relais n'écoute que sur `http://127.0.0.1:49157`. Ouvre `http://127.0.0.1:49157/` pour voir le Studio, envoie un message dans n'importe quelle session locale Claude Code ou Codex : un robot doit sortir de la maison. `http://127.0.0.1:49157/health` donne les compteurs d'événements par fournisseur.

Pour le lancer en silence avec Windows (sans console ni navigateur) :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/configure-startup.ps1
```

Cela crée un seul raccourci dans ton dossier Démarrage. Même commande avec `-Remove` pour l'enlever.

### Ce qui est envoyé (et ce qui ne l'est pas)

- Les identifiants de session sont hachés. Les prompts, messages, contenus de fichiers et commandes n'atteignent **jamais** le fond — seulement le type d'activité (lecture, recherche, test, attente, erreur…).
- Les hooks renvoient `{}` immédiatement et ne bloquent ni ne décident rien pour l'agent.
- Aucune API de modèle n'est appelée, aucune clé API n'est nécessaire.
- Les sessions cloud ou SSH tournent ailleurs et ne sont pas reliées ; seules les sessions Windows locales le sont.

Le détail de ce qui est détectable ou non : [AUDIT-DETECTION.md](AUDIT-DETECTION.md).

---

## Mise à jour

Télécharge le nouveau zip, remplace le contenu de `projects\myprojects\agent-transit\`, puis resélectionne le fond. Wallpaper Engine conserve tes réglages. Pour le relais : `git pull` puis relance-le.
