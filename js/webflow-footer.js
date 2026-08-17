// Webflow footer injection — prod + Vercel preview + localhost + ?wf-nav=1
// Fetches .section_footer via /api/zenith-footer, injects into Shadow DOM (loads immediately).

(function () {
  const host = window.location.hostname;
  const isProduction = host === 'zenith.io' || host === 'www.zenith.io';
  const isVercelPreview = /\.vercel\.app$/i.test(host);
  const isLocalDev = host === 'localhost' || host === '127.0.0.1';
  const isTestMode = new URLSearchParams(window.location.search).get('wf-nav') === '1';
  if (!isProduction && !isVercelPreview && !isLocalDev && !isTestMode) return;

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

  function showBuiltinFooter() {
    const footer = document.querySelector('footer.footer');
    if (footer) footer.style.display = '';
  }

  function hideBuiltinFooter() {
    const footer = document.querySelector('footer.footer');
    if (footer) footer.style.display = 'none';
  }

  async function loadWebflowFooter() {
    try {
      await ensureDOMPurify();
      console.log('[webflow-footer] fetching /api/zenith-footer.json...');
      const res = await fetch('/api/zenith-footer.json');
      if (!res.ok) {
        console.warn('[webflow-footer] API error:', res.status);
        showBuiltinFooter();
        return;
      }
      const { html, css = '', error } = await res.json();
      if (error) {
        console.warn('[webflow-footer] API returned error:', error);
        showBuiltinFooter();
        return;
      }
      if (!html) {
        console.warn('[webflow-footer] No HTML returned');
        showBuiltinFooter();
        return;
      }
      console.log('[webflow-footer] footer HTML received, css:', css.length, 'chars');

      hideBuiltinFooter();

      const hostEl = document.createElement('div');
      hostEl.id = 'wf-footer-host';
      hostEl.style.cssText = 'display:block;width:100%;position:relative;z-index:2;';

      const builtinFooter = document.querySelector('footer.footer');
      if (builtinFooter && builtinFooter.parentNode) {
        builtinFooter.parentNode.insertBefore(hostEl, builtinFooter.nextSibling);
      } else {
        document.body.appendChild(hostEl);
      }

      const shadow = hostEl.attachShadow({ mode: 'open' });

      const shadowCss = css.replace(/:root\b/g, ':host');
      const safeHtml = DOMPurify.sanitize(html, {
        FORCE_BODY: true,
        ADD_ATTR: ['style', 'class', 'href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'loading'],
      });
      const styleEl = document.createElement('style');
      styleEl.textContent = shadowCss;
      shadow.appendChild(styleEl);
      const parser = new DOMParser();
      const doc = parser.parseFromString(safeHtml, 'text/html');
      const frag = document.createDocumentFragment();
      Array.from(doc.body.childNodes).forEach((n) => frag.appendChild(document.importNode(n, true)));
      shadow.appendChild(frag);
      console.log('[webflow-footer] Shadow DOM injected');
      if (typeof window.interceptNavLinks === 'function') {
        window.interceptNavLinks(shadow);
      }
    } catch (e) {
      console.warn('[webflow-footer] Failed to load:', e.message);
      showBuiltinFooter();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWebflowFooter);
  } else {
    loadWebflowFooter();
  }
})();