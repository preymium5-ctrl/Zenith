/* Hero headline + sub — line-by-line blur-in reveal.
   Headline split on <br>; sub uses static .hero-line spans from HTML (no layout measure). */
(function () {
  if (window.__heroSplitDone) return;
  var headline = document.querySelector('.homepage-v3 .hero-headline');
  var sub = document.querySelector('.homepage-v3 .hero-sub');
  if (!headline || !sub) return;

  function splitHeadline(el) {
    var parts = el.innerHTML.split(/<br\s*\/?>/i)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    el.innerHTML = parts.map(function (p, i) {
      return '<span class="hero-line" style="--i:' + i + '">' + p + '</span>';
    }).join('');
  }

  function run() {
    splitHeadline(headline);
    headline.classList.add('is-split');
    sub.classList.add('is-split');
    requestAnimationFrame(function () {
      var lines = document.querySelectorAll(
        '.homepage-v3 .hero-headline .hero-line, .homepage-v3 .hero-sub .hero-line'
      );
      lines.forEach(function (l) { l.classList.add('is-in'); });
      window.__heroSplitDone = true;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
})();

/* Hero counter — time-based growth + odometer tick, localStorage persistence */
(function () {
  var el = document.getElementById('heroCounter');
  if (!el) return;

  var STORAGE_KEY = 'zenith-hero-hours-v4';
  var BASE = parseInt(el.getAttribute('data-hours') || '0', 10);
  var ANCHOR = Date.parse(el.getAttribute('data-anchor') || '') || Date.UTC(2026, 6, 2);
  var RATE = parseFloat(el.getAttribute('data-rate') || '0.58');
  var TICK_MS = 2500;
  var ROLL_MS = 600;
  var CYCLE_OFFSET = 20;
  var COL_LEN = 40;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = BASE;

  function canonicalValue() {
    var elapsed = Math.max(0, (Date.now() - ANCHOR) / 1000);
    return BASE + elapsed * RATE;
  }

  function targetValue() {
    return Math.floor(canonicalValue());
  }

  function loadStored() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (typeof data.v === 'number' && isFinite(data.v)) return data;
    } catch (_) { /* ignore */ }
    return null;
  }

  function saveStored(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: value, t: Date.now() }));
    } catch (_) { /* ignore */ }
  }

  function formatChars(n) {
    return n.toLocaleString('en-US').split('');
  }

  function makeDigitRoll(digit, fromDigit) {
    var roll = document.createElement('span');
    roll.className = 'digit-roll';
    roll.setAttribute('data-final', String(digit));

    var col = document.createElement('span');
    col.className = 'digit-col';

    var i;
    for (i = 0; i < COL_LEN; i++) {
      var span = document.createElement('span');
      span.textContent = String(i % 10);
      col.appendChild(span);
    }

    var toY = CYCLE_OFFSET + digit;
    var animate = fromDigit != null && fromDigit !== digit && !reducedMotion;

    if (animate) {
      var fromY = CYCLE_OFFSET + fromDigit;
      if (digit < fromDigit) toY = CYCLE_OFFSET + 10 + digit;
      col.style.transform = 'translateY(-' + fromY + 'em)';
      col.style.transition = 'none';
      roll.appendChild(col);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          col.style.transition = 'transform ' + (ROLL_MS / 1000) + 's cubic-bezier(0.22, 1, 0.36, 1)';
          col.style.transform = 'translateY(-' + toY + 'em)';
        });
      });
    } else {
      col.style.transform = 'translateY(-' + toY + 'em)';
      roll.appendChild(col);
    }

    return roll;
  }

  function renderStatic(value) {
    el.innerHTML = '';
    formatChars(value).forEach(function (ch) {
      if (ch === ',') {
        var sep = document.createElement('span');
        sep.className = 'digit-sep';
        sep.textContent = ',';
        el.appendChild(sep);
        return;
      }
      el.appendChild(makeDigitRoll(parseInt(ch, 10)));
    });
  }

  function incrementOne(fromVal, toVal) {
    var fromChars = formatChars(fromVal);
    var toChars = formatChars(toVal);
    if (fromChars.length !== toChars.length) {
      renderStatic(toVal);
      return;
    }

    var rolls = el.querySelectorAll('.digit-roll');
    var rollIdx = 0;
    var lastChangeIdx = -1;
    var i;

    for (i = 0; i < fromChars.length; i++) {
      if (fromChars[i] !== ',' && fromChars[i] !== toChars[i]) lastChangeIdx = i;
    }

    for (i = 0; i < fromChars.length; i++) {
      var ch = fromChars[i];
      if (ch === ',') continue;
      var roll = rolls[rollIdx++];
      if (!roll) continue;
      if (fromChars[i] === toChars[i]) continue;
      var fromDigit = parseInt(fromChars[i], 10);
      var nextDigit = parseInt(toChars[i], 10);
      var rollFrom = i === lastChangeIdx ? fromDigit : null;
      roll.replaceWith(makeDigitRoll(nextDigit, rollFrom));
    }
  }

  function resolveStart() {
    var truth = targetValue();
    var stored = loadStored();
    if (!stored || stored.v < BASE || stored.v > truth) return truth;
    if (truth - stored.v > 120) return truth;
    return stored.v;
  }

  function tick() {
    var truth = targetValue();
    if (current >= truth) {
      setTimeout(tick, TICK_MS);
      return;
    }
    var prev = current;
    current += 1;
    incrementOne(prev, current);
    saveStored(current);
    setTimeout(tick, TICK_MS);
  }

  if (!isFinite(BASE) || BASE <= 0 || !isFinite(RATE) || RATE <= 0) return;

  current = resolveStart();
  renderStatic(current);
  saveStored(current);
  setTimeout(tick, TICK_MS);
})();

