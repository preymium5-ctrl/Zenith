/* Testimonials — custom avatar cursor (the pointer becomes the speaker's portrait) */
(function () {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const grid = document.querySelector('.homepage-v3 .testimonials-grid');
  if (!grid) return;

  const section = document.querySelector('.homepage-v3 .testimonials-section');
  const halo = section ? section.querySelector('.testimonials-cursor-halo') : null;

  const cursor = document.createElement('div');
  cursor.className = 'testimonials-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.innerHTML =
    '<div class="testimonials-cursor-avatar"></div>' +
    '<svg class="testimonials-cursor-heart" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
    '</svg>' +
    '<div class="testimonials-cursor-cta">' +
      '<span class="testimonials-cursor-cta-label">Read the case study</span>' +
      '<svg class="testimonials-cursor-cta-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
    '</div>' +
    '<div class="testimonials-cursor-meta">' +
      '<span class="testimonials-cursor-name"></span>' +
      '<span class="testimonials-cursor-role"></span>' +
    '</div>';
  document.body.appendChild(cursor);

  const avatarEl = cursor.querySelector('.testimonials-cursor-avatar');
  const nameEl = cursor.querySelector('.testimonials-cursor-name');
  const roleEl = cursor.querySelector('.testimonials-cursor-role');
  const ctaEl = cursor.querySelector('.testimonials-cursor-cta');
  const ctaLabelEl = cursor.querySelector('.testimonials-cursor-cta-label');
  const videoLightbox = document.getElementById('videoLightbox');
  const videoLightboxFrame = document.getElementById('videoLightboxFrame');

  function toYoutubeEmbed(url) {
    if (!url) return '';
    const short = url.match(/youtu\.be\/([^?&/]+)/i);
    if (short && short[1]) return 'https://www.youtube.com/embed/' + short[1] + '?autoplay=1&rel=0';
    const full = url.match(/[?&]v=([^?&]+)/i);
    if (full && full[1]) return 'https://www.youtube.com/embed/' + full[1] + '?autoplay=1&rel=0';
    return '';
  }

  function closeVideoLightbox() {
    if (!videoLightbox || !videoLightboxFrame) return;
    videoLightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-video-lightbox-open');
    videoLightboxFrame.src = '';
  }

  function openVideoLightbox(url) {
    const embed = toYoutubeEmbed(url);
    if (!videoLightbox || !videoLightboxFrame || !embed) return false;
    videoLightboxFrame.src = embed;
    videoLightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-video-lightbox-open');
    return true;
  }

  if (videoLightbox) {
    videoLightbox.addEventListener('click', (e) => {
      if (e.target.closest('[data-video-lightbox-close]')) closeVideoLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && videoLightbox.getAttribute('aria-hidden') === 'false') {
        closeVideoLightbox();
      }
    });
  }

  let raf = 0;
  let px = 0, py = 0;
  let hx = 0, hy = 0;
  let currentCard = null;

  function renderPosition() {
    cursor.style.transform =
      'translate3d(' + px + 'px, ' + py + 'px, 0) translate(-50%, -50%)';
    if (halo) {
      halo.style.transform =
        'translate3d(' + hx + 'px, ' + hy + 'px, 0) translate(-50%, -50%)';
    }
    raf = 0;
  }

  function haloForCard(card) {
    if (!card) return 'violet';
    const style = card.getAttribute('style') || '';
    if (style.indexOf('grid-area:b') !== -1 || style.indexOf('grid-area:e') !== -1) return 'magenta';
    if (style.indexOf('grid-area:d') !== -1 || style.indexOf('grid-area:g') !== -1) return 'rose';
    return 'violet';
  }

  function populate(card) {
    if (!card || card === currentCard) return;
    currentCard = card;

    let src = '';
    let name = '';
    let role = '';
    let isLogo = false;
    let initials = '';

    if (card.classList.contains('photo-card')) {
      const photo = card.querySelector('.testimonial-photo > img');
      if (photo) src = photo.getAttribute('src');
      const nm = card.querySelector('.testimonial-photo-name');
      const rl = card.querySelector('.testimonial-photo-role');
      name = nm ? nm.textContent.trim() : '';
      role = rl ? rl.textContent.trim() : '';
    } else {
      const avatar = card.querySelector('.testimonial-avatar');
      if (avatar && avatar.tagName === 'IMG') {
        src = avatar.getAttribute('src');
      } else if (avatar) {
        initials = avatar.textContent.trim();
      }
      const nm = card.querySelector('.testimonial-name');
      const rl = card.querySelector('.testimonial-role');
      name = nm ? nm.textContent.trim() : '';
      role = rl ? rl.textContent.trim() : '';
      if (!src && !initials) {
        const companyImg = card.querySelector('.testimonial-company img');
        if (companyImg) { src = companyImg.getAttribute('src'); isLogo = true; }
      }
    }

    avatarEl.classList.toggle('is-logo', isLogo);
    if (src) {
      avatarEl.innerHTML = '<img src="' + src + '" alt="">';
    } else if (initials) {
      avatarEl.textContent = initials;
    } else {
      avatarEl.textContent = '';
    }

    nameEl.textContent = name;
    roleEl.textContent = role;

    const caseStudy = card.getAttribute('data-case-study');
    if (caseStudy) {
      const label = card.getAttribute('data-case-study-label') || 'Read the case study';
      ctaLabelEl.textContent = label;
      cursor.classList.add('has-cta');
    } else {
      cursor.classList.remove('has-cta');
    }
  }

  /* Grid-scoped listeners — drive the AVATAR cursor (needs the card context) */
  grid.addEventListener('pointerenter', () => {
    grid.classList.add('is-cursor-active');
  });

  grid.addEventListener('pointerleave', () => {
    grid.classList.remove('is-cursor-active');
    cursor.classList.remove('is-active');
    cursor.classList.remove('has-cta');
    currentCard = null;
  });

  /* Cards with [data-case-study] become clickable surfaces — click anywhere
     on the card to follow the link. */
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.testimonial-card[data-case-study]');
    if (!card) return;
    const url = card.getAttribute('data-case-study');
    if (!url || url === '#') return;
    const caseStudyType = card.getAttribute('data-case-study-type');
    if (caseStudyType === 'youtube' && openVideoLightbox(url)) {
      e.preventDefault();
      return;
    }
    window.open(url, '_blank', 'noopener');
  });

  /* Keyboard equivalent — Enter/Space on a focused case-study card */
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.testimonial-card[data-case-study]');
    if (!card || card !== e.target) return;
    const url = card.getAttribute('data-case-study');
    if (!url || url === '#') return;
    e.preventDefault();
    const caseStudyType = card.getAttribute('data-case-study-type');
    if (caseStudyType === 'youtube' && openVideoLightbox(url)) return;
    window.open(url, '_blank', 'noopener');
  });

  grid.addEventListener('pointermove', (e) => {
    px = e.clientX;
    py = e.clientY;

    const card = e.target.closest('.testimonial-card');
    if (card) {
      populate(card);
      if (!cursor.classList.contains('is-active')) cursor.classList.add('is-active');
    } else {
      cursor.classList.remove('is-active');
      currentCard = null;
    }
  });

  /* Section-scoped listeners — drive the HALO so it drifts across the
     whole testimonials section (header, gaps, outside the grid). */
  if (section && halo) {
    section.addEventListener('pointerenter', () => {
      section.classList.add('is-halo-active');
    });

    section.addEventListener('pointerleave', () => {
      section.classList.remove('is-halo-active');
      section.removeAttribute('data-halo');
    });

    const haloParent = halo.parentElement || section;

    section.addEventListener('pointermove', (e) => {
      const rect = haloParent.getBoundingClientRect();
      hx = e.clientX - rect.left;
      hy = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(renderPosition);

      const card = e.target.closest('.testimonial-card');
      if (card) {
        section.setAttribute('data-halo', haloForCard(card));
      } else {
        section.removeAttribute('data-halo');
      }
    });
  }
})();

