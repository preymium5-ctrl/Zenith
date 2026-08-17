(function () {
  var container = document.getElementById('solChartsContainer');
  if (!container || !window.SOLARIA3_BENCH) return;

  function shortLabel(name) {
    return name
      .replace('ElevenLabs Scribe v2', 'ElevenLabs')
      .replace('Deepgram Nova-3', 'Deepgram')
      .replace('Mistral Voxtral', 'Mistral');
  }

  function renderChart(chart) {
    var block = document.createElement('div');
    block.className = 'sol-chart-block reveal';
    block.id = 'sol-chart-' + chart.id;

    var header = document.createElement('div');
    header.className = 'sol-chart-block__header';
    header.innerHTML =
      '<h3 class="sol-chart-block__title">' + chart.title + '</h3>' +
      '<span class="sol-badge">' + chart.rank + '</span>';
    block.appendChild(header);

    var wrap = document.createElement('div');
    wrap.className = 'sol-chart';
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', chart.title + ' WER comparison. Lower is better.');

    var grid = document.createElement('div');
    grid.className = 'sol-chart__grid';
    grid.setAttribute('aria-hidden', 'true');
    for (var g = 4; g >= 0; g--) {
      var line = document.createElement('div');
      line.className = 'sol-chart__gridline';
      grid.appendChild(line);
    }
    wrap.appendChild(grid);

    var cols = document.createElement('div');
    cols.className = 'sol-chart__cols';

    chart.models.forEach(function (m) {
      var pct = Math.min(100, (m.value / chart.max) * 100);
      var col = document.createElement('div');
      col.className = 'sol-chart__col' + (m.highlight ? ' sol-chart__col--hl' : '');

      var val = document.createElement('span');
      val.className = 'sol-chart__value';
      val.textContent = m.value + '%';

      var trackWrap = document.createElement('div');
      trackWrap.className = 'sol-chart__track-wrap';

      var track = document.createElement('div');
      track.className = 'sol-chart__track';

      var bar = document.createElement('div');
      bar.className = 'sol-chart__bar';
      bar.style.setProperty('--bar-h', pct + '%');
      bar.setAttribute('aria-label', m.name + ': ' + m.value + '% WER');

      if (m.highlight) {
        var glow = document.createElement('div');
        glow.className = 'sol-chart__glow';
        glow.setAttribute('aria-hidden', 'true');
        bar.appendChild(glow);
      }

      bar.appendChild(val);

      track.appendChild(bar);
      trackWrap.appendChild(track);

      var label = document.createElement('span');
      label.className = 'sol-chart__label' + (m.highlight ? ' sol-chart__label--hl' : '');
      label.textContent = shortLabel(m.name);

      col.appendChild(trackWrap);
      col.appendChild(label);
      cols.appendChild(col);
    });

    wrap.appendChild(cols);
    block.appendChild(wrap);

    var foot = document.createElement('p');
    foot.className = 'sol-chart-block__footnote';
    foot.textContent = chart.footnote;
    block.appendChild(foot);

    return block;
  }

  SOLARIA3_BENCH.charts.forEach(function (chart) {
    container.appendChild(renderChart(chart));
  });

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-visible');
          e.target.querySelectorAll('.sol-chart__col').forEach(function (col, i) {
            col.style.transitionDelay = i * 40 + 'ms';
            col.classList.add('anim');
          });
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' }
    );
    container.querySelectorAll('.sol-chart-block').forEach(function (el) {
      obs.observe(el);
    });
    container.querySelectorAll('.reveal').forEach(function (el) {
      if (!el.classList.contains('sol-chart-block')) {
        obs.observe(el);
      }
    });
  } else {
    container.querySelectorAll('.sol-chart-block').forEach(function (el) {
      el.classList.add('is-visible');
      el.querySelectorAll('.sol-chart__col').forEach(function (col) {
        col.classList.add('anim');
      });
    });
  }
})();
