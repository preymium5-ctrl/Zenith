(function () {
  var filters = document.querySelectorAll('.library-filter');
  var cards = document.querySelectorAll('.library-card[data-category]');
  if (!filters.length || !cards.length) return;

  function firstRowSize() {
    if (window.matchMedia('(max-width: 640px)').matches) return 1;
    if (window.matchMedia('(max-width: 991px)').matches) return 2;
    return 3;
  }

  /* First grid row shows early; scroll reveal starts on row 2+ */
  function revealFirstRow() {
    var n = firstRowSize();
    var shown = 0;
    cards.forEach(function (card) {
      if (card.classList.contains('is-hidden')) return;
      if (shown < n) card.classList.add('is-visible');
      shown += 1;
    });
  }

  revealFirstRow();

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var category = btn.getAttribute('data-filter');

      filters.forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });

      cards.forEach(function (card) {
        var match = category === 'all' || card.getAttribute('data-category') === category;
        card.classList.toggle('is-hidden', !match);
      });

      revealFirstRow();
    });
  });

  window.addEventListener('resize', revealFirstRow);
}());
