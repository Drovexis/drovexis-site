(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- basics ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
    }));
  }

  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((item) => observer.observe(item));
  } else {
    items.forEach((item) => item.classList.add('is-visible'));
  }

  /* ---------- animated canvas backgrounds ---------- */
  function runCanvas(canvas, make) {
    const host = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = { w: 0, h: 0, dpr: 1, px: -9999, py: -9999, active: false };
    let scene = null;
    let raf = 0;
    let visible = true;

    function resize() {
      const r = host.getBoundingClientRect();
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = Math.max(1, r.width);
      state.h = Math.max(1, r.height);
      canvas.width = Math.round(state.w * state.dpr);
      canvas.height = Math.round(state.h * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
      scene = make(state);
      if (reduceMotion) scene.draw(ctx, 0);
    }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      scene.draw(ctx, dt);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !reduceMotion && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); }).observe(host);
    else window.addEventListener('resize', resize);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(host);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    host.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      state.px = e.clientX - r.left; state.py = e.clientY - r.top; state.active = true;
    });
    host.addEventListener('pointerleave', () => { state.active = false; state.px = state.py = -9999; });
    start();
  }

  // Studio: drifting embers that gather into constellations on their own.
  // Invisible "gatherers" wander slowly across the scene, pulling nearby embers
  // together and linking them, then drift on and let them go.
  function embersScene(s) {
    const count = Math.round(Math.min(110, Math.max(36, (s.w * s.h) / 14000)));
    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * s.w, y: Math.random() * s.h,
      vx: (Math.random() - 0.5) * 12, vy: -6 - Math.random() * 16,
      r: 0.6 + Math.random() * 1.8, gold: Math.random() < 0.45, tw: Math.random() * 6.28,
    }));
    const link = Math.min(140, s.w / 8);
    const wide = s.w > 720;
    const gatherers = Array.from({ length: wide ? 2 : 1 }, (_, i) => ({
      x: 0, y: 0, ph: Math.random() * 100 + i * 37,
      fx: 0.045 + Math.random() * 0.03, fy: 0.06 + Math.random() * 0.03,
      // keep them mostly over the artwork, away from the headline on desktop
      x0: wide ? 0.42 : 0.08, x1: wide ? 0.96 : 0.92, y0: 0.18, y1: 0.88,
    }));
    const reach = wide ? 210 : 160;
    let time = 0;
    return {
      draw(ctx, dt) {
        ctx.clearRect(0, 0, s.w, s.h);
        time += dt;
        for (const g of gatherers) {
          const u = 0.5 + 0.5 * Math.sin(time * g.fx * 6.283 + g.ph);
          const v = 0.5 + 0.5 * Math.sin(time * g.fy * 6.283 + g.ph * 1.7);
          g.x = s.w * (g.x0 + (g.x1 - g.x0) * u);
          g.y = s.h * (g.y0 + (g.y1 - g.y0) * v);
          // strength breathes in and out so clusters form, hold, then release
          g.k = 0.25 + 0.75 * Math.max(0, Math.sin(time * 0.3 + g.ph));
        }
        for (const p of pts) {
          let held = 0;
          for (const g of gatherers) {
            const dx = g.x - p.x, dy = g.y - p.y, d2 = dx * dx + dy * dy, R = reach * reach;
            if (d2 < R) {
              const near = 1 - d2 / R;
              const f = near * 120 * g.k;
              p.vx += (dx / reach) * f * dt; p.vy += (dy / reach) * f * dt;
              // swirl a little so clusters orbit instead of collapsing to a dot
              p.vx += (-dy / reach) * 18 * g.k * dt; p.vy += (dx / reach) * 18 * g.k * dt;
              held = Math.max(held, near * g.k);
            }
          }
          const damp = 0.985 - held * 0.03;
          p.vx *= damp; p.vy = p.vy * damp + (-10 - p.vy) * 0.01 * (1 - held);
          p.x += p.vx * dt; p.y += p.vy * dt; p.tw += dt * 2;
          if (p.y < -10) { p.y = s.h + 10; p.x = Math.random() * s.w; }
          if (p.x < -10) p.x = s.w + 10; else if (p.x > s.w + 10) p.x = -10;
        }
        ctx.lineWidth = 1;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          for (let j = i + 1; j < pts.length; j++) {
            const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
            if (d < link) { ctx.strokeStyle = `rgba(99,191,255,${(1 - d / link) * 0.18})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
          }
          for (const g of gatherers) {
            const d = Math.hypot(a.x - g.x, a.y - g.y);
            if (d < reach) { ctx.strokeStyle = `rgba(160,220,255,${Math.min(0.7, (1 - d / reach) * 0.75 * g.k)})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(g.x, g.y); ctx.stroke(); }
          }
        }
        for (const p of pts) {
          const glow = 0.55 + Math.sin(p.tw) * 0.35;
          ctx.fillStyle = p.gold ? `rgba(255,197,106,${glow})` : `rgba(140,210,255,${glow})`;
          ctx.shadowColor = p.gold ? 'rgba(255,170,60,.9)' : 'rgba(80,170,255,.9)';
          ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        ctx.shadowBlur = 0;
      },
    };
  }

  // Gridline: a power network with energy pulses; the pointer charges nearby nodes
  function gridScene(s) {
    const gap = s.w < 700 ? 90 : 120;
    const cols = Math.ceil(s.w / gap) + 1, rows = Math.ceil(s.h / gap) + 1;
    const nodes = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      nodes.push({ x: c * gap + (Math.random() - 0.5) * gap * 0.5, y: r * gap + (Math.random() - 0.5) * gap * 0.5, charge: 0, c, r });
    }
    const at = (c, r) => (c >= 0 && r >= 0 && c < cols && r < rows ? nodes[r * cols + c] : null);
    const edges = [];
    for (const n of nodes) {
      const right = at(n.c + 1, n.r), down = at(n.c, n.r + 1), diag = at(n.c + 1, n.r + 1);
      if (right && Math.random() < 0.8) edges.push([n, right]);
      if (down && Math.random() < 0.7) edges.push([n, down]);
      if (diag && Math.random() < 0.18) edges.push([n, diag]);
    }
    const adj = new Map(nodes.map((n) => [n, []]));
    edges.forEach(([a, b]) => { adj.get(a).push(b); adj.get(b).push(a); });
    const pulses = [];
    const spawn = (from) => {
      const nb = adj.get(from); if (!nb || !nb.length) return;
      pulses.push({ a: from, b: nb[(Math.random() * nb.length) | 0], t: 0, speed: 0.9 + Math.random() * 1.4, gold: Math.random() < 0.3, hops: 2 + ((Math.random() * 4) | 0) });
    };
    let timer = 0, pointerTimer = 0;
    return {
      draw(ctx, dt) {
        ctx.clearRect(0, 0, s.w, s.h);
        timer += dt; pointerTimer += dt;
        if (timer > 0.18 && pulses.length < 60) { timer = 0; spawn(nodes[(Math.random() * nodes.length) | 0]); }
        if (s.active) {
          for (const n of nodes) { const d = Math.hypot(n.x - s.px, n.y - s.py); if (d < 170) n.charge = Math.max(n.charge, 1 - d / 170); }
          if (pointerTimer > 0.07 && pulses.length < 90) {
            pointerTimer = 0;
            let best = null, bd = 1e9;
            for (const n of nodes) { const d = Math.hypot(n.x - s.px, n.y - s.py); if (d < bd) { bd = d; best = n; } }
            if (best && bd < 200) spawn(best);
          }
        }
        ctx.lineWidth = 1;
        for (const [a, b] of edges) {
          const ch = Math.max(a.charge, b.charge);
          ctx.strokeStyle = `rgba(99,191,255,${0.07 + ch * 0.35})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (const n of nodes) {
          n.charge = Math.max(0, n.charge - dt * 0.9);
          ctx.fillStyle = `rgba(140,210,255,${0.18 + n.charge * 0.8})`;
          ctx.beginPath(); ctx.arc(n.x, n.y, 1.6 + n.charge * 2.4, 0, 6.283); ctx.fill();
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.t += dt * p.speed;
          if (p.t >= 1) {
            p.b.charge = Math.max(p.b.charge, 0.7);
            if (--p.hops <= 0) { pulses.splice(i, 1); continue; }
            const nb = adj.get(p.b).filter((n) => n !== p.a);
            if (!nb.length) { pulses.splice(i, 1); continue; }
            p.a = p.b; p.b = nb[(Math.random() * nb.length) | 0]; p.t = 0;
          }
          const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
          const tx = p.a.x + (p.b.x - p.a.x) * Math.max(0, p.t - 0.25), ty = p.a.y + (p.b.y - p.a.y) * Math.max(0, p.t - 0.25);
          const col = p.gold ? '255,197,106' : '120,205,255';
          const g = ctx.createLinearGradient(tx, ty, x, y);
          g.addColorStop(0, `rgba(${col},0)`); g.addColorStop(1, `rgba(${col},.95)`);
          ctx.strokeStyle = g; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = `rgba(${col},1)`; ctx.shadowColor = `rgba(${col},1)`; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
        }
      },
    };
  }

  document.querySelectorAll('canvas[data-fx]').forEach((c) => {
    runCanvas(c, c.dataset.fx === 'grid' ? gridScene : embersScene);
  });

  /* ---------- 3D tilt ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tiltMax || '7');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('tilting');
        el.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`);
        el.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
        el.style.setProperty('--mx', `${x * 100}%`);
        el.style.setProperty('--my', `${y * 100}%`);
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('tilting');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- classified project cards ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@?!';
  function scramble(el, finalText, duration) {
    const start = performance.now();
    const len = Math.max(finalText.length, 6);
    return new Promise((resolve) => {
      (function step(now) {
        const p = Math.min(1, (now - start) / duration);
        let out = '';
        for (let i = 0; i < len; i++) {
          const ch = finalText[i] || '';
          out += (i / len < p * 1.15 - 0.15) ? ch : (ch === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]);
        }
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step); else { el.textContent = finalText; resolve(); }
      })(start);
    });
  }

  const deniedLines = [
    'Access denied · Reveal pending',
    'Encryption holding · Try again',
    'Nice try. Follow us for the reveal',
  ];
  document.querySelectorAll('[data-classified]').forEach((card) => {
    const title = card.querySelector('.scramble');
    const bar = card.querySelector('.decrypt-bar span');
    const msg = card.querySelector('.decrypt-msg');
    const idle = msg.textContent;
    const reds = card.querySelectorAll('.redact');
    let busy = false, tries = 0, resetTimer = 0;

    if (finePointer && !reduceMotion) {
      card.addEventListener('pointerenter', () => { if (!busy) scramble(title, title.dataset.text, 500); });
    }

    async function decrypt() {
      if (busy) return;
      busy = true; clearTimeout(resetTimer);
      card.classList.remove('denied'); card.classList.add('decrypting');
      msg.textContent = 'Decrypting…';
      const target = 58 + Math.random() * 30;
      const t0 = performance.now(), dur = reduceMotion ? 300 : 1600;
      const flicker = reduceMotion ? 0 : setInterval(() => {
        reds.forEach((r) => { r.style.color = '#ffd391'; r.textContent = Array.from({ length: r.textContent.length }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join(''); });
      }, 70);
      await new Promise((res) => {
        (function step(now) {
          const p = Math.min(1, (now - t0) / dur);
          bar.style.width = `${target * (1 - Math.pow(1 - p, 3))}%`;
          if (p < 1) requestAnimationFrame(step); else res();
        })(t0);
      });
      clearInterval(flicker);
      reds.forEach((r) => { r.style.color = ''; r.textContent = '█'.repeat(r.textContent.length); });
      card.classList.remove('decrypting'); card.classList.add('denied');
      msg.textContent = deniedLines[Math.min(tries, deniedLines.length - 1)];
      tries++;
      await scramble(title, title.dataset.text, reduceMotion ? 1 : 600);
      busy = false;
      resetTimer = setTimeout(() => { card.classList.remove('denied'); bar.style.width = '0'; msg.textContent = idle; }, 3500);
    }
    card.addEventListener('click', decrypt);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); decrypt(); } });
  });

  /* ---------- Power the City mini game ---------- */
  const game = document.querySelector('[data-minigame]');
  if (game) {
    const $ = (k) => game.querySelector(`[data-mg="${k}"]`);
    const UPGRADES = {
      turbine: { base: 10, rate: 1 },
      solar: { base: 50, rate: 5 },
      gas: { base: 250, rate: 25 },
      reactor: { base: 1200, rate: 120 },
    };
    const GROWTH = 1.15, DEMAND = 250;
    let st;
    const reset = () => { st = { energy: 0, owned: { turbine: 0, solar: 0, gas: 0, reactor: 0 }, started: 0, won: false }; };
    reset();
    const fmt = (n) => Math.floor(n).toLocaleString('en-US');
    const cost = (k) => Math.ceil(UPGRADES[k].base * Math.pow(GROWTH, st.owned[k]));
    const rate = () => Object.keys(UPGRADES).reduce((t, k) => t + UPGRADES[k].rate * st.owned[k], 0);
    const pct = () => Math.min(1, rate() / DEMAND);
    const tapValue = () => 1 + Math.floor(rate() * 0.1);

    const canvas = game.querySelector('.mg-canvas');
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, buildings = [], stars = [];
    function layout() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildings = []; stars = [];
      let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      const ground = H - 34;
      for (let layer = 0; layer < 2; layer++) {
        let x = -10;
        while (x < W + 10) {
          const bw = (layer ? 34 : 26) + rnd() * (layer ? 46 : 30);
          const maxH = H * (layer ? 0.52 : 0.62);
          const bh = (layer ? 70 : 110) + rnd() * (maxH - (layer ? 70 : 110));
          const wins = [];
          const cw = 7, ch = 9, gx = 6, gy = 8;
          for (let wy = ground - bh + 12; wy < ground - 14; wy += ch + gy) {
            for (let wx = x + 6; wx < x + bw - cw - 4; wx += cw + gx) wins.push({ x: wx, y: wy, th: rnd(), warm: rnd() < 0.75 });
          }
          buildings.push({ x, w: bw, h: bh, ground, layer, wins, antenna: rnd() < 0.25 });
          x += bw + (layer ? 2 : 4) + rnd() * 8;
        }
      }
      buildings.sort((a, b) => b.layer - a.layer);
      for (let i = 0; i < 70; i++) stars.push({ x: rnd() * W, y: rnd() * H * 0.45, r: rnd() * 1.2 + 0.2 });
    }
    let shown = 0, t = 0;
    function draw(dt) {
      t += dt;
      shown += (pct() - shown) * Math.min(1, dt * 4);
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#030913'); sky.addColorStop(1, `rgba(${20 + shown * 30},${50 + shown * 60},${90 + shown * 60},1)`);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      for (const s of stars) { ctx.fillStyle = `rgba(200,225,255,${0.5 - shown * 0.3})`; ctx.fillRect(s.x, s.y, s.r, s.r); }
      // city glow
      const glow = ctx.createRadialGradient(W / 2, H, 10, W / 2, H, W * 0.7);
      glow.addColorStop(0, `rgba(255,190,90,${shown * 0.35})`); glow.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      for (const b of buildings) {
        ctx.fillStyle = b.layer ? '#0a1626' : '#060e19';
        ctx.fillRect(b.x, b.ground - b.h, b.w, b.h);
        if (b.antenna) { ctx.fillRect(b.x + b.w / 2 - 1, b.ground - b.h - 16, 2, 16); ctx.fillStyle = `rgba(255,80,80,${0.4 + Math.sin(t * 3 + b.x) * 0.4})`; ctx.fillRect(b.x + b.w / 2 - 1.5, b.ground - b.h - 18, 3, 3); }
        for (const w of b.wins) {
          const on = w.th < shown;
          if (on) {
            const flick = 0.85 + Math.sin(t * 2 + w.x * 0.3 + w.y) * 0.08;
            ctx.fillStyle = w.warm ? `rgba(255,205,110,${flick})` : `rgba(150,215,255,${flick})`;
          } else ctx.fillStyle = b.layer ? 'rgba(40,60,85,.45)' : 'rgba(30,48,70,.5)';
          ctx.fillRect(w.x, w.y, 7, 9);
        }
      }
      // power line with pulses
      const ly = H - 22;
      ctx.fillStyle = '#071322'; ctx.fillRect(0, H - 34, W, 34);
      ctx.strokeStyle = 'rgba(99,191,255,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
      const n = Math.min(14, Math.ceil(rate() / 15));
      for (let i = 0; i < n; i++) {
        const x = ((t * 140 + i * (W / Math.max(1, n))) % (W + 40)) - 20;
        ctx.fillStyle = '#9fdcff'; ctx.shadowColor = '#4fb4ff'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(x, ly, 2.5, 0, 6.283); ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    function render() {
      $('energy').textContent = fmt(st.energy);
      $('rate').textContent = fmt(rate());
      $('pct').textContent = `${Math.floor(pct() * 100)}%`;
      $('bar').style.width = `${pct() * 100}%`;
      Object.keys(UPGRADES).forEach((k) => {
        game.querySelector(`[data-cost="${k}"]`).textContent = fmt(cost(k));
        game.querySelector(`[data-own="${k}"]`).textContent = `Owned: ${st.owned[k]} · +${UPGRADES[k].rate} MW/s`;
        game.querySelector(`[data-buy="${k}"]`).disabled = st.energy < cost(k) || st.won;
      });
      if (!st.won && pct() >= 1) win();
    }
    function win() {
      st.won = true;
      const secs = Math.round((performance.now() - st.started) / 1000);
      $('time').textContent = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
      $('win').hidden = false;
    }

    const tapBtn = $('tap');
    tapBtn.addEventListener('click', (e) => {
      if (st.won) return;
      if (!st.started) st.started = performance.now();
      const v = tapValue();
      st.energy += v;
      const f = document.createElement('span');
      f.className = 'mg-float'; f.textContent = `+${fmt(v)}`;
      const r = tapBtn.getBoundingClientRect();
      const cx = e.clientX ? e.clientX - r.left : r.width / 2, cy = e.clientY ? e.clientY - r.top : r.height / 2;
      f.style.left = `${cx - 10 + (Math.random() - 0.5) * 30}px`; f.style.top = `${cy - 20}px`;
      tapBtn.appendChild(f); setTimeout(() => f.remove(), 800);
      render();
    });
    game.querySelectorAll('[data-buy]').forEach((btn) => btn.addEventListener('click', () => {
      const k = btn.dataset.buy, c = cost(k);
      if (st.energy < c || st.won) return;
      if (!st.started) st.started = performance.now();
      st.energy -= c; st.owned[k]++;
      render();
    }));
    $('reset').addEventListener('click', () => { reset(); shown = 0; $('win').hidden = true; render(); tapBtn.focus(); });

    layout(); render(); draw(0);
    if ('ResizeObserver' in window) new ResizeObserver(() => { layout(); draw(0); }).observe(canvas);
    let last = performance.now(), visible = true, acc = 0;
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(game);
    (function loop(now) {
      const dt = Math.min(100, now - last) / 1000; last = now;
      if (!st.won && st.started) { st.energy += rate() * dt; acc += dt; if (acc > 0.1) { acc = 0; render(); } }
      if (visible && !document.hidden) draw(reduceMotion ? 1 : dt);
      requestAnimationFrame(loop);
    })(last);
  }
})();
