/**
 * Homepage — load non-critical scripts when sections approach the viewport
 * or when the user interacts with bento triggers (cards sit above #bentoDetail).
 */
(function () {
  var bentoLoaded = false;
  var belowFoldLoaded = false;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  function loadBentoDetail() {
    if (bentoLoaded) return;
    bentoLoaded = true;
    loadScript('/js/bento-detail.js').catch(function () {});
  }

  function loadBelowFold() {
    if (belowFoldLoaded) return;
    belowFoldLoaded = true;
    loadScript('/js/homepage-below-fold.js').catch(function () {});
  }

  function whenNear(el, margin, fn) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      fn();
      return;
    }
    var done = false;
    var obs = new IntersectionObserver(
      function (entries) {
        if (done) return;
        if (entries.some(function (e) { return e.isIntersecting; })) {
          done = true;
          obs.disconnect();
          fn();
        }
      },
      { rootMargin: margin || '480px 0px' }
    );
    obs.observe(el);
  }

  whenNear(document.getElementById('bentoDetail'), '400px 0px', loadBentoDetail);

  var triggers = document.querySelectorAll('[data-bento-detail]');
  if (triggers.length) {
    whenNear(triggers[0], '600px 0px', loadBentoDetail);
    triggers.forEach(function (el) {
      el.addEventListener('pointerenter', loadBentoDetail, { once: true, passive: true });
      el.addEventListener('focus', loadBentoDetail, { once: true });
      el.addEventListener('click', loadBentoDetail, { once: true });
    });
  }

  /* HIW traces, testimonials cursor — below the fold */
  whenNear(document.getElementById('hiwSection'), '700px 0px', loadBelowFold);
  whenNear(document.querySelector('.homepage-v3 .testimonials-section'), '500px 0px', loadBelowFold);

  var exploreCue = document.querySelector('.homepage-v3 .hero-scroll-cue');
  if (exploreCue) {
    exploreCue.addEventListener('click', loadBelowFold, { once: true, passive: true });
  }
})();