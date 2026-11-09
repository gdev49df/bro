(() => {
  'use strict';

  const WA_NUMBER = '77713455196';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
  };

  /* ============ boot loader (first visit of a session) ============ */
  const markReady = () => root.classList.add('ready');
  const loader = $('#loader');

  function runLoader() {
    const bar = $('#loaderBar');
    const pct = $('#loaderPct');
    const line = $('#loaderLine');
    const LINES = [
      [0, 'booting BRO.os'],
      [22, 'scanning clubs… 8/8'],
      [48, 'loading hardware: top tier'],
      [72, 'link: 24/7 online'],
      [94, 'ready, bro']
    ];
    const MIN = 2000;
    const MAX = 7000;
    const t0 = performance.now();
    let pageLoaded = document.readyState === 'complete';
    window.addEventListener('load', () => { pageLoaded = true; });
    let p = 0;
    let lastLine = -1;

    const finish = () => {
      store.set('broBooted', '1');
      root.classList.add('loaded');
      markReady();
      setTimeout(() => root.classList.remove('boot', 'loaded'), 1200);
    };

    const tick = (now) => {
      const t = now - t0;
      const canFinish = (pageLoaded && t >= MIN) || t >= MAX;
      const target = canFinish ? 100 : Math.min(92, (t / MIN) * 92);
      p = Math.min(target, p + Math.max(0.35, (target - p) * 0.08));
      bar.style.width = p.toFixed(1) + '%';
      pct.textContent = Math.floor(p) + '%';
      let idx = 0;
      LINES.forEach((l, i) => { if (p >= l[0]) idx = i; });
      if (idx !== lastLine) { lastLine = idx; line.textContent = LINES[idx][1]; }
      if (p >= 100) { setTimeout(finish, 280); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (loader && root.classList.contains('boot')) runLoader();
  else markReady();

  /* ============ smooth page transitions ============ */
  document.addEventListener('click', (e) => {
    if (reduceMotion || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.protocol !== location.protocol || url.host !== location.host) return;
    if (!/\.html?$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    store.set('broNav', '1');
    root.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 520);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('leaving'); });

  /* ============ toast ============ */
  const toast = $('#toast');
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  /* ============ header + scroll progress ============ */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  let scrollRaf = 0;
  const onScroll = () => {
    scrollRaf = 0;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    }
  };
  window.addEventListener('scroll', () => { if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  /* ============ mobile menu ============ */
  const burger = $('.burger');
  const nav = $('#nav');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ============ reveal on scroll (staggered, once) ============ */
  const revealEls = $$('.reveal');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.remove('reveal'));
    } else {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.classList.add('is-in');
          io.unobserve(el);
          const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
          // drop the reveal transition afterwards so hover stays snappy
          setTimeout(() => el.classList.remove('reveal', 'is-in'), (delay + 1) * 1000 + 150);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      $$('.tiles, .grid-3, .grid-2, .grid-4, .stack, .about-grid, .stats, .feed, .faq-list').forEach((grid) => {
        $$('.reveal', grid).forEach((el, i) => el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's'));
      });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ============ count-up numbers ============ */
  const counters = $$('[data-count]');
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    const run = (el) => {
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.dec || '0', 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1500;
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => {
      const dec = parseInt(el.dataset.dec || '0', 10);
      el.textContent = (0).toFixed(dec) + (el.dataset.suffix || '');
      cio.observe(el);
    });
  }

  /* ============ cursor glow on cards ============ */
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ============ terminal typing ============ */
  $$('[data-term]').forEach((term) => {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    const rows = $$('.tl', term).map((l) => {
      const cmd = $('.cmd', l);
      return { cmd, out: $('.out', l), text: cmd.textContent };
    });
    rows.forEach((r) => { r.cmd.textContent = ''; r.out.classList.add('is-hidden'); });
    const caret = document.createElement('span');
    caret.className = 'caret';
    rows[0].cmd.appendChild(caret);

    const type = async () => {
      for (const r of rows) {
        r.cmd.appendChild(caret);
        for (const ch of r.text) {
          r.cmd.insertBefore(document.createTextNode(ch), caret);
          await sleep(26);
        }
        r.out.classList.remove('is-hidden');
        await sleep(320);
      }
    };
    new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) { obs.disconnect(); type(); }
    }, { threshold: 0.35 }).observe(term);
  });

  /* ============ keyboard (home) ============ */
  const kb = $('#kb');
  if (kb) {
    const LAYOUT = [
      [['Esc', 1.2], '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['⌫', 1.8]],
      [['Tab', 1.6], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', ['\\', 1.4]],
      [['Caps', 1.9], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", ['Enter', 2.3]],
      [['Shift', 2.4], 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', ['Shift', 2.8]],
      [['Ctrl', 1.5], ['Win', 1.3], ['Alt', 1.3], ['BRO', 7], ['Alt', 1.3], ['Fn', 1.3], ['Ctrl', 1.5]]
    ];
    const SOFT = new Set(['W', 'A', 'S', 'D']);
    const keyMap = new Map();
    const rows = [];

    LAYOUT.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      const keys = [];
      row.forEach((item) => {
        const [label, w] = Array.isArray(item) ? item : [item, 1];
        const k = document.createElement('div');
        k.className = 'key';
        k.style.setProperty('--w', w);
        k.textContent = label;
        if (SOFT.has(label)) k.classList.add('soft');
        if (label === 'Enter') k.classList.add('accent');
        if (label.length === 1 || ['Enter', 'Tab', 'Caps'].includes(label)) keyMap.set(label.toUpperCase(), k);
        keys.push(k);
        rowEl.appendChild(k);
      });
      rows.push(keys);
      kb.appendChild(rowEl);
    });

    const flash = (k, ms = 180) => {
      k.classList.add('on');
      setTimeout(() => k.classList.remove('on'), ms);
    };

    // looping wave of light, only while the keyboard is visible and the tab is active
    const WAVE_PAUSE = 2200;
    const maxCols = Math.max(...rows.map((keys) => keys.length));
    const waveLength = (rows.length - 1) * 90 + (maxCols - 1) * 55 + 260;
    let loopTimer = null;
    const runWave = () => {
      rows.forEach((keys, r) => keys.forEach((k, c) => setTimeout(() => flash(k, 260), r * 90 + c * 55)));
      loopTimer = setTimeout(runWave, waveLength + WAVE_PAUSE);
    };
    const startLoop = (delay = 0) => { if (loopTimer === null) loopTimer = setTimeout(runWave, delay); };
    const stopLoop = () => { clearTimeout(loopTimer); loopTimer = null; };

    if (!reduceMotion) {
      let inView = true;
      const sync = () => (inView && !document.hidden ? startLoop(root.classList.contains('boot') ? 2600 : 700) : stopLoop());
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1].isIntersecting;
          sync();
        }, { threshold: 0.1 }).observe(kb);
      }
      document.addEventListener('visibilitychange', sync);
      sync();
    }

    kb.addEventListener('pointerover', (e) => { const k = e.target.closest('.key'); if (k) flash(k, 220); });
    kb.addEventListener('pointerdown', (e) => { const k = e.target.closest('.key'); if (k) flash(k, 260); });
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest('input, select, textarea')) return;
      const name = e.key === 'Enter' ? 'ENTER' : e.key === 'Tab' ? 'TAB' : e.key.toUpperCase();
      const k = keyMap.get(name);
      if (k) flash(k, 200);
    });

    // keyboard tilts toward the pointer
    const hero = $('.hero');
    if (hero && canHover && !reduceMotion) {
      let raf = 0;
      let tx = 0;
      let ty = 0;
      const apply = () => {
        raf = 0;
        kb.style.setProperty('--tx', tx.toFixed(2) + 'deg');
        kb.style.setProperty('--ty', ty.toFixed(2) + 'deg');
      };
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 10;
        ty = -((e.clientY - r.top) / r.height - 0.5) * 8;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); });
    }
  }

  /* ============ ambient particles ============ */
  const canvas = $('#bgCanvas');
  if (canvas && !reduceMotion && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const mouse = { x: -999, y: -999 };
    let w = 0;
    let h = 0;
    let pts = [];
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(80, (w * h) / 22000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.6
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
        ctx.fillStyle = 'rgba(27, 232, 211, .55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) {
            ctx.strokeStyle = `rgba(27, 232, 211, ${((1 - d / 130) * 0.2).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (md < 170) {
          ctx.strokeStyle = `rgba(127, 252, 238, ${((1 - md / 170) * 0.4).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    start();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }

  /* ============ soft light following the cursor ============ */
  const glow = $('.cursor-glow');
  if (glow && canHover && !reduceMotion) {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let running = false;
    const loop = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      glow.style.transform = `translate(${x}px, ${y}px)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) requestAnimationFrame(loop);
      else running = false;
    };
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      glow.style.opacity = '1';
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { glow.style.opacity = '0'; });
  }

  /* ============ booking page ============ */
  const form = $('#bookForm');
  if (form) {
    const note = $('#formNote');
    const picked = $('#picked');
    const clubSelect = form.elements.club;

    const wanted = new URLSearchParams(location.search).get('club');
    if (wanted && [...clubSelect.options].some((o) => o.value === wanted)) clubSelect.value = wanted;

    const syncPicked = () => {
      if (!picked) return;
      const v = clubSelect.value;
      picked.hidden = v === 'Подскажите';
      picked.textContent = 'Точка: ' + v;
    };
    clubSelect.addEventListener('change', syncPicked);
    syncPicked();

    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    form.elements.date.min = today;
    form.elements.date.value = today;

    const fields = $$('input, select', form);
    fields.forEach((f) => f.addEventListener('input', () => f.classList.remove('is-invalid')));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      fields.forEach((f) => {
        const valid = f.checkValidity() && f.value.trim() !== '';
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        note.textContent = 'Проверь поля, отмеченные красным.';
        return;
      }
      const d = new FormData(form);
      const text = [
        'Здравствуйте! Хочу забронировать место.',
        `Имя: ${d.get('name')}`,
        `Точка: ${d.get('club')}`,
        `Дата: ${d.get('date')}`,
        `Время: ${d.get('time')}`,
        `Мест: ${d.get('seats')}`
      ].join('\n');
      note.textContent = 'Открываем WhatsApp…';
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      showToast('Сообщение готово в WhatsApp');
    });
  }
})();
