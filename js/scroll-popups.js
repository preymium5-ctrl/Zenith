(function () {
  // Prevent duplicate execution
  if (window.__zenithScrollPopupsInitialized) return;
  window.__zenithScrollPopupsInitialized = true;

  // Determine current page route
  const path = window.location.pathname.toLowerCase();
  
  // Decide which popup to show based on URL path
  const isContentPage = path.includes('/blog') || path.includes('/content/') || path.includes('/library');
  const isProductOrHome = path === '/' || path === '' || path.includes('/product/') || path.includes('/solaria') || path.includes('/pricing');

  if (isContentPage) {
    createBuyersGuidePopup();
  } else if (isProductOrHome) {
    createSolariaBottomBar();
  }

  // --- Buyer's Guide Popup (Bottom-Right) ---
  function createBuyersGuidePopup() {
    if (sessionStorage.getItem('zenith_hide_buyers_guide') === 'true') return;

    const popupHtml = `
      <div id="buyers-guide-popup" class="zenith-popup-card hide-popup">
        <div class="popup-left-grid">
          <div class="grid-pattern"></div>
          <img src="/images/Buyers_Guide_Cover.avif" alt="Buyer's Guide Cover" class="book-cover-img" />
        </div>
        <div class="popup-right-content">
          <button id="close-buyers-guide" class="popup-close-btn" aria-label="Close popup">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="#121212" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
          <h4 class="popup-title">Buyer's Guide to Speech-to-Text APIs</h4>
          <ul class="popup-bullet-list">
            <li>Key evaluation criteria</li>
            <li>Must-ask vendor questions</li>
            <li>Industry insights</li>
          </ul>
          <a href="/content/evaluating-speech-to-text-vendors-buyers-guide" class="popup-action-btn-purple">Get your copy</a>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .zenith-popup-card {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 480px;
        height: 230px;
        background: #ffffff;
        border-radius: 16px;
        box-shadow: 0px 12px 36px rgba(0, 0, 0, 0.16);
        border: 1px solid rgba(0, 0, 0, 0.06);
        display: flex;
        overflow: hidden;
        z-index: 999999;
        font-family: 'SuisseIntl', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      }
      .zenith-popup-card.hide-popup {
        transform: translateY(120%) scale(0.9);
        opacity: 0;
        pointer-events: none;
      }
      .popup-left-grid {
        width: 38%;
        background: #09090b;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .grid-pattern {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 15px 15px;
        opacity: 0.8;
      }
      .grid-pattern::after {
        content: '';
        position: absolute;
        width: 120px;
        height: 120px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        top: 20px;
        left: -20px;
      }
      .book-cover-img {
        width: 100px;
        height: auto;
        border-radius: 4px;
        box-shadow: 0px 8px 24px rgba(0,0,0,0.4);
        transform: rotate(-6deg) translateY(8px);
        transition: transform 0.3s ease;
        z-index: 2;
      }
      .zenith-popup-card:hover .book-cover-img {
        transform: rotate(-3deg) translateY(2px) scale(1.05);
      }
      .popup-right-content {
        width: 62%;
        padding: 24px;
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .popup-close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .popup-close-btn:hover {
        opacity: 1;
        transform: rotate(90deg);
      }
      .popup-title {
        margin: 0 0 10px 0;
        font-size: 19px;
        line-height: 24px;
        font-weight: 700;
        color: #09090b;
        padding-right: 16px;
      }
      .popup-bullet-list {
        margin: 0 0 16px 0;
        padding-left: 16px;
        font-size: 14px;
        line-height: 20px;
        color: #52525b;
      }
      .popup-bullet-list li {
        margin-bottom: 4px;
      }
      .popup-action-btn-purple {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #8257e5;
        color: #ffffff !important;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none !important;
        padding: 10px 20px;
        border-radius: 30px;
        text-align: center;
        transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0px 4px 12px rgba(130, 87, 229, 0.25);
      }
      .popup-action-btn-purple:hover {
        background: #6f42c1;
        transform: translateY(-1px);
        box-shadow: 0px 6px 16px rgba(130, 87, 229, 0.4);
      }
      
      @media screen and (max-width: 520px) {
        .zenith-popup-card {
          width: calc(100% - 32px);
          left: 16px;
          right: 16px;
          bottom: 16px;
          height: auto;
          flex-direction: column;
        }
        .popup-left-grid {
          width: 100%;
          height: 100px;
        }
        .book-cover-img {
          width: 70px;
          transform: rotate(-4deg) translateY(12px);
        }
        .popup-right-content {
          width: 100%;
          padding: 16px;
        }
      }
    `;

    document.head.appendChild(style);
    
    // Inject elements into DOM wrapper
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = popupHtml;
    const popupEl = tempDiv.firstElementChild;
    document.body.appendChild(popupEl);

    // Setup scroll trigger helper
    let popupTriggered = false;
    const scrollListener = function () {
      if (popupTriggered) return;
      const scrollPos = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Trigger when scrolled > 25% or 300px
      if (scrollPos > 300 || (docHeight > 0 && (scrollPos / docHeight) > 0.25)) {
        popupEl.classList.remove('hide-popup');
        popupTriggered = true;
        window.removeEventListener('scroll', scrollListener);
      }
    };
    window.addEventListener('scroll', scrollListener);

    // Setup close triggers
    document.getElementById('close-buyers-guide').addEventListener('click', function () {
      popupEl.classList.add('hide-popup');
      sessionStorage.setItem('zenith_hide_buyers_guide', 'true');
    });
  }

  // --- Solaria-3 Bottom Bar ---
  function createSolariaBottomBar() {
    if (sessionStorage.getItem('zenith_hide_solaria_bar') === 'true') return;

    const barHtml = `
      <div id="solaria-bottom-bar" class="zenith-bottom-bar hide-bar">
        <div class="bar-container">
          <div class="bar-left-info">
            <span class="solaria-badge">Solaria-3</span>
            <p class="solaria-desc">9.6% WER on real English audio · strongest gains across EN, FR, DE, ES & IT</p>
          </div>
          <div class="bar-right-actions">
            <a href="/solaria-3" class="bar-action-btn">Try it now <span class="arrow">&rarr;</span></a>
            <button id="close-solaria-bar" class="bar-close-btn" aria-label="Close banner">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L11 11M1 11L11 1" stroke="#a1a1aa" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .zenith-bottom-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        background: rgba(13, 11, 10, 0.88);
        border-top: 1px solid rgba(255, 107, 0, 0.45);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 999999;
        font-family: 'SuisseIntl', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0px -8px 32px rgba(0, 0, 0, 0.5);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
      }
      .zenith-bottom-bar.hide-bar {
        transform: translateY(100%);
        opacity: 0;
        pointer-events: none;
      }
      .bar-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bar-left-info {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .solaria-badge {
        background: linear-gradient(135deg, #ff6b00 0%, #ff8c3a 100%);
        color: #ffffff;
        font-weight: 700;
        font-size: 13px;
        padding: 4px 10px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .solaria-desc {
        margin: 0;
        color: #e4e4e7;
        font-size: 15px;
        font-weight: 500;
      }
      .bar-right-actions {
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .bar-action-btn {
        display: inline-flex;
        align-items: center;
        background: #ffffff;
        color: #0d0b0a !important;
        font-weight: 600;
        font-size: 14px;
        text-decoration: none !important;
        padding: 10px 20px;
        border-radius: 30px;
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .bar-action-btn:hover {
        background: #f4f4f5;
        transform: translateY(-1px);
      }
      .bar-action-btn .arrow {
        margin-left: 6px;
        font-size: 16px;
        transition: transform 0.2s ease;
      }
      .bar-action-btn:hover .arrow {
        transform: translateX(3px);
      }
      .bar-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      .bar-close-btn:hover {
        opacity: 1;
        transform: scale(1.1);
      }
      
      @media screen and (max-width: 768px) {
        .bar-container {
          flex-direction: column;
          gap: 12px;
          text-align: center;
          padding: 12px 16px;
        }
        .bar-left-info {
          flex-direction: column;
          gap: 6px;
        }
        .bar-right-actions {
          width: 100%;
          justify-content: center;
          gap: 16px;
        }
        .bar-action-btn {
          width: 80%;
          justify-content: center;
        }
      }
    `;

    document.head.appendChild(style);

    // Inject elements into DOM wrapper
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = barHtml;
    const barEl = tempDiv.firstElementChild;
    document.body.appendChild(barEl);

    // Setup scroll trigger helper
    let barTriggered = false;
    const scrollListener = function () {
      if (barTriggered) return;
      const scrollPos = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollPos > 300 || (docHeight > 0 && (scrollPos / docHeight) > 0.25)) {
        barEl.classList.remove('hide-bar');
        barTriggered = true;
        window.removeEventListener('scroll', scrollListener);
      }
    };
    window.addEventListener('scroll', scrollListener);

    // Setup close triggers
    document.getElementById('close-solaria-bar').addEventListener('click', function () {
      barEl.classList.add('hide-bar');
      sessionStorage.setItem('zenith_hide_solaria_bar', 'true');
    });
  }
})();
