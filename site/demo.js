// GitHub Pages demo: no local relay exists here, so we stand in for the two
// EventSource streams app.js opens (/stream and /audio/stream) and switch the
// world to its built-in decorative demo cycle. Nothing in public/ is modified.
(function () {
  const bands = new Float32Array(48), phase = Array.from({ length: 48 }, (_, i) => i * 0.37);
  function synth(t) {
    const beat = Math.pow(Math.max(0, Math.sin(t * Math.PI * 2 * 1.9)), 6);
    for (let i = 0; i < 48; i++) {
      const base = 0.62 - i / 48 * 0.42;
      const wobble = 0.5 + 0.5 * Math.sin(t * (0.9 + i * 0.05) + phase[i]);
      const target = Math.max(0, Math.min(1, base * wobble * 0.75 + beat * (i < 10 ? 0.35 : 0.08)));
      bands[i] += (target - bands[i]) * (target > bands[i] ? 0.45 : 0.18);
    }
    return Array.from(bands, v => Math.round(v * 1000) / 1000);
  }
  class DemoSource {
    constructor(url) {
      this.url = String(url); this.readyState = 0; this.onopen = null; this.onmessage = null; this.onerror = null;
      setTimeout(() => {
        if (this.readyState === 2) return;
        this.readyState = 1; this.onopen?.({});
        if (this.url.includes('/audio/stream')) {
          const start = performance.now();
          this.timer = setInterval(() => this.onmessage?.({ data: JSON.stringify({ status: 'live', bands: synth((performance.now() - start) / 1000) }) }), 50);
        }
      }, 80);
    }
    close() { clearInterval(this.timer); this.readyState = 2; }
  }
  window.EventSource = DemoSource;
  document.addEventListener('DOMContentLoaded', () => {
    const app = window.TransitApp; if (!app) return;
    app.world.mode = 'demo'; app.world.connection = 'open';
    app.world.demoPopulation = Math.min(8, Math.max(4, Math.round(window.innerWidth / 260)));
    app.renderer.settings.bottomMargin = 0; app.renderer.settings.scale = 1.4;
    app.renderer.resize(); app.renderer.draw();
    scheduleSubagents(app.world);
  });

  // The built-in demo cycle (112 s, see public/world.js) spawns a single mini-bot.
  // Layer a few more sub-agents on top of it so the house door stays busy: they
  // come out, orbit their parent, do some work and walk back in. Offsets are
  // seconds inside the cycle; parents are the demo agents created by the cycle.
  const SUBS = [
    [14, 'codex',  'demo-0', 'demo-0:a', 'subagent_start', { label: 'Scout' }],
    [17, 'codex',  'demo-0', 'demo-0:b', 'subagent_start', { label: 'Tester' }],
    [21, 'codex',  'demo-0', 'demo-0:a', 'tool_start', { action: 'read', toolId: 'r' }],
    [23, 'codex',  'demo-0', 'demo-0:b', 'tool_start', { action: 'test', toolId: 't' }],
    [33, 'codex',  'demo-0', 'demo-0:a', 'tool_end', { toolId: 'r' }],
    [37, 'codex',  'demo-0', 'demo-0:a', 'subagent_stop', {}],
    [40, 'codex',  'demo-0', 'demo-0:b', 'tool_end', { toolId: 't' }],
    [43, 'codex',  'demo-0', 'demo-0:b', 'subagent_stop', {}],
    [50, 'claude', 'demo-1', 'demo-1:a', 'subagent_start', { label: 'Mini Miette' }],
    [54, 'claude', 'demo-1', 'demo-1:a', 'tool_start', { action: 'search', toolId: 's' }],
    [66, 'claude', 'demo-1', 'demo-1:a', 'tool_end', { toolId: 's' }],
    [70, 'claude', 'demo-1', 'demo-1:a', 'subagent_stop', {}],
    [78, 'codex',  'demo-4', 'demo-4:a', 'subagent_start', { label: 'Echo II' }],
    [80, 'codex',  'demo-4', 'demo-4:b', 'subagent_start', { label: 'Echo III' }],
    [83, 'codex',  'demo-4', 'demo-4:a', 'tool_start', { action: 'type', toolId: 'y' }],
    [85, 'codex',  'demo-4', 'demo-4:b', 'tool_start', { action: 'tool', toolId: 'o' }],
    [95, 'codex',  'demo-4', 'demo-4:a', 'tool_end', { toolId: 'y' }],
    [98, 'codex',  'demo-4', 'demo-4:a', 'subagent_stop', {}],
    [100, 'codex', 'demo-4', 'demo-4:b', 'tool_end', { toolId: 'o' }],
    [104, 'codex', 'demo-4', 'demo-4:b', 'subagent_stop', {}],
  ];
  function scheduleSubagents(world) {
    let cycle = -1, fired = new Set();
    // Piggyback on world.update so it also works when TransitApp.advance() fast-forwards time.
    const update = world.update.bind(world);
    world.update = dt => {
      update(dt);
      if (world.mode !== 'demo') return;
      const c = Math.floor(world.time / 112), t = world.time % 112;
      if (c !== cycle) { cycle = c; fired = new Set(); }
      SUBS.forEach((row, i) => {
        const [at, provider, sessionId, agentId, type, extra] = row;
        if (fired.has(i) || at > t) return;
        fired.add(i);
        if (!world.agents.has(`${provider}:${sessionId}`)) return; // parent not in this cycle
        world.apply({ id: `sub-${c}-${i}`, provider, sessionId, agentId, type, ...extra });
      });
    };
  }
})();
