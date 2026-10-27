// Nova App SDK: include this in any app to get controller input, saving and OS messages.
const Nova = (() => {
  const keys = {};
  let cur = {}, prev = {};
  addEventListener('keydown', (e) => {
    if (e.key === 'F1' || e.key === 'Home') { e.preventDefault(); Nova.home(); return; }
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') e.preventDefault();
  });
  addEventListener('keyup', (e) => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  function padState() {
    const p = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
    if (!p) return {};
    const b = (i) => p.buttons[i] && p.buttons[i].pressed;
    return {
      up: b(12) || p.axes[1] < -0.5, down: b(13) || p.axes[1] > 0.5,
      left: b(14) || p.axes[0] < -0.5, right: b(15) || p.axes[0] > 0.5,
      a: b(0), b: b(1), x: b(2), y: b(3), start: b(9), select: b(8),
      ax: Math.abs(p.axes[0]) > 0.15 ? p.axes[0] : 0, ay: Math.abs(p.axes[1]) > 0.15 ? p.axes[1] : 0,
    };
  }

  return {
    // call once per frame, then read Nova.down('left') or Nova.tap('a')
    poll() {
      prev = cur;
      const p = padState();
      const k = (...codes) => codes.some((c) => keys[c]);
      cur = {
        up: k('ArrowUp', 'KeyW') || p.up, down: k('ArrowDown', 'KeyS') || p.down,
        left: k('ArrowLeft', 'KeyA') || p.left, right: k('ArrowRight', 'KeyD') || p.right,
        a: k('Enter', 'Space') || p.a, b: k('Escape', 'Backspace') || p.b,
        x: k('KeyX', 'KeyJ') || p.x, y: k('KeyY', 'KeyK') || p.y,
        start: k('KeyP', 'Enter') || p.start, select: p.select,
        ax: p.ax || 0, ay: p.ay || 0,
      };
      if (cur.select && !prev.select) Nova.guide();
      return cur;
    },
    down: (n) => !!cur[n],
    tap: (n) => !!cur[n] && !prev[n],
    key: (code) => !!keys[code],
    home: () => parent.postMessage({ nova: 'home' }, '*'),
    guide: () => parent.postMessage({ nova: 'guide' }, '*'),
    toast: (text) => parent.postMessage({ nova: 'toast', text }, '*'),
    save(k, v) { try { localStorage.setItem('nova.app.' + k, JSON.stringify(v)); } catch (_) {} },
    load(k, d) { try { const v = localStorage.getItem('nova.app.' + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    beep(freq = 440, len = 0.08, type = 'square', vol = 0.04) {
      try {
        Nova._ctx = Nova._ctx || new AudioContext();
        const c = Nova._ctx, o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + len);
        o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + len);
      } catch (_) {}
    },
  };
})();
