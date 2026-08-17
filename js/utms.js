/**
 * Persist UTM params from URL and prefill HubSpot hidden fields.
 */
(function () {
  var params = new URLSearchParams(window.location.search);
  var utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

  var utms = {};
  var hasUtms = false;

  utmParams.forEach(function (param) {
    var value = params.get(param);
    if (value) {
      utms[param] = value;
      hasUtms = true;
    }
  });

  if (hasUtms) {
    var cookieValue = encodeURIComponent(JSON.stringify(utms));
    var expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    document.cookie =
      'zenith_utms=' +
      cookieValue +
      '; domain=.zenith.io; path=/; expires=' +
      expiryDate.toUTCString() +
      '; SameSite=Lax; Secure';
  }
})();

function fillUtmFieldsFromCookie() {
  var cookie = document.cookie.split('; ').find(function (row) {
    return row.startsWith('zenith_utms=');
  });
  if (!cookie) return;

  try {
    var utms = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
    var map = {
      utm_source: 'UTMSource',
      utm_medium: 'UTMMedium',
      utm_campaign: 'UTMCampaign',
      utm_content: 'UTMContent',
      utm_term: 'UTMTerm',
    };

    Object.keys(map).forEach(function (key) {
      if (utms[key]) {
        document.querySelectorAll('input[name="' + map[key] + '"]').forEach(function (el) {
          el.value = utms[key];
        });
      }
    });
  } catch (e) {}
}

function initUtmFieldFill() {
  fillUtmFieldsFromCookie();

  if (!('MutationObserver' in window) || !document.body) return;

  var fillTimer;
  var observer = new MutationObserver(function () {
    clearTimeout(fillTimer);
    fillTimer = setTimeout(fillUtmFieldsFromCookie, 100);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUtmFieldFill);
} else {
  initUtmFieldFill();
}
