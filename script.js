(() => {
  'use strict';

  const WA_NUMBER = '77713455196';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  /* ---------- header ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
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

  /* ---------- reveal on scroll (staggered, runs once) ---------- */
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
          // drop the reveal transition afterwards so card hover stays snappy
          const delay = parseFloat(el.style.getPropertyValue('--d')) || 0;
          setTimeout(() => el.classList.remove('reveal', 'is-in'), (delay + 1) * 1000 + 100);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      // stagger siblings inside the same grid
      $$('.tiles, .grid-3, .grid-2, .stack, .about-grid').forEach((grid) => {
        $$('.reveal', grid).forEach((el, i) => el.style.setProperty('--d', (i * 0.08).toFixed(2) + 's'));
      });
      revealEls.forEach((el) => io.observe(el));
    }
  }

  /* ---------- cursor glow on cards ---------- */
  $$('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- keyboard (home) ---------- */
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

    // wave of light across the keys, repeated with a pause between runs
    const WAVE_PAUSE = 2200;
    const maxCols = Math.max(...rows.map((keys) => keys.length));
    const waveLength = (rows.length - 1) * 90 + (maxCols - 1) * 55 + 260;
    let loopTimer = null;

    const runWave = () => {
      rows.forEach((keys, r) => keys.forEach((k, c) => setTimeout(() => flash(k, 260), r * 90 + c * 55)));
      loopTimer = setTimeout(runWave, waveLength + WAVE_PAUSE);
    };
    const startLoop = (delay = 0) => {
      if (loopTimer !== null) return;
      loopTimer = setTimeout(runWave, delay);
    };
    const stopLoop = () => {
      clearTimeout(loopTimer);
      loopTimer = null;
    };

    if (!reduceMotion) {
      // run only while the keyboard is on screen and the tab is visible
      let inView = true;
      const sync = () => (inView && !document.hidden ? startLoop(500) : stopLoop());
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
  }

  /* ---------- booking page ---------- */
  const form = $('#bookForm');
  if (form) {
    const note = $('#formNote');
    const picked = $('#picked');
    const clubSelect = form.elements.club;

    // preselect club from ?club=NAME
    const wanted = new URLSearchParams(location.search).get('club');
    if (wanted && [...clubSelect.options].some((o) => o.value === wanted)) {
      clubSelect.value = wanted;
    }
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