/* Scroll reveal — reuse DS .reveal / .is-visible pattern.
   Elements inside the hero (logo-belt) are handled by a separate
   observer with a stricter trigger so they only fade in after a
   real scroll, never at page load even if partially in view. */
const heroReveals = document.querySelectorAll('.hero-section .reveal');
const heroSkip = new Set(heroReveals);
const revealEls = Array.from(document.querySelectorAll('.reveal')).filter(el => !heroSkip.has(el));
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObs.observe(el));

/* Hero reveals — desktop: wait for a small scroll so the fade feels tied
   to scrolling (not first paint). Mobile: show as soon as in view; on narrow
   viewports the band is often already visible at scrollY=0, and the old
   global scrollY check + IO meant is-visible could never be applied. */
if (heroReveals.length) {
  const mqlDesktop = window.matchMedia('(min-width: 769px)');
  function needsScrollNudge() {
    return mqlDesktop.matches;
  }
  const heroRevealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      if (needsScrollNudge() && window.scrollY < 40) return;
      e.target.classList.add('is-visible');
      heroRevealObs.unobserve(e.target);
    });
  }, { threshold: 0.4, rootMargin: '0px 0px -15% 0px' });
  let heroRevealScrollRaf = 0;
  function tryDesktopHeroRevealsAfterScroll() {
    if (heroRevealScrollRaf) return;
    heroRevealScrollRaf = requestAnimationFrame(function () {
      heroRevealScrollRaf = 0;
      if (!needsScrollNudge() || window.scrollY < 40) return;
      const vh = window.innerHeight;
      heroReveals.forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) {
          el.classList.add('is-visible');
          try { heroRevealObs.unobserve(el); } catch (_) { /* already unobserved */ }
        }
      });
    });
  }
  heroReveals.forEach((el) => heroRevealObs.observe(el));
  window.addEventListener('scroll', tryDesktopHeroRevealsAfterScroll, { passive: true });
  tryDesktopHeroRevealsAfterScroll();
}
/* ── Hero ambiance — mutable state read by canvas render ── */
window._heroAmb = {
  hR: 140, hG: 40, hB: 255,
  tR: 140, tG: 40, tB: 255,
  dotSpeed: 1, tDotSpeed: 1,
  angleOff: Math.PI / 4, tAngleOff: Math.PI / 4,
  dotAccum: 0, lastT: Date.now() / 1000
};

