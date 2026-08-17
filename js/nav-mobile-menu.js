/**
 * Mobile nav — builds accordion from mega-menu panels so desktop/mobile stay in sync.
 * Breakpoint: max-width 991px (aligned with former Webflow mobile MQ).
 */
(function () {
  'use strict';

  var MOBILE_MQ = '(max-width: 991px)';
  var toggle = document.getElementById('navbarMenuToggle');
  var mobileNav = document.getElementById('mobileNav');
  var list = document.getElementById('mobileNavList');
  var mega = document.getElementById('megaMenu');
  var siteNav = document.querySelector('[data-nav-shell]');

  if (!toggle || !mobileNav || !list || !mega) return;

  var mobileQuery = window.matchMedia(MOBILE_MQ);
  var isOpen = false;
  var savedOverflow = '';
  var built = false;

  function labelForPanel(panel) {
    return panel.getAttribute('aria-label') || panel.dataset.panel || 'Menu';
  }

  function itemMarkup(link) {
    var titleEl = link.querySelector('.mega-menu-item-title');
    var iconEl = link.querySelector('.mega-menu-item-icon');
    if (!titleEl) return '';

    var href = link.getAttribute('href') || '#';
    var title = titleEl.textContent.trim();
    var target = link.getAttribute('target');
    var rel = link.getAttribute('rel');
    var attrs = '';
    if (target) attrs += ' target="' + target + '"';
    if (rel) attrs += ' rel="' + rel + '"';

    var iconHtml = iconEl ? iconEl.outerHTML : '';

    return (
      '<a href="' + href + '" class="mobile-nav-link"' + attrs + '>' +
        iconHtml +
        '<span class="mobile-nav-link-title">' + title + '</span>' +
      '</a>'
    );
  }

  function spotlightMarkup(panel) {
    var spot = panel.querySelector('.mega-menu-spotlight-link');
    if (!spot) return '';

    var titleEl = spot.querySelector('.mega-menu-spotlight-title');
    var descEl = spot.querySelector('.mega-menu-spotlight-desc');
    var tagEl = panel.querySelector('.mega-menu-spotlight-tag');
    if (!titleEl) return '';

    var href = spot.getAttribute('href') || '#';
    var target = spot.getAttribute('target');
    var rel = spot.getAttribute('rel');
    var attrs = '';
    if (target) attrs += ' target="' + target + '"';
    if (rel) attrs += ' rel="' + rel + '"';

    var tag = tagEl ? '<span class="mobile-nav-featured-tag">' + tagEl.textContent.trim() + '</span>' : '';
    var desc = descEl
      ? '<span class="mobile-nav-featured-desc">' + descEl.textContent.trim() + '</span>'
      : '';

    return (
      '<a href="' + href + '" class="mobile-nav-featured"' + attrs + '>' +
        tag +
        '<span class="mobile-nav-featured-title">' + titleEl.textContent.trim() + '</span>' +
        desc +
      '</a>'
    );
  }

  function sectionMarkup(panel, openByDefault) {
    var id = 'mobile-section-' + panel.dataset.panel;
    var label = labelForPanel(panel);
    var links = Array.prototype.slice.call(panel.querySelectorAll('.mega-menu-item'));
    var items = links.map(itemMarkup).filter(Boolean).join('');
    if (!items) return '';

    var featured = spotlightMarkup(panel);
    var expanded = openByDefault ? 'true' : 'false';
    var openClass = openByDefault ? ' is-open' : '';

    return (
      '<div class="mobile-nav-section' + openClass + '" data-section="' + panel.dataset.panel + '">' +
        '<button type="button" class="mobile-nav-section-toggle" aria-expanded="' + expanded + '" aria-controls="' + id + '">' +
          '<span>' + label + '</span>' +
          '<svg class="mobile-nav-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
            '<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</button>' +
        '<div class="mobile-nav-section-body" id="' + id + '" role="region">' +
          '<div class="mobile-nav-section-inner">' +
            items +
            featured +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function pricingMarkup() {
    return (
      '<a href="/pricing" class="mobile-nav-top-link">' +
        '<span>Pricing</span>' +
      '</a>'
    );
  }

  function build() {
    var panels = Array.prototype.slice.call(mega.querySelectorAll('.mega-menu-panel'));
    var order = ['product', 'solutions', 'developers', 'resources', 'company'];
    var byName = {};
    panels.forEach(function (p) {
      byName[p.dataset.panel] = p;
    });

    var html = '';
    order.forEach(function (name, index) {
      var panel = byName[name];
      if (!panel) return;
      html += sectionMarkup(panel, index === 0);
      if (name === 'solutions') html += pricingMarkup();
    });

    list.innerHTML = html;
    built = true;
  }

  function setOpen(open) {
    if (open && !built) build();

    isOpen = open;
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('mobile-nav-open', open);
    if (siteNav) siteNav.classList.toggle('is-mobile-open', open);

    if (open) {
      savedOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = savedOverflow;
      toggle.focus();
    }
  }

  function closeIfOpen() {
    if (isOpen) setOpen(false);
  }

  toggle.addEventListener('click', function () {
    if (!mobileQuery.matches) return;
    setOpen(!isOpen);
  });

  mobileNav.addEventListener('click', function (e) {
    if (e.target.closest('[data-mobile-nav-close]')) {
      setOpen(false);
      return;
    }

    var sectionBtn = e.target.closest('.mobile-nav-section-toggle');
    if (sectionBtn) {
      var section = sectionBtn.closest('.mobile-nav-section');
      if (!section) return;

      var willOpen = !section.classList.contains('is-open');

      // Accordion: one section open at a time for clearer scan on small screens
      list.querySelectorAll('.mobile-nav-section.is-open').forEach(function (openSection) {
        if (openSection === section) return;
        openSection.classList.remove('is-open');
        var otherBtn = openSection.querySelector('.mobile-nav-section-toggle');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      section.classList.toggle('is-open', willOpen);
      sectionBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      return;
    }

    var link = e.target.closest('a[href]');
    if (link && mobileNav.contains(link)) {
      // Let navigation proceed; close sheet for in-page feel
      setOpen(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      setOpen(false);
    }
  });

  function onMqChange() {
    if (!mobileQuery.matches) closeIfOpen();
  }

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener('change', onMqChange);
  } else if (mobileQuery.addListener) {
    mobileQuery.addListener(onMqChange);
  }

  // Prefetch structure so first open is instant
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (mobileQuery.matches) build();
    });
  } else if (mobileQuery.matches) {
    build();
  }
})();
