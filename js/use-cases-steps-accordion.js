(function () {
  const root = document.getElementById('stepsStepper');
  if (!root) return;

  const accordion = root.querySelector('.steps-accordion');
  const cards = Array.from(root.querySelectorAll('.steps-accordion__card[data-step]'));
  const panels = Array.from(root.querySelectorAll('[data-step-panel]'));
  if (!accordion || !cards.length) return;

  const triggers = cards.map((card) => card.querySelector('.steps-accordion__header'));
  const mqDesktop = window.matchMedia('(min-width: 901px)');
  const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const autoAdvance = !mqMotion.matches;

  let inView = true;
  let advanceTimer = null;
  let progressTimer = null;
  let layoutFrame = 0;

  function readTimingMs(token, fallback) {
    const raw = getComputedStyle(accordion).getPropertyValue(token).trim();
    if (!raw) return fallback;
    if (raw.endsWith('ms')) return parseFloat(raw);
    if (raw.endsWith('s')) return parseFloat(raw) * 1000;

    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;transition-duration:' + raw;
    accordion.appendChild(probe);
    const seconds = parseFloat(getComputedStyle(probe).transitionDuration);
    probe.remove();
    return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : fallback;
  }

  function readStepDuration() {
    return readTimingMs('--steps-step-duration', 8000);
  }

  function readLayoutDuration() {
    return readTimingMs('--steps-d-layout', 1120);
  }

  function readProgressDelay() {
    return readTimingMs('--steps-d-layout', 1120);
  }

  function parseCSSValue(value) {
    const raw = (value || '').trim();
    if (!raw) return 0;
    if (/^-?\d+(\.\d+)?px$/.test(raw)) return parseFloat(raw);

    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:' + raw;
    accordion.appendChild(probe);
    const px = probe.offsetWidth;
    probe.remove();
    return px;
  }

  function readGap() {
    const gap = getComputedStyle(accordion).columnGap || getComputedStyle(accordion).gap;
    return parseCSSValue(gap) || 12;
  }

  function readCollapsedWidth() {
    return parseCSSValue(getComputedStyle(accordion).getPropertyValue('--steps-accordion-collapsed')) || 88;
  }

  function measurePanelBody(panel, width) {
    const probe = document.createElement('div');
    probe.style.cssText = [
      'position:absolute',
      'visibility:hidden',
      'pointer-events:none',
      'width:' + width + 'px',
      'display:flex',
      'flex-direction:column',
      'gap:var(--space-4)',
      'box-sizing:border-box',
    ].join(';');
    accordion.appendChild(probe);

    const clone = panel.cloneNode(true);
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'false');
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.maxHeight = 'none';
    clone.style.pointerEvents = 'auto';
    probe.appendChild(clone);
    const height = clone.offsetHeight;
    probe.remove();
    return height;
  }

  function measureCollapsedHeader() {
    const header = cards[0]?.querySelector('.steps-accordion__header');
    if (!header) return 116;

    const collapsedWidth = readCollapsedWidth();
    const probe = document.createElement('div');
    probe.style.cssText = [
      'position:absolute',
      'visibility:hidden',
      'pointer-events:none',
      'width:' + collapsedWidth + 'px',
      'box-sizing:border-box',
    ].join(';');
    accordion.appendChild(probe);

    const clone = header.cloneNode(true);
    clone.style.cssText = [
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:flex-start',
      'gap:var(--space-3)',
      'width:100%',
      'padding:0',
      'border:none',
      'background:transparent',
    ].join(';');
    probe.appendChild(clone);
    const height = clone.offsetHeight;
    probe.remove();
    return height;
  }

  function getExpandedCard() {
    return cards.find((card) => card.classList.contains('is-active')) || cards[0];
  }

  function syncLayout() {
    if (!mqDesktop.matches) {
      accordion.style.removeProperty('--steps-accordion-body-h');
      accordion.style.removeProperty('--steps-accordion-header-h');
      accordion.style.removeProperty('--steps-accordion-min-h');
      accordion.style.removeProperty('height');
      cards.forEach((card) => {
        card.style.removeProperty('--step-card-w');
        card.classList.toggle('is-expanded', card.classList.contains('is-active'));
      });

      const padX =
        parseCSSValue(getComputedStyle(cards[0]).paddingLeft) +
        parseCSSValue(getComputedStyle(cards[0]).paddingRight);
      const mobileWidth = Math.max(accordion.clientWidth - padX, 240);
      let maxMobile = 0;
      panels.forEach((panel) => {
        maxMobile = Math.max(maxMobile, measurePanelBody(panel, mobileWidth));
      });
      accordion.style.setProperty('--steps-mobile-body-h', maxMobile + 'px');
      return;
    }

    accordion.style.removeProperty('--steps-mobile-body-h');

    const collapsed = readCollapsedWidth();
    const gap = readGap();
    const total = accordion.clientWidth;
    const expandedCard = getExpandedCard();
    const expandedIndex = Math.max(cards.indexOf(expandedCard), 0);
    const expandedW = Math.max(
      total - gap * (cards.length - 1) - collapsed * (cards.length - 1),
      300
    );

    const sampleCard = cards[0];
    const padX =
      parseCSSValue(getComputedStyle(sampleCard).paddingLeft) +
      parseCSSValue(getComputedStyle(sampleCard).paddingRight);
    const padY =
      parseCSSValue(getComputedStyle(sampleCard).paddingTop) +
      parseCSSValue(getComputedStyle(sampleCard).paddingBottom);
    const contentW = Math.max(expandedW - padX, 220);

    let maxBody = 0;
    panels.forEach((panel) => {
      maxBody = Math.max(maxBody, measurePanelBody(panel, contentW));
    });

    const headerCollapsed = measureCollapsedHeader();
    const headerActive = parseCSSValue(
      getComputedStyle(accordion).getPropertyValue('--steps-accordion-header-active-h')
    ) || 32;
    const innerGap = parseCSSValue(getComputedStyle(sampleCard).rowGap) || 16;
    const minH = padY + headerActive + innerGap + maxBody;

    accordion.style.setProperty('--steps-accordion-body-h', maxBody + 'px');
    accordion.style.setProperty('--steps-accordion-header-h', headerCollapsed + 'px');
    accordion.style.setProperty('--steps-accordion-min-h', minH + 'px');
    accordion.style.setProperty('--steps-accordion-expanded-w', contentW + 'px');
    accordion.style.height = minH + 'px';

    cards.forEach((card, index) => {
      const isExpanded = index === expandedIndex;
      const width = isExpanded ? expandedW : collapsed;
      card.style.setProperty('--step-card-w', width + 'px');
      card.classList.toggle('is-expanded', isExpanded);
    });
  }

  function queueLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
      syncLayout();
      layoutFrame = 0;
    });
  }

  function layoutNow() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = 0;
    syncLayout();
  }

  function clearProgressTimer() {
    clearTimeout(progressTimer);
    progressTimer = null;
  }

  function clearAdvance() {
    clearTimeout(advanceTimer);
    advanceTimer = null;
  }

  function scheduleAdvance() {
    clearAdvance();
    if (!autoAdvance || !inView || root.classList.contains('is-paused')) return;

    const active = cards.find((card) => card.classList.contains('is-active'));
    const fill = active?.querySelector('.steps-accordion__progress-fill');
    if (fill) return;

    advanceTimer = setTimeout(advance, readProgressDelay() + readStepDuration());
  }

  function restartProgress(card) {
    clearProgressTimer();
    const fill = card?.querySelector('.steps-accordion__progress-fill');
    if (!fill) {
      scheduleAdvance();
      return;
    }

    fill.classList.remove('is-running');
    void fill.offsetWidth;
    if (!autoAdvance || !inView || root.classList.contains('is-paused')) return;

    progressTimer = setTimeout(() => {
      if (!card.classList.contains('is-active')) return;
      if (!inView || root.classList.contains('is-paused')) return;
      fill.classList.add('is-running');
    }, readProgressDelay());
  }

  function select(id) {
    cards.forEach((card) => {
      const isActive = card.dataset.step === id;
      const trigger = card.querySelector('.steps-accordion__header');
      card.classList.toggle('is-active', isActive);
      if (trigger) {
        trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
        trigger.tabIndex = isActive ? 0 : -1;
      }
      if (!isActive) {
        const fill = card.querySelector('.steps-accordion__progress-fill');
        if (fill) fill.classList.remove('is-running');
      }
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.stepPanel === id;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    const ctaBtn = document.querySelector('.steps-cta-bar .btn');
    if (ctaBtn) {
      ctaBtn.querySelectorAll('.btn-text, .btn-text-clone').forEach((el) => {
        el.style.transform = '';
      });
    }

    layoutNow();

    const active = cards.find((card) => card.dataset.step === id);
    if (active) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => restartProgress(active));
      });
    }
  }

  function advance() {
    const index = cards.findIndex((card) => card.classList.contains('is-active'));
    const next = cards[(index + 1) % cards.length];
    select(next.dataset.step);
  }

  function setPaused(paused) {
    root.classList.toggle('is-paused', paused);
    if (paused) {
      clearAdvance();
      clearProgressTimer();
      const active = cards.find((card) => card.classList.contains('is-active'));
      const fill = active?.querySelector('.steps-accordion__progress-fill');
      if (fill) fill.classList.remove('is-running');
      return;
    }

    const active = cards.find((card) => card.classList.contains('is-active'));
    if (active) restartProgress(active);
  }

  accordion.addEventListener('click', (e) => {
    const card = e.target.closest('.steps-accordion__card[data-step]');
    if (!card) return;
    select(card.dataset.step);
  });

  accordion.addEventListener('animationend', (e) => {
    if (!autoAdvance || !inView || root.classList.contains('is-paused')) return;
    if (!e.target.classList.contains('steps-accordion__progress-fill')) return;
    if (!e.target.classList.contains('is-running')) return;
    advance();
  });

  function syncPauseFromInteraction() {
    setPaused(accordion.contains(document.activeElement));
  }

  accordion.addEventListener('focusin', () => syncPauseFromInteraction());
  accordion.addEventListener('focusout', (e) => {
    if (accordion.contains(e.relatedTarget)) return;
    syncPauseFromInteraction();
  });

  triggers.forEach((trigger, index) => {
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = triggers[(index + 1) % triggers.length];
        next.focus();
        select(next.closest('.steps-accordion__card').dataset.step);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = triggers[(index - 1 + triggers.length) % triggers.length];
        prev.focus();
        select(prev.closest('.steps-accordion__card').dataset.step);
      }
    });
  });

  if ('IntersectionObserver' in window) {
    const viewIo = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        const active = cards.find((card) => card.classList.contains('is-active'));
        if (!active) return;

        if (inView && autoAdvance && !root.classList.contains('is-paused')) {
          restartProgress(active);
        } else {
          clearAdvance();
          clearProgressTimer();
          const fill = active.querySelector('.steps-accordion__progress-fill');
          if (fill) fill.classList.remove('is-running');
        }
      },
      { threshold: 0.35 }
    );
    viewIo.observe(root);
  }

  mqDesktop.addEventListener('change', queueLayout);
  window.addEventListener('resize', queueLayout);
  if (document.fonts?.ready) document.fonts.ready.then(queueLayout);

  layoutNow();
  select(cards.find((card) => card.classList.contains('is-active'))?.dataset.step || cards[0].dataset.step);
})();
