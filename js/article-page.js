    (function() {
      // Check if loaded in iframe (prototyper) or standalone (preview/live)
      const isInIframe = window.self !== window.top;
      const isPrototyperMode = isInIframe;

      if (isPrototyperMode) {
        document.body.classList.add('prototyper-mode');
      }
    })();
  

/* ─────────────────────────────────────────── */

    (function() {
      const navbar = document.querySelector('.site-nav-wrapper');
      const hero = document.querySelector('.article-hero, .hero--article');
      if (!navbar || !hero) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              navbar.classList.remove('scrolled');
            } else {
              navbar.classList.add('scrolled');
            }
          });
        },
        {
          rootMargin: '-80px 0px 0px 0px',
          threshold: 0
        }
      );

      observer.observe(hero);
    })();
  

/* ─────────────────────────────────────────── */

    (function() {
      // Get all sections and TOC links
      const sections = document.querySelectorAll('section[id]');
      const tocLinks = document.querySelectorAll('.article-toc-link');

      if (!sections.length || !tocLinks.length) return;

      // IntersectionObserver for better performance
      const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Trigger when section is ~20% from top
        threshold: 0
      };

      let currentActiveLink = null;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            const activeLink = document.querySelector(`.article-toc-link[href="#${sectionId}"]`);

            if (activeLink && activeLink !== currentActiveLink) {
              // Remove active class from all links
              tocLinks.forEach(link => link.classList.remove('is-active'));

              // Add active class to current link
              activeLink.classList.add('is-active');
              currentActiveLink = activeLink;
            }
          }
        });
      }, observerOptions);

      // Observe all sections
      sections.forEach(section => {
        observer.observe(section);
      });

      // Smooth scroll on TOC link click
      tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const targetSection = document.getElementById(targetId);

          if (targetSection) {
            const offsetTop = targetSection.offsetTop - 100; // Account for fixed header
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        });
      });
    })();

    // ==================== Hero Animation (transcription or agent insights) ====================
    (function() {
      var rpRoot = document.querySelector('.rp');
      if (!rpRoot) return;

      if (rpRoot.getAttribute('data-rp-mode') === 'insights') {
        runInsightsAnimation();
      } else {
        runTranscriptionAnimation();
      }

      function runTranscriptionAnimation() {
        var WORD_DELAY  = 105;
        var TURN_PAUSE  = 900;
        var END_PAUSE   = 1600;
        var _timer;

        var TURNS = [
          {
            turnId: 'rp-turn-0', textId: 'rp-text-0',
            words: ["Let's", "discuss", "the", "Q4", "roadmap,", "and", "our", "API", "integrations", "for", "the", "pipeline."],
            entityWords: { 3: true, 4: true, 7: true, 8: true },
            triggers: { 4: 'rp-entity-q4', 8: 'rp-entity-api' }
          },
          {
            turnId: 'rp-turn-1', textId: 'rp-text-1',
            words: ["Our", "WER", "dropped", "to", "4.8%", "—", "diarization", "accuracy", "is", "at", "an", "all-time", "high."],
            entityWords: { 1: true, 4: true, 6: true },
            triggers: { 4: 'rp-entity-wer', 6: 'rp-entity-diar' }
          },
          {
            turnId: 'rp-turn-2', textId: 'rp-text-2',
            words: ["Perfect.", "Let's", "ship", "by", "end", "of", "sprint", "—", "follow-up", "scheduled."],
            entityWords: { 6: true },
            triggers: { 6: 'rp-entity-sprint' },
            cursor: true
          }
        ];

        function reset() {
          clearTimeout(_timer);
          document.querySelectorAll('.rp-turn').forEach(function(el) { el.classList.remove('is-active'); });
          document.querySelectorAll('.rp-entity').forEach(function(el) { el.classList.remove('is-visible'); });
          TURNS.forEach(function(t) { var el = document.getElementById(t.textId); if (el) el.innerHTML = ''; });
        }

        function typeTurn(idx, onDone) {
          var turn = TURNS[idx];
          var turnEl = document.getElementById(turn.turnId);
          var textEl = document.getElementById(turn.textId);
          if (!turnEl || !textEl) { onDone(); return; }

          turnEl.classList.add('is-active');
          textEl.innerHTML = '';
          var wi = 0;

          function nextWord() {
            if (wi >= turn.words.length) {
              if (turn.cursor) {
                var cur = document.createElement('span');
                cur.className = 'rp-cursor';
                textEl.appendChild(cur);
              }
              _timer = setTimeout(onDone, TURN_PAUSE);
              return;
            }
            var word = turn.words[wi];
            var span = document.createElement('span');
            if (turn.entityWords && turn.entityWords[wi]) span.className = 'rp-word-entity';
            span.textContent = (wi > 0 ? ' ' : '') + word;
            textEl.appendChild(span);

            if (turn.triggers && turn.triggers[wi] != null) {
              (function(id) {
                setTimeout(function() {
                  var el = document.getElementById(id);
                  if (el) el.classList.add('is-visible');
                }, 120);
              })(turn.triggers[wi]);
            }
            wi++;
            _timer = setTimeout(nextWord, WORD_DELAY);
          }
          nextWord();
        }

        function runSequence() {
          reset();
          var idx = 0;
          function next() {
            if (idx >= TURNS.length) { _timer = setTimeout(runSequence, END_PAUSE); return; }
            typeTurn(idx++, next);
          }
          next();
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runSequence);
        } else {
          runSequence();
        }
      }

      function runInsightsAnimation() {
        var rpRoot = document.querySelector('.rp[data-rp-mode="insights"]');
        if (!rpRoot) return;

        var WORD_MS       = 95;
        var PRE_INSIGHT   = 350;
        var INSIGHT_HOLD  = 900;   /* pause insight avant beat suivant */
        var FINAL_HOLD    = 1800;  /* pause fin de séquence avant loop */
        var BEAT_GAP      = 180;   /* enchaînement beat 1 → beat 2 */
        var LOOP_PAUSE    = 1600;
        var _timer;
        var _timers = [];

        var BEATS = [
          {
            turnId: 'rp-turn-0',
            textId: 'rp-text-0',
            insightId: 'rp-insight-upsell',
            words: ["Was", "there", "anything", "else", "you", "wanted", "to", "add", "to", "your", "plan?"]
          },
          {
            turnId: 'rp-turn-1',
            textId: 'rp-text-1',
            insightId: 'rp-insight-objection',
            words: ["Your", "price", "is", "too", "high", "compared", "to", "what", "we", "pay", "today."],
            highlightWords: { 1: true, 4: true },
            selectId: 'rp-suggest-roi'
          }
        ];

        function wait(ms) {
          return new Promise(function(resolve) {
            var id = setTimeout(resolve, ms);
            _timers.push(id);
          });
        }

        function clearAllTimers() {
          _timers.forEach(clearTimeout);
          _timers = [];
          clearTimeout(_timer);
        }

        function resetLoop() {
          clearAllTimers();
          rpRoot.classList.remove('is-blurred');
          document.querySelectorAll('.rp[data-rp-mode="insights"] .rp-turn').forEach(function(el) {
            el.classList.remove('is-active', 'is-dimmed', 'is-settled');
          });
          document.querySelectorAll('.rp[data-rp-mode="insights"] .rp-insight').forEach(function(el) {
            el.classList.remove('is-visible');
          });
          document.querySelectorAll('.rp-insight-item.is-selected').forEach(function(el) {
            el.classList.remove('is-selected');
          });
          BEATS.forEach(function(b) {
            var el = document.getElementById(b.textId);
            if (el) el.innerHTML = '';
          });
        }

        function typeWords(beat) {
          return new Promise(function(resolve) {
            var textEl = document.getElementById(beat.textId);
            if (!textEl) { resolve(); return; }
            textEl.innerHTML = '';
            var wi = 0;

            function nextWord() {
              if (wi >= beat.words.length) { resolve(); return; }
              var span = document.createElement('span');
              if (beat.highlightWords && beat.highlightWords[wi]) span.className = 'rp-word-trigger';
              span.textContent = (wi > 0 ? ' ' : '') + beat.words[wi];
              textEl.appendChild(span);
              wi++;
              _timer = setTimeout(nextWord, WORD_MS);
              _timers.push(_timer);
            }
            nextWord();
          });
        }

        function runBeat(beat, isFirst, isLast) {
          return new Promise(function(resolve) {
            var turnEl = document.getElementById(beat.turnId);
            var insightEl = document.getElementById(beat.insightId);
            if (!turnEl || !insightEl) { resolve(); return; }

            wait(isFirst ? 0 : BEAT_GAP).then(function() {
              turnEl.classList.add('is-active');
              return typeWords(beat);
            }).then(function() {
              return wait(PRE_INSIGHT);
            }).then(function() {
              rpRoot.classList.add('is-blurred');
              turnEl.classList.add('is-dimmed');
              insightEl.classList.add('is-visible');
              if (beat.selectId) {
                var selId = setTimeout(function() {
                  var item = document.getElementById(beat.selectId);
                  if (item) item.classList.add('is-selected');
                }, 400);
                _timers.push(selId);
              }
              return wait(isLast ? FINAL_HOLD : INSIGHT_HOLD);
            }).then(function() {
              rpRoot.classList.remove('is-blurred');
              turnEl.classList.remove('is-dimmed');
              turnEl.classList.remove('is-active');
              turnEl.classList.add('is-settled');
            }).then(resolve);
          });
        }

        function runLoop() {
          resetLoop();
          var chain = Promise.resolve();
          BEATS.forEach(function(beat, i) {
            chain = chain.then(function() {
              return runBeat(beat, i === 0, i === BEATS.length - 1);
            });
          });
          chain.then(function() {
            return wait(LOOP_PAUSE);
          }).then(function() {
            runLoop();
          });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', runLoop);
        } else {
          runLoop();
        }
      }
    })();

    // TOC Toggle (mobile)
    (function() {
      var toc = document.querySelector('.article-toc');
      var toggle = document.querySelector('.article-toc-toggle');
      if (!toc || !toggle) return;
      toggle.addEventListener('click', function() {
        toc.classList.toggle('is-open');
      });
    })();

    // FAQ Accordion (zenith-v2 module)
    (function() {
      document.querySelectorAll('.faq-item').forEach(function(item) {
        var btn = item.querySelector('.faq-question');
        var answer = item.querySelector('.faq-answer');
        if (!btn || !answer) return;
        var answerId = answer.id || (answer.id = 'faq-answer-' + Math.random().toString(36).slice(2, 9));
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', answerId);
        answer.setAttribute('role', 'region');
        answer.setAttribute('aria-labelledby', btn.id || (btn.id = 'faq-question-' + Math.random().toString(36).slice(2, 9)));
        btn.addEventListener('click', function() {
          var isOpen = item.classList.contains('is-open');
          document.querySelectorAll('.faq-item').forEach(function(i) {
            i.classList.remove('is-open');
            var q = i.querySelector('.faq-question');
            var a = i.querySelector('.faq-answer');
            if (q) q.setAttribute('aria-expanded', 'false');
            if (a) a.style.maxHeight = null;
          });
          if (!isOpen) {
            item.classList.add('is-open');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
    })();
  