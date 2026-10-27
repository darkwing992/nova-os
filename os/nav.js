// Console-style navigation: arrow keys / D-pad move between things, Enter / A picks, Esc / B goes back.
const Nav = (() => {
  let backHandler = () => {};
  let homeHandler = () => {};
  let guideHandler = () => {};
  let suspended = false; // true while an app is running (the app gets the controller)

  function visible(el) {
    if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // The layer that currently owns input (top-most overlay first).
  function scope() {
    for (const id of ['detail', 'guide', 'setup', 'welcome', 'appView']) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('hidden')) return el;
    }
    return document.getElementById('shell');
  }

  function candidates() {
    return [...scope().querySelectorAll('.nav')].filter((el) => visible(el) && !el.disabled);
  }

  function focus(el) {
    if (!el) return;
    el.focus({ preventScroll: true });
    // the Home bar slides itself; everything else scrolls into view
    if (!el.closest('.bar')) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    Sound.play('move');
  }

  function move(dir) {
    const list = candidates();
    const cur = document.activeElement;
    if (!list.includes(cur)) return focus(list[0]);
    const a = cur.getBoundingClientRect();
    const ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    let best = null, bestScore = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      // tiles off the right edge of the Home bar are still reachable one step at a time
      if (cur.closest('.bar') && el.closest('.bar') && (dir === 'left' || dir === 'right')) {
        const tiles = [...cur.parentElement.children];
        const next = tiles[tiles.indexOf(cur) + (dir === 'right' ? 1 : -1)];
        if (next) return focus(next);
        return;
      }
      const b = el.getBoundingClientRect();
      const bx = b.left + b.width / 2, by = b.top + b.height / 2;
      const dx = bx - ax, dy = by - ay;
      let main, side;
      if (dir === 'left') { if (b.right > a.left + 1 && dx >= -1) continue; main = -dx; side = dy; }
      if (dir === 'right') { if (b.left < a.right - 1 && dx <= 1) continue; main = dx; side = dy; }
      if (dir === 'up') { if (b.bottom > a.top + 1 && dy >= -1) continue; main = -dy; side = dx; }
      if (dir === 'down') { if (b.top < a.bottom - 1 && dy <= 1) continue; main = dy; side = dx; }
      if (main <= 0) continue;
      const score = main + Math.abs(side) * 2.2;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) focus(best);
  }

  function activate() {
    const el = document.activeElement;
    if (!el || el === document.body) return;
    if (el.tagName === 'INPUT' && el.type !== 'checkbox') return;
    Sound.play('select');
    el.click();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F1' || e.key === 'Home') { e.preventDefault(); homeHandler(); return; }
    if (suspended) return;
    const typing = document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type !== 'checkbox';
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) {
      if (typing && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
      e.preventDefault();
      move(map[e.key]);
    } else if ((e.key === 'Enter' || e.key === ' ') && !typing && document.activeElement && document.activeElement.tagName !== 'BUTTON' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      activate();
    } else if (e.key === 'Escape' || (e.key === 'Backspace' && !typing)) {
      e.preventDefault();
      if (typing) document.activeElement.blur();
      backHandler();
    }
  });

  // ---- gamepad ----
  const held = {};
  let repeatAt = {};
  function pressed(id, isDown, fn, repeat) {
    const now = performance.now();
    if (isDown && !held[id]) { held[id] = true; repeatAt[id] = now + 380; fn(); }
    else if (isDown && repeat && now > repeatAt[id]) { repeatAt[id] = now + 110; fn(); }
    else if (!isDown) held[id] = false;
  }
  function poll() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    document.getElementById('padIcon')?.classList.toggle('on', pads.length > 0);
    for (const p of pads) {
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      const k = p.index + ':';
      pressed(k + 'home', b(16), () => homeHandler());
      pressed(k + 'guide', b(9) && !suspended, () => guideHandler());
      if (suspended) continue;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      pressed(k + 'up', b(12) || ay < -0.6, () => move('up'), true);
      pressed(k + 'down', b(13) || ay > 0.6, () => move('down'), true);
      pressed(k + 'left', b(14) || ax < -0.6, () => move('left'), true);
      pressed(k + 'right', b(15) || ax > 0.6, () => move('right'), true);
      pressed(k + 'a', b(0), activate);
      pressed(k + 'b', b(1), () => backHandler());
    }
    requestAnimationFrame(poll);
  }
  requestAnimationFrame(poll);
  window.addEventListener('gamepadconnected', (e) => Toast.show('🎮 Controller connected'));

  return {
    focus, move, candidates,
    focusFirst(container) {
      const el = [...(container || scope()).querySelectorAll('.nav')].find(visible);
      if (el) el.focus({ preventScroll: true });
    },
    onBack(fn) { backHandler = fn; },
    onHome(fn) { homeHandler = fn; },
    onGuide(fn) { guideHandler = fn; },
    suspend(v) { suspended = v; },
  };
})();

// Little UI blips made with the Web Audio API (no sound files needed).
const Sound = (() => {
  let ctx, enabled = true;
  return {
    set enabled(v) { enabled = v; },
    play(kind) {
      if (!enabled) return;
      try {
        ctx = ctx || new AudioContext();
        const o = ctx.createOscillator(), g = ctx.createGain();
        const f = { move: 520, select: 820, back: 340, install: 980 }[kind] || 600;
        o.type = 'sine';
        o.frequency.setValueAtTime(f, ctx.currentTime);
        if (kind === 'install') o.frequency.linearRampToValueAtTime(f * 1.5, ctx.currentTime + 0.15);
        g.gain.setValueAtTime(kind === 'move' ? 0.025 : 0.05, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        o.connect(g).connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + 0.13);
      } catch (_) {}
    },
  };
})();

const Toast = {
  show(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },
};
