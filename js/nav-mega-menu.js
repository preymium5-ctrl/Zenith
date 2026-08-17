/**
 * Enhanced mega-menu — hover intent, keyboard disclosure, delegated events.
 * Viewport resizes per panel; panel body reveals from the left on every switch.
 */
(function () {
  'use strict';

  var mega = document.getElementById('megaMenu');
  var navLinks = document.querySelector('.navbar-links');
  if (!mega || !navLinks) return;

  var OPEN_DELAY = 60;
  var CLOSE_DELAY = 250;
  var STAGE_MS = 280;

  var activePanel = null;
  var activeButton = null;
  var hideTimeout = null;
  var showTimeout = null;
  var switchCleanupTimeout = null;
  var resizeTimeout = null;

  var viewport = null;
  var stage = null;
  var panels = [];
  var panelIndex = {};
  var panelWidths = {};
  var colWidth = 0;
  var spotlightWidth = 0;
  var panelHeights = {};
  var metricsReady = false;

  function initStage() {
    viewport = mega.querySelector('.mega-menu-viewport');
    stage = mega.querySelector('.mega-menu-track');

    if (!viewport) {
      viewport = document.createElement('div');
      viewport.className = 'mega-menu-viewport';
      stage = document.createElement('div');
      stage.className = 'mega-menu-track';

      while (mega.firstChild) {
        stage.appendChild(mega.firstChild);
      }
      viewport.appendChild(stage);
      mega.appendChild(viewport);
    }

    panels = Array.prototype.slice.call(stage.querySelectorAll('.mega-menu-panel'));
    panels.forEach(function (panel, index) {
      panelIndex[panel.dataset.panel] = index;
    });
  }

  function panelByName(name) {
    return mega.querySelector('[data-panel="' + name + '"]');
  }

  function setExpanded(btn, open) {
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function flatCols(panel) {
    var grid = panel.querySelector('.mega-menu-grid--flat');
    if (!grid) return 2;
    return parseInt(grid.getAttribute('data-flat-cols') || '2', 10);
  }

  function setPanelWidth(panel) {
    if (!colWidth || !spotlightWidth) return;
    var cols = flatCols(panel);
    var width = cols * colWidth + spotlightWidth;
    panel.style.width = width + 'px';
    panelWidths[panel.dataset.panel] = width;
  }

  function measureReferenceMetrics() {
    var product = panelByName('product');
    if (!product || !panels.length) return;

    var refOuter = Math.min(
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--max-w-container'), 10) || 1200,
      window.innerWidth - 48
    );
    var minCol = parseFloat(getComputedStyle(mega).getPropertyValue('--mega-flat-col-width')) || 320;
    var minSpot = parseFloat(getComputedStyle(mega).getPropertyValue('--mega-spotlight-width')) || 300;

    mega.classList.add('is-measuring');
    document.documentElement.style.setProperty('--mega-flat-col-width', minCol + 'px');
    document.documentElement.style.setProperty('--mega-spotlight-width', minSpot + 'px');
    product.style.width = refOuter + 'px';
    viewport.style.width = refOuter + 'px';

    var spot = product.querySelector('.mega-menu-spotlight');
    if (!spot) return;

    spotlightWidth = Math.max(minSpot, spot.getBoundingClientRect().width);
    colWidth = Math.max(minCol, (refOuter - spotlightWidth) / 3);

    document.documentElement.style.setProperty('--mega-flat-col-width', colWidth + 'px');
    document.documentElement.style.setProperty('--mega-spotlight-width', spotlightWidth + 'px');

    product.style.width = '';
    viewport.style.width = '';
    mega.classList.remove('is-measuring');

    panels.forEach(setPanelWidth);
    panelHeights = {};
    metricsReady = true;
  }

  function ensureMetrics() {
    if (!metricsReady) measureReferenceMetrics();
  }

  function measurePanelHeight(panel) {
    var name = panel.dataset.panel;
    if (panelHeights[name]) return panelHeights[name];

    panel.classList.add('is-measuring');
    var height = panel.offsetHeight;
    panel.classList.remove('is-measuring');
    panelHeights[name] = height;
    return height;
  }

  function syncViewport(panel, animate) {
    ensureMetrics();

    var name = panel.dataset.panel;
    var width = panelWidths[name] || panel.offsetWidth;
    var height = panelHeights[name] || measurePanelHeight(panel);

    if (!animate) {
      viewport.style.transition = 'none';
    }

    viewport.style.width = width + 'px';
    viewport.style.height = height + 'px';

    if (!animate) {
      requestAnimationFrame(function () {
        viewport.style.transition = '';
      });
    }
  }

  function revealPanelBody(panel) {
    var body = panel.querySelector('.mega-menu-panel-body');
    if (!body) return;
    body.classList.remove('is-revealing');
    void body.offsetWidth;
    body.classList.add('is-revealing');
  }

  function clearPanelState(panel) {
    if (!panel) return;
    panel.classList.remove('is-visible', 'is-entering', 'is-measuring');
    var body = panel.querySelector('.mega-menu-panel-body');
    if (body) body.classList.remove('is-revealing');
  }

  function updatePanelA11y(name) {
    panels.forEach(function (panel) {
      var isActive = panel.dataset.panel === name;
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  function updateTrigger(trigger) {
    if (activeButton && activeButton !== trigger) {
      activeButton.classList.remove('is-active');
      setExpanded(activeButton, false);
    }
    if (trigger) {
      trigger.classList.add('is-active');
      setExpanded(trigger, true);
      activeButton = trigger;
    }
  }

  function resetStage() {
    clearTimeout(switchCleanupTimeout);
    viewport.style.width = '';
    viewport.style.height = '';
    viewport.style.transition = '';
  }

  function hidePanel(returnFocus) {
    clearTimeout(showTimeout);
    clearTimeout(hideTimeout);

    var focusTarget = returnFocus ? activeButton : null;

    panels.forEach(function (panel) {
      clearPanelState(panel);
      panel.setAttribute('aria-hidden', 'true');
    });

    if (activeButton) {
      activeButton.classList.remove('is-active');
      setExpanded(activeButton, false);
      activeButton = null;
    }

    activePanel = null;
    mega.classList.remove('is-visible', 'is-opening', 'is-switching');
    mega.removeAttribute('data-active-panel');
    resetStage();

    if (focusTarget) focusTarget.focus();
  }

  function openPanel(panel, name, trigger) {
    ensureMetrics();

    panels.forEach(clearPanelState);
    panel.classList.add('is-visible');
    activePanel = panel;
    mega.classList.add('is-visible', 'is-opening');
    mega.classList.remove('is-switching');
    mega.dataset.activePanel = name;
    updatePanelA11y(name);
    updateTrigger(trigger);

    syncViewport(panel, false);
    revealPanelBody(panel);
  }

  function switchPanel(incoming, name, trigger) {
    ensureMetrics();

    var outgoing = activePanel;

    mega.classList.add('is-switching');
    mega.classList.remove('is-opening');

    incoming.classList.add('is-visible');
    activePanel = incoming;
    mega.dataset.activePanel = name;
    updatePanelA11y(name);
    updateTrigger(trigger);

    syncViewport(incoming, true);
    revealPanelBody(incoming);

    if (outgoing && outgoing !== incoming) {
      clearPanelState(outgoing);
    }

    clearTimeout(switchCleanupTimeout);
    switchCleanupTimeout = setTimeout(function () {
      mega.classList.remove('is-switching');
    }, STAGE_MS + 40);
  }

  function applyPanel(name, trigger) {
    clearTimeout(hideTimeout);

    var panel = panelByName(name);
    if (!panel) return;

    if (activePanel === panel) {
      updateTrigger(trigger);
      return;
    }

    var wasOpen = mega.classList.contains('is-visible');

    if (!wasOpen) {
      openPanel(panel, name, trigger);
      return;
    }

    switchPanel(panel, name, trigger);
  }

  function showPanel(name, trigger, immediate) {
    clearTimeout(showTimeout);
    var instant = immediate || mega.classList.contains('is-visible');
    if (instant) {
      applyPanel(name, trigger);
      return;
    }
    showTimeout = setTimeout(function () {
      applyPanel(name, trigger);
    }, OPEN_DELAY);
  }

  function scheduleHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(function () {
      hidePanel(false);
    }, CLOSE_DELAY);
  }

  initStage();
  panels.forEach(function (panel) {
    panel.setAttribute('aria-hidden', 'true');
  });

  requestAnimationFrame(function () {
    measureReferenceMetrics();
    panels.forEach(function (panel) {
      measurePanelHeight(panel);
    });
  });

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      metricsReady = false;
      panelHeights = {};
      if (!mega.classList.contains('is-visible') || !activePanel) return;
      measureReferenceMetrics();
      syncViewport(activePanel, false);
    }, 120);
  });

  navLinks.addEventListener('mouseover', function (e) {
    var btn = e.target.closest('[data-menu]');
    if (!btn) return;
    showPanel(btn.dataset.menu, btn, false);
  });

  navLinks.addEventListener('mouseout', function (e) {
    if (!e.target.closest('[data-menu]')) return;
    if (navLinks.contains(e.relatedTarget)) return;
    clearTimeout(showTimeout);
    scheduleHide();
  });

  navLinks.addEventListener('focusin', function (e) {
    var btn = e.target.closest('[data-menu]');
    if (btn) showPanel(btn.dataset.menu, btn, true);
  });

  navLinks.addEventListener('keydown', function (e) {
    var btn = e.target.closest('[data-menu]');
    if (!btn) return;

    var buttons = Array.prototype.slice.call(navLinks.querySelectorAll('[data-menu]'));
    var index = buttons.indexOf(btn);

    if (e.key === 'Escape') {
      hidePanel(true);
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showPanel(btn.dataset.menu, btn, true);
      var panel = panelByName(btn.dataset.menu);
      var firstLink = panel && panel.querySelector('a[href]');
      if (firstLink) firstLink.focus();
      return;
    }
    if (e.key === 'ArrowRight' && index < buttons.length - 1) {
      e.preventDefault();
      var next = buttons[index + 1];
      next.focus();
      showPanel(next.dataset.menu, next, true);
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      var prev = buttons[index - 1];
      prev.focus();
      showPanel(prev.dataset.menu, prev, true);
    }
  });

  mega.addEventListener('mouseenter', function () {
    clearTimeout(hideTimeout);
    clearTimeout(showTimeout);
  });
  mega.addEventListener('mouseleave', scheduleHide);

  document.addEventListener('focusin', function (e) {
    if (!activePanel) return;
    if (mega.contains(e.target) || e.target.closest('.navbar-links')) return;
    hidePanel(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activePanel) hidePanel(true);
  });
})();
