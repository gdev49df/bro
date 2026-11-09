(() => {
  'use strict';

  const WA_NUMBER = '77713455196';
  const header = document.querySelector('.site-header');
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  const toast = document.getElementById('toast');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- toast ---------- */
  let toastTimer;
  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  /* ---------- sticky header shadow ---------- */
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  }
  burger.addEventListener('click', () => {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  /* ---------- active link while scrolling ---------- */
  const sections = [...document.querySelectorAll('main section[id]')];
  const links = [...nav.querySelectorAll('a')];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const revealEls = [...document.querySelectorAll('[data-reveal]')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          reveal.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach((el) => reveal.observe(el));
  }

  /* ---------- count-up rating ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (reduceMotion) { el.textContent = target.toFixed(decimals); return; }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    el.textContent = (0).toFixed(decimals);
    requestAnimationFrame(step);
  }
  const score = document.querySelector('[data-count]');
  if (score && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { countUp(entry.target); io.disconnect(); }
      });
    }, { threshold: 0.6 });
    io.observe(score);
  }

  /* ---------- branch filter ---------- */
  const chips = [...document.querySelectorAll('.chip')];
  const branches = [...document.querySelectorAll('.branch')];
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
      branches.forEach((b) => {
        const show = f === 'all' || b.dataset.open === f;
        b.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- booking form → WhatsApp ---------- */
  const form = document.getElementById('bookForm');
  const note = document.getElementById('formNote');
  if (form) {
    const today = new Date().toISOString().slice(0, 10);
    form.date.min = today;
    form.date.value = today;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      [...form.querySelectorAll('input, select')].forEach((field) => {
        const valid = field.checkValidity() && field.value.trim() !== '';
        field.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        note.textContent = 'Заполните поля, отмеченные красным.';
        return;
      }
      const d = new FormData(form);
      const text = [
        'Здравствуйте! Хочу забронировать место.',
        `Имя: ${d.get('name')}`,
        `Филиал: ${d.get('club')}`,
        `Дата: ${d.get('date')}`,
        `Время: ${d.get('time')}`,
        `Часов: ${d.get('hours')}`
      ].join('\n');
      note.textContent = 'Открываем WhatsApp…';
      window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      showToast('Бронь открыта в WhatsApp');
    });

    form.querySelectorAll('input, select').forEach((field) => {
      field.addEventListener('input', () => field.classList.remove('is-invalid'));
    });
  }

  /* ---------- copy phone on long-press / double click ---------- */
  document.querySelectorAll('.ph[href^="tel:"]').forEach((a) => {
    a.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const phone = a.textContent.trim();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phone).then(() => showToast('Номер скопирован'));
      }
    });
  });
})();
