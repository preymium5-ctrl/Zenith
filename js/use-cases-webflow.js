(function () {
  'use strict';

  var main = document.querySelector('main.uc-main');
  if (!main) return;

  var slug = window.location.pathname.replace(/\/$/, '').split('/').pop() || 'use-case';

  main.querySelectorAll('.form_wrapper').forEach(function (form) {
    var wrapper = form.closest('.w-form');
    if (!wrapper) return;

    var done = wrapper.querySelector('.w-form-done');
    var fail = wrapper.querySelector('.w-form-fail');
    var source = form.querySelector('[name="SourceInput"]');
    if (source) source.value = slug;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fail) fail.style.display = 'none';

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var submit = form.querySelector('[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.value = submit.getAttribute('data-wait') || 'Loading...';
      }

      form.style.display = 'none';
      if (done) done.style.display = 'block';
    });
  });

  main.querySelectorAll('.w-tabs').forEach(function (tabs) {
    var menu = tabs.querySelector('.w-tab-menu');
    var content = tabs.querySelector('.w-tab-content');
    if (!menu || !content) return;

    menu.querySelectorAll('.w-tab-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var tabId = link.getAttribute('data-w-tab');
        if (!tabId) return;

        menu.querySelectorAll('.w-tab-link').forEach(function (l) {
          l.classList.remove('w--current');
        });
        content.querySelectorAll('.w-tab-pane').forEach(function (p) {
          p.classList.remove('w--tab-active');
        });

        link.classList.add('w--current');
        var pane = content.querySelector('[data-w-tab="' + tabId + '"]');
        if (pane) pane.classList.add('w--tab-active');
      });
    });
  });

  if (window.hljs) {
    main.querySelectorAll('pre code').forEach(function (block) {
      window.hljs.highlightElement(block);
    });
  }
})();
