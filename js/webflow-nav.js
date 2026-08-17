// Webflow nav injection — prod (zenith.io) + Vercel preview (*.vercel.app)
// Fetches .navbars HTML via /api/zenith-nav proxy, injects into Shadow DOM
// Shadow DOM isolates Webflow CSS from the page design system
// Add ?wf-nav=1 to force-enable anywhere (e.g. localhost without changing hostname rules)

(function () {
  const host = window.location.hostname;
  const isProduction = host === 'zenith.io' || host === 'www.zenith.io' || host === 'zenith.io' || host === 'www.zenith.io';
  const isVercelPreview = /\.vercel\.app$/i.test(host);
  const isTestMode = new URLSearchParams(window.location.search).get('wf-nav') === '1';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE_MQ = '(max-width: 991px)';
  // Enabled locally for identical header mirroring


  const WF_NAV_HOST_CLOSED = 'position:fixed;top:0;left:0;right:0;z-index:9999;pointer-events:auto;';
  const WF_NAV_HOST_OPEN = 'position:fixed;inset:0;z-index:9999;pointer-events:auto;';

  const WF_MOBILE_CSS = `
.mobile_menu {
  transition: left 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.mobile_menu.wf-mobile-menu-open {
  left: 0 !important;
}
.lottie_icon-menu {
  -webkit-tap-highlight-color: transparent;
}
.lottie_icon-menu.wf-mobile-menu-open .icon_open-menu {
  opacity: 0;
}
.lottie_icon-menu.wf-mobile-menu-open .icon_close-menu {
  opacity: 1;
}
.mobile_collapsible-label {
  -webkit-tap-highlight-color: transparent;
}
.mobile_collapsible-items {
  overflow: hidden;
  transition: max-height 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}
.mobile_collapsible-items.wf-collapsed {
  max-height: 0 !important;
  opacity: 0;
  pointer-events: none;
}
.mobile_collapsible-items:not(.wf-collapsed) {
  max-height: 1200px;
  opacity: 1;
}
.mobile_collapsible-menu.wf-expanded .mobile_chevron-icon {
  transform: rotate(180deg);
}
.mobile_chevron-icon {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}
/* Intentionally dead nav entries (Documentation / Integration / Discord):
   no href, no hover affordance, no click target. */
a[data-noclick],
a:not([href]).dropdown_item,
a:not([href]).mobile_menu-item {
  cursor: default !important;
  pointer-events: none !important;
}
`;

  let dompurifyPromise;

  function ensureDOMPurify() {
    if (typeof DOMPurify !== 'undefined') return Promise.resolve();
    if (!dompurifyPromise) {
      dompurifyPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/js/vendor/dompurify.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('DOMPurify failed to load'));
        document.head.appendChild(script);
      });
    }
    return dompurifyPromise;
  }

  function hideNbBar() {
    const staticNavs = document.querySelectorAll('.nb-bar, .site-nav, [data-nav-shell], header.site-nav, nav.navbar');
    staticNavs.forEach((el) => {
      el.style.setProperty('display', 'none', 'important');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideNbBar);
  } else {
    hideNbBar();
  }

  function initDesktopDropdowns(shadow) {
    shadow.querySelectorAll('.w-dropdown').forEach((dropdown) => {
      const toggle = dropdown.querySelector('.w-dropdown-toggle');
      const list = dropdown.querySelector('.w-dropdown-list');
      if (!toggle || !list) return;

      let closeTimer;

      dropdown.addEventListener('mouseenter', () => {
        clearTimeout(closeTimer);
        list.classList.add('w--open');
        toggle.classList.add('w--open');
        toggle.setAttribute('aria-expanded', 'true');
        if (!prefersReducedMotion) {
          list.animate(
            [
              { opacity: 0, transform: 'translateY(-8px)' },
              { opacity: 1, transform: 'translateY(0)' },
            ],
            {
              duration: 180,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }
          );
        }
      });

      dropdown.addEventListener('mouseleave', () => {
        closeTimer = setTimeout(() => {
          list.classList.remove('w--open');
          toggle.classList.remove('w--open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 100);
      });
    });
  }

  function initMobileMenu(shadow, navHost) {
    const menuToggle = shadow.querySelector('.lottie_icon-menu');
    const mobileMenu = shadow.querySelector('.mobile_menu');
    if (!menuToggle || !mobileMenu) return;

    const mobileQuery = window.matchMedia(MOBILE_MQ);
    let isOpen = false;
    let savedBodyOverflow = '';

    function setOpen(open) {
      isOpen = open;
      mobileMenu.classList.toggle('wf-mobile-menu-open', open);
      menuToggle.classList.toggle('wf-mobile-menu-open', open);
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      navHost.style.cssText = open ? WF_NAV_HOST_OPEN : WF_NAV_HOST_CLOSED;

      if (open) {
        savedBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = savedBodyOverflow;
      }

      mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    menuToggle.setAttribute('role', 'button');
    menuToggle.setAttribute('tabindex', '0');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    menuToggle.setAttribute('aria-controls', 'wf-mobile-menu');

    if (!mobileMenu.id) mobileMenu.id = 'wf-mobile-menu';
    mobileMenu.setAttribute('aria-hidden', 'true');

    function toggleMenu() {
      if (!mobileQuery.matches) return;
      setOpen(!isOpen);
    }

    menuToggle.addEventListener('click', toggleMenu);
    menuToggle.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggleMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen) setOpen(false);
    });

    mobileMenu.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', () => {
        if (!isOpen) return;
        setOpen(false);
      });
    });

    mobileQuery.addEventListener('change', () => {
      if (!mobileQuery.matches && isOpen) setOpen(false);
    });
  }

  function initMobileCollapsibles(shadow) {
    shadow.querySelectorAll('.mobile_collapsible-menu').forEach((menu) => {
      const label = menu.querySelector('.mobile_collapsible-label');
      const items = menu.querySelectorAll('.mobile_collapsible-items');
      if (!label || !items.length) return;

      items.forEach((item) => item.classList.add('wf-collapsed'));

      label.setAttribute('role', 'button');
      label.setAttribute('tabindex', '0');
      label.setAttribute('aria-expanded', 'false');

      function toggleSection() {
        const expanded = menu.classList.toggle('wf-expanded');
        label.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        items.forEach((item) => item.classList.toggle('wf-collapsed', !expanded));
      }

      label.addEventListener('click', toggleSection);
      label.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleSection();
      });
    });
  }

  async function loadWebflowNav() {
    try {
      await ensureDOMPurify();
      console.log('[webflow-nav] fetching /api/zenith-nav.json...');
      const res = await fetch('/api/zenith-nav.json');
      if (!res.ok) { console.warn('[webflow-nav] API error:', res.status); return; }
      const { html, css = '', error } = await res.json();
      if (error) { console.warn('[webflow-nav] API returned error:', error); return; }
      if (!html) { console.warn('[webflow-nav] No HTML returned'); return; }
      console.log('[webflow-nav] nav HTML received, css:', css.length, 'chars');

      const navHost = document.createElement('div');
      navHost.id = 'wf-nav-host';
      navHost.style.cssText = WF_NAV_HOST_CLOSED;
      document.body.prepend(navHost);
      hideNbBar();

      const shadow = navHost.attachShadow({ mode: 'open' });

      const shadowCss = css.replace(/:root\b/g, ':host');
      const safeHtml = DOMPurify.sanitize(html, {
        FORCE_BODY: true,
        ADD_ATTR: ['style', 'class', 'href', 'target', 'rel', 'src', 'alt', 'aria-expanded', 'aria-label', 'data-wf-page', 'data-wf-site', 'data-w-id', 'loading', 'id', 'aria-hidden', 'aria-controls', 'role', 'tabindex'],
      });

      const styleEl = document.createElement('style');
      styleEl.textContent = shadowCss;
      shadow.appendChild(styleEl);

      const mobileStyleEl = document.createElement('style');
      mobileStyleEl.textContent = WF_MOBILE_CSS;
      shadow.appendChild(mobileStyleEl);

      if (!prefersReducedMotion) {
        const motionStyleEl = document.createElement('style');
        motionStyleEl.textContent = '@keyframes wf-nav-fade-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}';
        shadow.appendChild(motionStyleEl);
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(safeHtml, 'text/html');
      doc.querySelectorAll('.navbar_shadow-dark').forEach((el) => el.remove());
      const frag = document.createDocumentFragment();
      Array.from(doc.body.childNodes).forEach((n) => frag.appendChild(document.importNode(n, true)));
      shadow.appendChild(frag);

      if (!prefersReducedMotion) {
        const navRoot = shadow.querySelector('.navbars');
        if (navRoot) navRoot.style.animation = 'wf-nav-fade-in 280ms cubic-bezier(0.16, 1, 0.3, 1) both';
      }
      console.log('[webflow-nav] Shadow DOM injected');

      let navInteractionsReady = false;

      function initNavInteractions() {
        if (navInteractionsReady) return;
        navInteractionsReady = true;
        initDesktopDropdowns(shadow);
        initMobileMenu(shadow, navHost);
        initMobileCollapsibles(shadow);
        interceptNavLinks(shadow);
      }

      const links = shadow.querySelectorAll('link[rel="stylesheet"]');
      let loaded = 0;
      if (links.length === 0) {
        initNavInteractions();
      } else {
        links.forEach((link) => {
          link.addEventListener('load', () => { if (++loaded === links.length) initNavInteractions(); });
          link.addEventListener('error', () => { if (++loaded === links.length) initNavInteractions(); });
        });
      }
    } catch (e) {
      console.warn('[webflow-nav] Failed to load:', e.message);
    }
  }

  function scheduleLoadWebflowNav() {
    const run = () => { loadWebflowNav(); };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(run, { timeout: 2000 });
    } else {
      setTimeout(run, 0);
    }
  }

  function showDemoToast(message) {
    let container = document.getElementById('demo-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'demo-toast-container';
      container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:999999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'demo-toast';
    toast.textContent = message;
    toast.style.cssText = 'background:rgba(18,18,24,0.85);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.08);color:#fff;padding:12px 24px;border-radius:10px;font-family:Suisseintl,sans-serif;font-size:14px;box-shadow:0 12px 24px rgba(0,0,0,0.5);transform:translateY(-20px);opacity:0;transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);pointer-events:auto;';
    container.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(function () {
      toast.style.transform = 'translateY(-20px)';
      toast.style.opacity = '0';
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3500);
  }

    function interceptNavLinks(shadowRoot) {
    const anchors = shadowRoot.querySelectorAll('a');
    anchors.forEach(function (a) {
      let href = a.getAttribute('href') || '';
      let text = (a.textContent || '').trim();

      // Check if this is Documentation, Integration, or Discord
      if (
        text.includes('Documentation') ||
        text.includes('Integration') ||
        text.includes('Discord') ||
        href.includes('docs.zenith.io') ||
        href.includes('docs.gladia.io') ||
        href.includes('discord.')
      ) {
        // Drop the href entirely: an <a> with no href is not a link at all —
        // no navigation, no pointer cursor, no focus stop, no "open in new tab".
        a.removeAttribute('href');
        a.removeAttribute('onclick');
        a.removeAttribute('target');
        a.setAttribute('data-noclick', '1');
        a.setAttribute('aria-disabled', 'true');
        a.style.cursor = 'default';
        a.style.pointerEvents = 'none';
        a.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }, true);
        return;
      }

      // Clean up other absolute links
      if (href.startsWith('https://www.zenith.io/')) {
        href = href.replace('https://www.zenith.io/', '/');
      } else if (href.startsWith('https://www.zenith.io')) {
        href = '/';
      } else if (href.startsWith('https://zenith.io/')) {
        href = href.replace('https://zenith.io/', '/');
      } else if (href.startsWith('https://zenith.io')) {
        href = '/';
      } else if (href.startsWith('https://app.zenith.io/')) {
        href = href.replace('https://app.zenith.io/', '/app/');
      } else if (href.startsWith('https://app.zenith.io')) {
        href = '/app';
      } else if (href.startsWith('https://status.zenith.io/')) {
        href = href.replace('https://status.zenith.io/', '/status/');
      } else if (href.startsWith('https://status.zenith.io')) {
        href = '/status';
      }

      // Anything sanitized down to no href (or an unsafe href) stays inert
      if (!href) {
        a.removeAttribute('href');
        a.setAttribute('data-noclick', '1');
        return;
      }

      a.setAttribute('href', href);
    });
  }

  window.interceptNavLinks = interceptNavLinks;
  window.showDemoToast = showDemoToast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleLoadWebflowNav);
  } else {
    scheduleLoadWebflowNav();
  }
})();