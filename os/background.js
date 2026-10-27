// Animated dashboard background: soft light waves with drifting particles.
const THEMES = [
  { name: 'Nova Blue', top: '#0a3a9e', mid: '#0b5bd0', bottom: '#062a78', glow: '#7fd1ff', accent: '#2f8cff' },
  { name: 'Midnight', top: '#0b0f2e', mid: '#1a1f5c', bottom: '#05061a', glow: '#9aa6ff', accent: '#6c7cff' },
  { name: 'Aurora', top: '#04443f', mid: '#0a7a6a', bottom: '#032b3a', glow: '#7fffd8', accent: '#1fd1a8' },
  { name: 'Amethyst', top: '#2e0b5e', mid: '#5b1fa8', bottom: '#1a0638', glow: '#e0a6ff', accent: '#b061ff' },
  { name: 'Ember', top: '#5e0b14', mid: '#a8321f', bottom: '#2e0606', glow: '#ffc49a', accent: '#ff6a3d' },
  { name: 'Carbon', top: '#1c1f26', mid: '#2c313b', bottom: '#0b0c10', glow: '#c9d3e6', accent: '#8aa0c8' },
];

const Background = (() => {
  const c = document.getElementById('bg');
  const x = c.getContext('2d');
  let theme = THEMES[0], animate = true, paused = false, w = 0, h = 0, t = 0, last = 0;
  const dots = Array.from({ length: 80 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 2.2 + 0.4, s: Math.random() * 0.25 + 0.05, p: Math.random() * 6.28 }));

  function size() {
    const d = Math.min(window.devicePixelRatio || 1, 1.5);
    w = innerWidth; h = innerHeight;
    c.width = w * d; c.height = h * d;
    x.setTransform(d, 0, 0, d, 0, 0);
  }
  addEventListener('resize', () => { size(); draw(); });

  function wave(yBase, amp, freq, speed, phase, alpha, thick) {
    x.beginPath();
    for (let i = 0; i <= w + 20; i += 20) {
      const y = yBase + Math.sin(i * freq + t * speed + phase) * amp + Math.sin(i * freq * 2.3 + t * speed * 0.6) * amp * 0.35;
      i ? x.lineTo(i, y) : x.moveTo(i, y);
    }
    if (thick) {
      x.lineTo(w, h); x.lineTo(0, h); x.closePath();
      const g = x.createLinearGradient(0, yBase - amp, 0, h);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`); g.addColorStop(0.4, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fill();
    } else {
      x.strokeStyle = `rgba(255,255,255,${alpha})`; x.lineWidth = 1.2; x.stroke();
    }
  }

  function draw() {
    const g = x.createLinearGradient(0, 0, w * 0.4, h);
    g.addColorStop(0, theme.top); g.addColorStop(0.55, theme.mid); g.addColorStop(1, theme.bottom);
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = x.createRadialGradient(w * 0.75, h * 0.15, 0, w * 0.75, h * 0.15, w * 0.6);
    r.addColorStop(0, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = r; x.fillRect(0, 0, w, h);

    wave(h * 0.62, 40, 0.0028, 0.25, 0, 0.10, true);
    wave(h * 0.70, 30, 0.0035, -0.18, 2, 0.08, true);
    for (let k = 0; k < 6; k++) wave(h * (0.58 + k * 0.025), 34 + k * 4, 0.0026 + k * 0.0001, 0.22, k * 0.35, 0.10 - k * 0.012, false);

    for (const d of dots) {
      const px = ((d.x + t * d.s * 0.02) % 1) * w;
      const py = ((d.y - t * d.s * 0.012 + 1) % 1) * h;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + d.p));
      x.beginPath(); x.arc(px, py, d.r, 0, 6.283);
      x.fillStyle = `rgba(255,255,255,${0.55 * tw})`;
      x.shadowBlur = 8; x.shadowColor = theme.glow; x.fill();
    }
    x.shadowBlur = 0;
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (animate && !paused) { t += dt; draw(); }
    requestAnimationFrame(loop);
  }
  size(); draw(); requestAnimationFrame(loop);

  return {
    setTheme(i) { theme = THEMES[i] || THEMES[0]; draw(); },
    setAnimate(v) { animate = v; draw(); },
    pause(v) { paused = v; },
  };
})();
