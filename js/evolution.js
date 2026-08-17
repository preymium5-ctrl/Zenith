/* Zenith DS evolution — scroll reveal (incl. bench-bar fills) + axis toggles */
(function () {
  document.documentElement.classList.add('js-reveal');

  var targets = document.querySelectorAll('.reveal, .bench, .signal-field');
  if (!targets.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(function (el) { obs.observe(el); });

  document.querySelectorAll('.axis-toggle').forEach(function (toggle) {
    var scope = toggle.closest('[data-axis-scope]') || document;
    toggle.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-axis]');
      if (!btn) return;
      var axis = btn.getAttribute('data-axis');
      toggle.querySelectorAll('button[data-axis]').forEach(function (b) {
        b.setAttribute('aria-selected', String(b === btn));
      });
      scope.querySelectorAll('[data-axis-panel]').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-axis-panel') === axis);
      });
    });
  });
}());
