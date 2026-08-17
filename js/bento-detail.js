(function () {
  var root = document.getElementById('bentoDetail');
  if (!root) return;

  var panel = root.querySelector('.bento-detail__panel');
  var closeBtn = root.querySelector('.bento-detail__close');
  var panes = root.querySelectorAll('[data-bento-detail-pane]');
  var triggers = document.querySelectorAll('[data-bento-detail]');
  var lastFocus = null;

  var titleIds = {
    languages: 'bentoTitleLanguages',
    accuracy: 'bentoTitleAccuracy',
    'audio-intelligence': 'bentoTitleAudio',
    infrastructure: 'bentoTitleInfra',
    integrations: 'bentoTitleIntegrations',
  };

  function showPane(key) {
    panes.forEach(function (p) {
      var match = p.getAttribute('data-bento-detail-pane') === key;
      p.hidden = !match;
    });
    var id = titleIds[key];
    if (id && panel) panel.setAttribute('aria-labelledby', id);
  }

  function open(key) {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    if (!titleIds[key]) return;
    lastFocus = document.activeElement;
    showPane(key);
    root.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('bento-detail-lock');
    requestAnimationFrame(function () {
      root.classList.add('is-open');
    });
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    if (!root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('bento-detail-lock');

    var restored = false;
    function restoreFocus() {
      if (restored) return;
      restored = true;
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    var done = function (e) {
      if (e.target !== root || e.propertyName !== 'opacity') return;
      root.removeEventListener('transitionend', done);
      restoreFocus();
    };
    root.addEventListener('transitionend', done);
    window.setTimeout(restoreFocus, 400);
  }

  triggers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 768px)').matches) return;
      var key = btn.getAttribute('data-bento-detail');
      open(key);
    });
  });

  root.querySelectorAll('[data-bento-detail-close]').forEach(function (el) {
    el.addEventListener('click', function () {
      close();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) {
      e.preventDefault();
      close();
    }
  });

  window.openBentoDetail = open;
})();