/* Stats Tabs — indicator + hero ambiance */
(function () {
  var root = document.getElementById('statsTabs');
  if (!root) return;

  var nav       = root.querySelector('.stats-tabs__nav');
  var tabs      = root.querySelectorAll('.stats-tabs__tab');
  var indicator = root.querySelector('.stats-tabs__indicator');
  var amb       = window._heroAmb;
  var MOODS = [
    { r: 140, g: 40,  b: 255, dotSpeed: 1,   angleOff: Math.PI / 4 },
    { r: 255, g: 120, b: 20,  dotSpeed: 2.5, angleOff: Math.PI / 4 + 0.35 },
    { r: 20,  g: 140, b: 255, dotSpeed: 2.0, angleOff: Math.PI / 4 + 0.7 }
  ];

  function activate(idx) {
    tabs.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); });
    schedulePositionIndicator(idx);
    applyMood(idx);
  }

  function applyMood(idx) {
    var m = MOODS[idx];
    if (!m) return;
    amb.tR = m.r; amb.tG = m.g; amb.tB = m.b;
    amb.tDotSpeed = m.dotSpeed;
    amb.tAngleOff = m.angleOff;
  }

  function positionIndicator(idx) {
    var tab = tabs[idx];
    if (!tab || !indicator) return;
    var navRect = nav.getBoundingClientRect();
    var tabRect = tab.getBoundingClientRect();
    indicator.style.width     = tabRect.width + 'px';
    indicator.style.transform = 'translateX(' + (tabRect.left - navRect.left) + 'px)';
  }

  var indicatorRaf = 0;
  function schedulePositionIndicator(idx) {
    if (indicatorRaf) cancelAnimationFrame(indicatorRaf);
    indicatorRaf = requestAnimationFrame(function () {
      indicatorRaf = 0;
      positionIndicator(idx);
    });
  }

  /* --- Auto-rotate driven by canvas spin step --- */
  var current = 0;
  var paused = false;

  function restartReveal() {
    tabs.forEach(function (tab) {
      var reveal = tab.querySelector('.stats-tabs__value-reveal');
      if (!reveal) return;
      reveal.classList.remove('is-paused');
      reveal.style.animation = 'none';
      requestAnimationFrame(function () {
        reveal.style.animation = '';
      });
    });
  }

  function pauseReveal() {
    tabs.forEach(function (tab) {
      var reveal = tab.querySelector('.stats-tabs__value-reveal');
      if (reveal) reveal.classList.add('is-paused');
    });
  }

  window._onSpinStep = function () {
    if (paused) return;
    current = (current + 1) % tabs.length;
    activate(current);
    restartReveal();
  };

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      current = i;
      activate(i);
      restartReveal();
    });
    tab.addEventListener('mouseenter', function () { schedulePositionIndicator(i); });
  });

  nav.addEventListener('mouseenter', function () {
    paused = true;
    pauseReveal();
  });
  nav.addEventListener('mouseleave', function () {
    paused = false;
    var a = root.querySelector('.stats-tabs__tab.is-active');
    if (a) schedulePositionIndicator(parseInt(a.dataset.tab));
    restartReveal();
  });

  schedulePositionIndicator(0);
  activate(0);
  restartReveal();
})();

/* Hero canvas — defer until fonts + idle so LCP (headline) paints first */
(function () {
  function loadHeroCanvas() {
    if (window.__heroCanvasLoaded) return;
    window.__heroCanvasLoaded = true;
    var s = document.createElement('script');
    s.src = '/js/hero-canvas.js';
    s.async = true;
    document.body.appendChild(s);
  }

  function scheduleHeroCanvas() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadHeroCanvas, { timeout: 3000 });
    } else {
      setTimeout(loadHeroCanvas, 200);
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleHeroCanvas).catch(scheduleHeroCanvas);
  } else if (document.readyState === 'complete') {
    scheduleHeroCanvas();
  } else {
    window.addEventListener('load', scheduleHeroCanvas, { once: true });
  }
})();