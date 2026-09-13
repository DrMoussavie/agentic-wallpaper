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
  });
})();
