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

  /* ---------- active nav link ---------- */
  const navLinks = $$('.nav a:not(.nav-cta)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- keyboard ---------- */
  const LAYOUT = [
    [['Esc', 1.2], '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', ['⌫', 1.8]],
    [['Tab', 1.6], 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', ['\\', 1.4]],
    [['Caps', 1.9], 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", ['Enter', 2.3]],
    [['Shift', 2.4], 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', ['Shift', 2.8]],
    [['Ctrl', 1.5], ['Win', 1.3], ['Alt', 1.3], ['BRO', 7], ['Alt', 1.3], ['Fn', 1.3], ['Ctrl', 1.5]]
  ];
  const SOFT = new Set(['W', 'A', 'S', 'D']);
  const kb = $('#kb');
  const keyMap = new Map();
  const rows = [];

  if (kb) {
    LAYOUT.forEach((row, r) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';
      const keys = [];
      row.forEach((item, c) => {
        const [label, w] = Array.isArray(item) ? item : [item, 1];
        const k = document.createElement('div');
        k.className = 'key';
        k.style.setProperty('--w', w);
        k.textContent = label;
        if (SOFT.has(label)) k.classList.add('soft');
        if (label === 'Enter') k.classList.add('accent');
        if (label.length === 1 || label === 'Enter' || label === 'Tab' || label === 'Caps') {
          keyMap.set(label.toUpperCase(), k);
        }
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

    // one orchestrated moment: a wave of light across the keys on load
    if (!reduceMotion) {
      rows.forEach((keys, r) => keys.forEach((k, c) => {
        setTimeout(() => flash(k, 260), 500 + r * 90 + c * 55);
      }));
    }

    kb.addEventListener('pointerover', (e) => {
      const k = e.target.closest('.key');
      if (k) flash(k, 220);
    });
    kb.addEventListener('pointerdown', (e) => {
      const k = e.target.closest('.key');
      if (k) flash(k, 260);
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest('input, select, textarea')) return;
      const name = e.key === 'Enter' ? 'ENTER' : e.key === 'Tab' ? 'TAB' : e.key.toUpperCase();
      const k = keyMap.get(name);
      if (k) flash(k, 200);
    });
  }

  /* ---------- tiles → booking ---------- */
  const clubSelect = $('#clubSelect');
  $$('.tile[data-club]').forEach((tile) => {
    tile.addEventListener('click', () => {
      const club = tile.dataset.club;
      if (clubSelect && [...clubSelect.options].some((o) => o.value === club)) {
        clubSelect.value = club;
        showToast('Выбрана точка ' + club);
      }
    });
  });

  /* ---------- booking form → WhatsApp ---------- */
  const form = $('#bookForm');
  const note = $('#formNote');
  if (form) {
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    form.date.min = today;
    form.date.value = today;

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