/* HIW continuous flow — reveal phases + snap diagram when step text hits center */
(function () {
  var section = document.getElementById('hiwSection');
  if (!section) return;

  var steps = section.querySelectorAll('.hiw-step');
  var phases = section.querySelectorAll('.hiw-phase');
  var flow = section.querySelector('.hiw-diagram-flow');
  var stage = section.querySelector('.hiw-diagram-stage');
  var flowLine = section.querySelector('.hiw-flow-line');
  var currentStep = -1;

  if (steps.length === 0 || !flow || !stage) return;

  /* ── Luminous tracé (choreographed per phase) ──
     Two distinct, coordinated animations that fire together when a phase
     becomes current:
       1) Connector trace — short comet along a straight line from the
          previous phase's anchor (bottom-centre) to the current card's
          top-centre.
       2) Border trace — comet looping once around the card's perimeter,
          matched in duration to the card's own reveal transition.
     Both are drawn in flow-local coordinates (offsetLeft/Top), so the
     concurrent `scrollToPhase` transform on `.hiw-diagram-flow` moves
     trace + cards together — no desync, single trigger, one choreography. */
  var NS_SVG = 'http://www.w3.org/2000/svg';
  /* Two SVG overlays — `back` sits behind the phase cards (z-index below
     the cards) so persistent connector lines look like wires plugged in
     from behind; `front` sits above everything (comet + border traces).
     Splitting by stacking order lets us keep the moving comet visible on
     top while the faint breadcrumb it leaves slides under the cards. */
  var overlaySvgBack = null;
  var overlaySvgFront = null;
  var flowLineBack = null;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phaseRun = {};
  var lastPhaseRun = -1;

  /* Per-phase visual-centre ratios. A smaller value puts the phase higher
     in the stage; larger = lower. Phase 3 (Integrate) carries a taller
     content stack (badge + 3 tool cards), so we aim it lower to keep its
     vertical mid-weight close to the step text on the right. */
  var PHASE_VCENTER = [0.42, 0.42, 0.42, 0.55];

  function measurePhaseTransform(idx) {
    if (window.innerWidth <= 960 || !phases[idx]) return '';
    var stageH = stage.clientHeight;
    var pTop = phases[idx].offsetTop;
    var pH = phases[idx].offsetHeight;
    var ratio = PHASE_VCENTER[idx] != null ? PHASE_VCENTER[idx] : 0.42;
    var visualCenter = stageH * ratio;
    var ty = Math.max(0, pTop - visualCenter + (pH / 2));
    return 'translateY(' + (-ty) + 'px)';
  }

  function scrollToPhase(idx) {
    flow.style.transform = measurePhaseTransform(idx);
  }

  function initFlowLine() {
    if (!flowLine) return;
    flowLine.innerHTML = '';
    /* Back container: sibling of .hiw-flow-line inside .hiw-diagram-flow.
       Created once, inserted at the very top of the flow so it's DOM-ordered
       before any phase. CSS gives it z-index:0 (phases are z-index:1). */
    flowLineBack = flow.querySelector('.hiw-flow-line-back');
    if (!flowLineBack) {
      flowLineBack = document.createElement('div');
      flowLineBack.className = 'hiw-flow-line-back';
      flow.insertBefore(flowLineBack, flow.firstChild);
    } else {
      flowLineBack.innerHTML = '';
    }
    overlaySvgBack = document.createElementNS(NS_SVG, 'svg');
    overlaySvgBack.setAttribute('class', 'hiw-trace-overlay');
    overlaySvgBack.setAttribute('preserveAspectRatio', 'none');
    flowLineBack.appendChild(overlaySvgBack);

    overlaySvgFront = document.createElementNS(NS_SVG, 'svg');
    overlaySvgFront.setAttribute('class', 'hiw-trace-overlay');
    overlaySvgFront.setAttribute('preserveAspectRatio', 'none');
    flowLine.appendChild(overlaySvgFront);
    scheduleResizeOverlay();
  }

  function resizeOverlay() {
    if (!flow) return;
    var W = flow.offsetWidth;
    var H = flow.offsetHeight;
    [overlaySvgBack, overlaySvgFront].forEach(function (svg) {
      if (!svg) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
    });
  }

  var overlayResizeRaf = 0;
  function scheduleResizeOverlay() {
    if (overlayResizeRaf) return;
    overlayResizeRaf = requestAnimationFrame(function () {
      overlayResizeRaf = 0;
      resizeOverlay();
    });
  }

  /* Offset of any descendant relative to the flow container, accumulating
     through positioned ancestors. Transform-invariant: the result stays
     valid even while `.hiw-diagram-flow` is mid-transform. */
  function offsetInFlow(el) {
    var x = 0, y = 0, node = el;
    while (node && node !== flow) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
      if (!node) break;
    }
    return { x: x, y: y };
  }

  function getPhaseCards(idx) {
    var p = phases[idx];
    if (!p) return [];
    if (idx === 0) {
      var r = p.querySelector('.hiw-capture-result');
      return r ? [r] : [];
    }
    if (idx === 1) {
      var t = p.querySelector('.sv-transcript-card');
      return t ? [t] : [];
    }
    if (idx === 2) {
      return Array.prototype.slice.call(p.querySelectorAll('.sv-enrich-card'));
    }
    if (idx === 3) {
      return Array.prototype.slice.call(p.querySelectorAll('.sv-integrate-card'));
    }
    return [];
  }

  /* Shared anchor — single point from which all connectors of a phase
     emanate (for phases 0-2). Phase 3 uses per-card start points instead
     (see `getConnectorStart`) so its three lines don't converge.
     - Phase 0: centre-bottom of the source pills row (under Phone Call).
     - Phase 1: centre-bottom of the capture-result pill (previous phase).
     - Phase 2: centre-bottom of the transcript card (previous phase). */
  function getPhaseAnchor(idx) {
    if (!flow) return null;
    if (idx === 0) {
      var sourcesRow = phases[0] ? phases[0].querySelector('.hiw-capture-sources') : null;
      if (!sourcesRow) return null;
      var srcPos = offsetInFlow(sourcesRow);
      return {
        x: srcPos.x + sourcesRow.offsetWidth / 2,
        y: srcPos.y + sourcesRow.offsetHeight + 4
      };
    }
    var prev = phases[idx - 1];
    if (!prev) return null;
    var prevPos = offsetInFlow(prev);
    return {
      x: prevPos.x + prev.offsetWidth / 2,
      y: prevPos.y + prev.offsetHeight
    };
  }

  /* Per-card connector start. Phase 3 emits strictly PARALLEL vertical
     lines: each connector's start shares the same x as its target tool's
     top-centre, placed on the horizontal Y-level of Summary & Topics'
     bottom edge. Same x for start and end ⇒ vertical line ⇒ all three
     lines are geometrically parallel. Starts sit at the tool-above
     position regardless of whether that x falls inside Summary's card
     bounds (for tools horizontally off Summary, the start hovers next to
     Summary at the same y — still reading as "coming from Summary's
     bottom row"). */
  function getConnectorStart(idx, card) {
    if (idx !== 3) return getPhaseAnchor(idx);
    var summary = flow ? flow.querySelector('.sv-enrich-card--yellow') : null;
    if (!summary || !card) return getPhaseAnchor(idx);
    var sPos = offsetInFlow(summary);
    var cPos = offsetInFlow(card);
    return {
      x: cPos.x + card.offsetWidth / 2,
      y: sPos.y + summary.offsetHeight
    };
  }

  function getCardEntry(card) {
    var pos = offsetInFlow(card);
    return { x: pos.x + card.offsetWidth / 2, y: pos.y };
  }

  /* Smoother, flatter velocity curve than cubic — less peak at mid-travel,
     more consistent speed throughout, so the comet reads as a trajectory
     rather than a flash. */
  function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  /* Animate a bright comet with fading tail along an arbitrary SVG path `d`.
     Two stacked paths — outer (long, faint) + tip (short, bright) — ride
     the same progress; mismatched dash lengths produce the transparent-tail
     gradient. On completion, paths fade out and are removed from the DOM. */
  function traceAlongPath(d, opts) {
    opts = opts || {};
    if (!overlaySvgFront) return;
    var duration = opts.duration || 700;
    var delay = opts.delay || 0;
    var persist = !!opts.persist;

    /* Persistent breadcrumb — drawn in sync with the comet's head so the
       line appears to be "painted" by the passing light. Left behind at
       low alpha after the comet exits. Placed in the BACK overlay so it
       passes under the phase cards (wire-behind-card look). */
    var persistPath = null;
    if (persist && overlaySvgBack) {
      persistPath = document.createElementNS(NS_SVG, 'path');
      persistPath.setAttribute('class', 'hiw-trace-persist');
      persistPath.setAttribute('d', d);
      persistPath.setAttribute('fill', 'none');
      overlaySvgBack.appendChild(persistPath);
    }

    var outer = document.createElementNS(NS_SVG, 'path');
    outer.setAttribute('class', 'hiw-trace-outer');
    outer.setAttribute('d', d);
    outer.setAttribute('fill', 'none');
    overlaySvgFront.appendChild(outer);

    var tip = document.createElementNS(NS_SVG, 'path');
    tip.setAttribute('class', 'hiw-trace-tip');
    tip.setAttribute('d', d);
    tip.setAttribute('fill', 'none');
    overlaySvgFront.appendChild(tip);

    var L = tip.getTotalLength();
    /* Comet segment lengths as fractions of `L`, capped absolute so long
       border paths don't get disproportionately large tails. */
    var outerLen = Math.max(40, Math.min(L * 0.42, 150));
    var tipLen = Math.max(12, Math.min(L * 0.12, 38));

    outer.style.strokeDasharray = outerLen.toFixed(1) + ' ' + (L + outerLen + 2).toFixed(1);
    tip.style.strokeDasharray = tipLen.toFixed(1) + ' ' + (L + tipLen + 2).toFixed(1);
    outer.style.strokeDashoffset = outerLen.toFixed(1);
    tip.style.strokeDashoffset = tipLen.toFixed(1);
    outer.style.opacity = '1';
    tip.style.opacity = '1';

    if (persistPath) {
      persistPath.style.strokeDasharray = L.toFixed(1) + ' ' + L.toFixed(1);
      persistPath.style.strokeDashoffset = L.toFixed(1);
    }

    if (reducedMotion) {
      outer.remove();
      tip.remove();
      if (persistPath) persistPath.style.strokeDashoffset = '0';
      if (opts.onComplete) opts.onComplete();
      return;
    }

    function startAnim() {
      var start = performance.now();
      (function tick(now) {
        var raw = Math.min((now - start) / duration, 1);
        var p = easeInOutSine(raw);
        var outerOff = outerLen - p * (L + outerLen);
        var tipOff = tipLen - p * (L + tipLen);
        outer.style.strokeDashoffset = outerOff.toFixed(1);
        tip.style.strokeDashoffset = tipOff.toFixed(1);
        if (persistPath) {
          /* Drawn length tracks the tip's head along the path (capped at L). */
          var headPos = Math.max(0, Math.min(L, p * (L + tipLen) - tipLen));
          persistPath.style.strokeDashoffset = (L - headPos).toFixed(1);
        }
        if (raw > 0.82) {
          var fade = (raw - 0.82) / 0.18;
          var op = Math.max(0, 1 - fade);
          outer.style.opacity = op.toFixed(3);
          tip.style.opacity = op.toFixed(3);
        }
        if (raw < 1) requestAnimationFrame(tick);
        else {
          outer.remove();
          tip.remove();
          if (persistPath) persistPath.style.strokeDashoffset = '0';
          if (opts.onComplete) opts.onComplete();
        }
      })(performance.now());
    }

    if (delay > 0) setTimeout(startAnim, delay);
    else startAnim();
  }

  function traceConnector(from, to, opts) {
    var d = 'M' + from.x.toFixed(1) + ',' + from.y.toFixed(1) +
            'L' + to.x.toFixed(1) + ',' + to.y.toFixed(1);
    traceAlongPath(d, opts);
  }

  function traceBorder(card, opts) {
    if (!flow || !card) return;
    var pos = offsetInFlow(card);
    var cs = window.getComputedStyle(card);
    var rad = parseFloat(cs.borderTopLeftRadius) || 0;
    /* Enrich cards carry a 1px gradient border (::before); sit on top of
       it with offset 0. Everything else gets a hair of breathing room. */
    var offset = (card.classList && card.classList.contains('sv-enrich-card')) ? 0 : 1;
    var x = pos.x - offset;
    var y = pos.y - offset;
    var W = card.offsetWidth + offset * 2;
    var H = card.offsetHeight + offset * 2;
    var R = Math.max(0, rad + offset);
    var MID = (x + W / 2).toFixed(1);
    var x0 = x.toFixed(1);
    var y0 = y.toFixed(1);
    var x1 = (x + W).toFixed(1);
    var y1 = (y + H).toFixed(1);
    var d;
    if (R <= 0.5) {
      d = 'M' + MID + ',' + y0 +
          'L' + x1 + ',' + y0 +
          'L' + x1 + ',' + y1 +
          'L' + x0 + ',' + y1 +
          'L' + x0 + ',' + y0 + 'Z';
    } else {
      var xR = (x + R).toFixed(1);
      var xWR = (x + W - R).toFixed(1);
      var yR = (y + R).toFixed(1);
      var yHR = (y + H - R).toFixed(1);
      d = 'M' + MID + ',' + y0 +
          'L' + xWR + ',' + y0 +
          'A' + R + ',' + R + ' 0 0 1 ' + x1 + ',' + yR +
          'L' + x1 + ',' + yHR +
          'A' + R + ',' + R + ' 0 0 1 ' + xWR + ',' + y1 +
          'L' + xR + ',' + y1 +
          'A' + R + ',' + R + ' 0 0 1 ' + x0 + ',' + yHR +
          'L' + x0 + ',' + yR +
          'A' + R + ',' + R + ' 0 0 1 ' + xR + ',' + y0 + 'Z';
    }
    traceAlongPath(d, opts);
  }

  /* One phase sequence: connector + border trace per card, staggered for
     multi-card phases (enrich row, integrate). Idempotent. */
  function runPhaseSequence(idx) {
    if (phaseRun[idx]) return;
    if (window.innerWidth <= 960) return;
    phaseRun[idx] = true;
    resizeOverlay();

    var cards = getPhaseCards(idx);
    if (cards.length === 0) return;

    var CONNECT_DUR = 620;
    var BORDER_DUR = 1600;
    var PAIR_STAGGER = 180;
    var BORDER_GAP = 440; /* connector overlaps border by ~180ms for continuity */

    cards.forEach(function (card, i) {
      var baseDelay = i * PAIR_STAGGER;
      var start = getConnectorStart(idx, card);
      if (!start) return;
      var entry = getCardEntry(card);
      traceConnector(start, entry, {
        duration: CONNECT_DUR,
        delay: baseDelay,
        persist: true
      });
      setTimeout(function () {
        traceBorder(card, { duration: BORDER_DUR });
      }, baseDelay + BORDER_GAP);
    });

    /* Phase 1: drive transcript card milestones in sync with the border
       trace so the content reveals feel like they're "painted in" by the
       comet as it sweeps around. */
    if (idx === 1 && cards[0]) {
      var tc = cards[0];
      var tcStart = performance.now() + BORDER_GAP;
      var milestones = [
        { p: 0.10, cls: 'tc-m0' },
        { p: 0.25, cls: 'tc-m1' },
        { p: 0.42, cls: 'tc-m2' },
        { p: 0.60, cls: 'tc-m3' },
        { p: 0.80, cls: 'tc-m4' }
      ];
      (function msTick(now) {
        var raw = Math.max(0, Math.min((now - tcStart) / BORDER_DUR, 1));
        milestones.forEach(function (m) {
          if (raw >= m.p) tc.classList.add(m.cls);
        });
        if (raw < 1) requestAnimationFrame(msTick);
      })(performance.now());
    }
  }

  /* Catch-up: if the user loads mid-scroll and the IO first fires for a
     phase > 0, run earlier phases' sequences in quick succession so the
     trail never appears out of order. */
  function runUpToPhase(idx) {
    for (var i = lastPhaseRun + 1; i <= idx; i++) {
      (function (k) {
        var offset = (k - Math.max(0, lastPhaseRun) - 1) * 380;
        setTimeout(function () { runPhaseSequence(k); }, offset);
      })(i);
    }
    lastPhaseRun = Math.max(lastPhaseRun, idx);
  }

  initFlowLine();

  /* Resize-on-change — lightweight, no rebuild needed: paths are computed
     on-demand per trace, so the only thing that changes is the SVG viewBox. */
  window.addEventListener('resize', scheduleResizeOverlay);
  if (typeof ResizeObserver !== 'undefined') {
    var overlayRo = new ResizeObserver(scheduleResizeOverlay);
    overlayRo.observe(flow);
  }

  steps[0].classList.add('is-active');
  scrollToPhase(0);

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;

      var idx = parseInt(entry.target.getAttribute('data-hiw-step'));
      if (idx === currentStep) return;

      /* Read layout before mutating classes/styles to avoid forced reflow. */
      var nextTransform = measurePhaseTransform(idx);

      currentStep = idx;

      steps.forEach(function (s) { s.classList.remove('is-active'); });
      entry.target.classList.add('is-active');

      phases.forEach(function (p) {
        var pIdx = parseInt(p.getAttribute('data-hiw-phase'));
        if (pIdx <= idx) p.classList.add('is-revealed');
        if (pIdx < idx) {
          p.classList.add('is-past');
        } else {
          p.classList.remove('is-past');
        }
      });

      flow.querySelectorAll('[data-after-phase]').forEach(function (el) {
        var afterIdx = parseInt(el.getAttribute('data-after-phase'));
        if (afterIdx < idx - 1) {
          el.classList.add('is-past');
        } else {
          el.classList.remove('is-past');
        }
      });

      /* Transcript card background fades up when its phase is revealed.
         Milestones (tc-m0..tc-m4) are driven later by runPhaseSequence. */
      if (idx >= 1) {
        var tc = flow.querySelector('.sv-transcript-card');
        if (tc) tc.style.setProperty('--tc-bg-alpha', '1');
      }

      flow.style.transform = nextTransform;

      /* Fire the luminous trace sequence for this phase, in sync with the
         card's own reveal. Trace paths use transform-invariant offsets, so
         they stay aligned with the cards while `.hiw-diagram-flow` is still
         in its 650ms translate-Y transition. No wait needed — trace and
         card reveal start together, same trigger. */
      runUpToPhase(idx);
    });
  }, {
    root: null,
    rootMargin: '-10% 0px -75% 0px',
    threshold: 0
  });

  steps.forEach(function (step) { observer.observe(step); });

})();