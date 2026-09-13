# Installing Agent Transit on Wallpaper Engine

*Version française : [INSTALLATION-WALLPAPER-ENGINE.fr.md](INSTALLATION-WALLPAPER-ENGINE.fr.md)*

Agent Transit is a **web wallpaper**: a folder with a `project.json`, an HTML file and its assets. Wallpaper Engine renders it with its built-in browser. No installer, no admin rights.

There are two layers:

| Layer | What you get | Needs |
|---|---|---|
| **Wallpaper only** | The garden, the house, the dog, the ball, the native audio spectrum, all visual settings | Wallpaper Engine (Steam, Windows) |
| **Live agents** | Your real Claude Code / Codex sessions as robots, sub-agents, precise 40 Hz–20 kHz spectrum, track title | + the local relay (Node ≥ 20) and the hooks, see [part 2](#part-2--connect-your-real-agents) |

Start with part 1; it works on its own.

---

## Part 1 — The wallpaper (5 minutes)

### 1. Download

Grab the latest **`agent-transit-wallpaper.zip`** from the [Releases page](https://github.com/DrMoussavie/agentic-wallpaper/releases/latest) and unzip it. You get a folder named `agent-transit` containing `project.json`, `wallpaper.html`, `preview.png` and an `assets` folder.

> Building it yourself instead: `npm install && npm run export` produces the same folder in `dist/wallpaper`.

### 2. Find your Wallpaper Engine folder

In Steam: **Library → Wallpaper Engine → right-click → Manage → Browse local files**. On most PCs this is:

```
C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine
```

### 3. Copy the folder

Put the unzipped folder here (create `myprojects` if it does not exist):

```
…\wallpaper_engine\projects\myprojects\agent-transit\
    ├── project.json
    ├── wallpaper.html
    ├── preview.png
    ├── assets\
    └── *.js
```

`project.json` must sit directly inside `agent-transit`, not one level deeper.

### 4. Select it in Wallpaper Engine

1. Open Wallpaper Engine (tray icon → **Open Wallpaper Engine**).
2. In the **Installed** tab, the wallpaper **Agent Transit** appears with its preview. If you have many wallpapers, use the filter on the right and tick **My projects** / **Local**, or type `Agent Transit` in the search box.
3. Click it. If you have several monitors, first pick the monitor at the bottom of the window.

The garden shows up immediately: the house top-left, grass and stones, and the message *“LE JARDIN EST PRÊT”* (the garden is ready) until agents connect.

### 5. Settings (right panel)

All of them are live; no restart needed.

| Setting | Default | Notes |
|---|---|---|
| Background | Absolute black | Also: night blue, micro-dots |
| Character size | Small | Miniatures / Small / Larger |
| Data conduits | on | The animated lines that carry prompts and results |
| Guide dog | on | Patrols, flags waits and errors, fetches the ball |
| Ball to throw | on | Drag on the desktop to throw; the dog brings it back |
| Free roaming / Meetings | on | Idle robots wander and greet each other |
| Speech bubbles / size | on / Readable | Short English quips |
| PC sound spectrum | on | Bottom-left, 48 bands |
| Spectrum source | Local relay | Switch to **Native WE audio** if you do **not** run the relay |
| Spectrum width | 35 % | 20–100 % |
| Bottom margin | 80 px | Keeps the spectrum above the taskbar |
| Track title & artist | off | Needs Wallpaper Engine's *media integration* enabled |

**If you do not run the relay**, set *Spectrum source* to *Native WE audio* — otherwise the spectrum shows “RELAIS AUDIO DÉCONNECTÉ” (relay disconnected). That is on purpose: the wallpaper never fakes a signal.

### 6. Recommended Wallpaper Engine settings

- **Settings → General → Start with Windows**: on, so the garden is there at boot.
- **Settings → Performance**: the wallpaper follows the FPS you choose (30 by default, 60 max) and pauses when a fullscreen app runs.
- **Settings → General → Audio input**: keep enabled if you use the native spectrum.

### Troubleshooting

| Symptom | Fix |
|---|---|
| Agent Transit is not in the Installed list | Check that `project.json` is directly in `projects\myprojects\agent-transit\`. Restart Wallpaper Engine. |
| Black screen, nothing drawn | Wallpaper Engine → Settings → General → make sure the browser engine (CEF) is not disabled by an antivirus. Try another web wallpaper to confirm. |
| “RELAIS AUDIO DÉCONNECTÉ” | Either start the relay (part 2) or switch *Spectrum source* to *Native WE audio*. |
| Robots never appear | Expected without the relay. The wallpaper only shows real sessions; there are no fake agents. |
| Text looks blurry | Wallpaper Engine → Settings → Performance → set quality to *High*; the wallpaper renders at native resolution. |

---

## Part 2 — Connect your real agents

This is the part that makes the garden alive. It needs [Node.js 20+](https://nodejs.org/) and a clone of this repository, kept in place (the hooks point at it).

### Fast path: let your agent do it

Paste this into **Claude Code** or **Codex** on your Windows PC. It installs exactly what is needed, for both apps, then lists the two clicks it cannot do for you.

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

### Manual path

```powershell
git clone https://github.com/DrMoussavie/agentic-wallpaper
cd agentic-wallpaper
npm install
npm run hooks:install
```

`hooks:install` merges Agent Transit's hook entries into `~/.claude/settings.json` (Claude Code) and the Codex configuration, backs up the originals in `.local/backups`, and touches nothing else. `npm run hooks:remove` takes them out again.

### Approve the hooks

- **Codex app**: *Settings → Hooks → From configuration*, review the commands pointing to `bridge/hook.mjs codex`, click **Approve** on each. Unapproved hooks are silently ignored.
- **Claude Code** (desktop app, *Code* tab, or the CLI): the hooks in `~/.claude/settings.json` are picked up automatically; restart or resume a session to be sure.

### Start the relay

```powershell
npm start
```

The relay listens on `http://127.0.0.1:49157` only. Open `http://127.0.0.1:49157/` to see the studio, send a message in any local Claude Code or Codex session, and a robot should leave the house. `http://127.0.0.1:49157/health` shows the event counters per provider.

To start it silently with Windows (no console, no browser):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/configure-startup.ps1
```

This creates one shortcut in your Startup folder. Same command with `-Remove` to undo.

### What is (and is not) sent

- Session ids are hashed. Prompts, messages, file contents and commands **never** reach the wallpaper — only the kind of activity (reading, searching, testing, waiting, error…).
- The hooks return `{}` immediately and never block or decide anything for the agent.
- No model API is called and no API key is needed.
- Cloud or SSH sessions run elsewhere and are not connected; only local Windows sessions are.

More detail on what can and cannot be detected: [AUDIT-DETECTION.md](AUDIT-DETECTION.md).

---

## Updating

Download the new zip, replace the contents of `projects\myprojects\agent-transit\`, and re-select the wallpaper. Your settings are kept by Wallpaper Engine. For the relay: `git pull` then restart it.
