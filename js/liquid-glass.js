/**
 * Liquid Glass — physics-based refraction for .benefit-float cards
 * Based on kube.io/blog/liquid-glass-css-svg (Snell's law + SVG displacement maps)
 * Chrome / Chromium only — falls back to CSS blur elsewhere
 */
(function () {
  'use strict';

  var CONFIG = {
    surfaceType: 'convex_squircle',
    glassThickness: 72,
    bezelRatio: 0.065,
    minBezel: 14,
    maxBezel: 28,
    refractiveIndex: 1.5,
    refractionScale: 1.25,
    specularOpacity: 0.32,
    specularBlendMode: 'screen',
    frostBlur: 7,
    cssBlur: '20px',
    cssSaturate: 1.85,
    specularAngle: Math.PI / 3,
    samples: 128,
  };

  var SURFACE_FNS = {
    convex_squircle: function (x) {
      return Math.pow(1 - Math.pow(1 - x, 4), 0.25);
    },
    convex_circle: function (x) {
      return Math.sqrt(1 - Math.pow(1 - x, 2));
    },
  };

  var instances = new WeakMap();
  var defsRoot = null;
  var supportsLiquid = null;

  function debounce(fn, wait) {
    var timeout;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn.apply(ctx, args);
      }, wait);
    };
  }

  function supportsSvgBackdropFilter() {
    if (supportsLiquid !== null) return supportsLiquid;
    if (!window.chrome) {
      supportsLiquid = false;
      return false;
    }
    var test = document.createElement('div');
    test.style.backdropFilter = 'url(#liquid-glass-support-test)';
    supportsLiquid = test.style.backdropFilter.indexOf('url') !== -1;
    return supportsLiquid;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function parseRadius(el) {
    var style = getComputedStyle(el);
    var radius = parseFloat(style.borderTopLeftRadius);
    if (Number.isNaN(radius)) return 24;
    return radius;
  }

  function calculateDisplacementMap1D(glassThickness, bezelWidth, surfaceFn, refractiveIndex, samples) {
    var eta = 1 / refractiveIndex;

    function refract(normalX, normalY) {
      var dot = normalY;
      var k = 1 - eta * eta * (1 - dot * dot);
      if (k < 0) return null;
      var kSqrt = Math.sqrt(k);
      return [
        -(eta * dot + kSqrt) * normalX,
        eta - (eta * dot + kSqrt) * normalY,
      ];
    }

    var result = [];
    for (var i = 0; i < samples; i++) {
      var x = i / samples;
      var y = surfaceFn(x);
      var dx = x < 1 ? 0.0001 : -0.0001;
      var y2 = surfaceFn(Math.max(0, Math.min(1, x + dx)));
      var derivative = (y2 - y) / dx;
      var magnitude = Math.sqrt(derivative * derivative + 1);
      var refracted = refract(-derivative / magnitude, -1 / magnitude);
      if (!refracted) {
        result.push(0);
      } else {
        var remainingHeight = y * bezelWidth + glassThickness;
        result.push(refracted[0] * (remainingHeight / refracted[1]));
      }
    }
    return result;
  }

  function calculateDisplacementMap2D(
    canvasWidth,
    canvasHeight,
    objectWidth,
    objectHeight,
    radius,
    bezelWidth,
    maximumDisplacement,
    precomputedMap
  ) {
    var imageData = new ImageData(canvasWidth, canvasHeight);
    for (var i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = 128;
      imageData.data[i + 1] = 128;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    }

    var radiusSquared = radius * radius;
    var radiusPlusOneSquared = (radius + 1) * (radius + 1);
    var radiusMinusBezelSquared = Math.max(0, (radius - bezelWidth) * (radius - bezelWidth));
    var widthBetweenRadiuses = objectWidth - radius * 2;
    var heightBetweenRadiuses = objectHeight - radius * 2;
    var objectX = (canvasWidth - objectWidth) / 2;
    var objectY = (canvasHeight - objectHeight) / 2;

    for (var y1 = 0; y1 < objectHeight; y1++) {
      for (var x1 = 0; x1 < objectWidth; x1++) {
        var idx = ((objectY + y1) * canvasWidth + objectX + x1) * 4;
        var isOnLeftSide = x1 < radius;
        var isOnRightSide = x1 >= objectWidth - radius;
        var isOnTopSide = y1 < radius;
        var isOnBottomSide = y1 >= objectHeight - radius;
        var x = isOnLeftSide ? x1 - radius : isOnRightSide ? x1 - radius - widthBetweenRadiuses : 0;
        var y = isOnTopSide ? y1 - radius : isOnBottomSide ? y1 - radius - heightBetweenRadiuses : 0;
        var distanceToCenterSquared = x * x + y * y;
        var isInBezel =
          distanceToCenterSquared <= radiusPlusOneSquared &&
          distanceToCenterSquared >= radiusMinusBezelSquared;

        if (!isInBezel) continue;

        var opacity =
          distanceToCenterSquared < radiusSquared
            ? 1
            : 1 -
              (Math.sqrt(distanceToCenterSquared) - Math.sqrt(radiusSquared)) /
                (Math.sqrt(radiusPlusOneSquared) - Math.sqrt(radiusSquared));
        var distanceFromCenter = Math.sqrt(distanceToCenterSquared);
        var distanceFromSide = radius - distanceFromCenter;
        var cos = distanceFromCenter > 0 ? x / distanceFromCenter : 0;
        var sin = distanceFromCenter > 0 ? y / distanceFromCenter : 0;
        var bezelRatio = Math.max(0, Math.min(1, distanceFromSide / bezelWidth));
        var bezelIndex = Math.floor(bezelRatio * precomputedMap.length);
        var distance =
          precomputedMap[Math.max(0, Math.min(bezelIndex, precomputedMap.length - 1))] || 0;
        var dX = maximumDisplacement > 0 ? (-cos * distance) / maximumDisplacement : 0;
        var dY = maximumDisplacement > 0 ? (-sin * distance) / maximumDisplacement : 0;

        imageData.data[idx] = Math.max(0, Math.min(255, 128 + dX * 127 * opacity));
        imageData.data[idx + 1] = Math.max(0, Math.min(255, 128 + dY * 127 * opacity));
      }
    }

    return imageData;
  }

  function calculateSpecularHighlight(objectWidth, objectHeight, radius, bezelWidth) {
    var imageData = new ImageData(objectWidth, objectHeight);
    var specularVector = [Math.cos(CONFIG.specularAngle), Math.sin(CONFIG.specularAngle)];
    var specularThickness = 1.5;
    var radiusSquared = radius * radius;
    var radiusPlusOneSquared = (radius + 1) * (radius + 1);
    var radiusMinusSpecularSquared = Math.max(0, (radius - specularThickness) * (radius - specularThickness));
    var widthBetweenRadiuses = objectWidth - radius * 2;
    var heightBetweenRadiuses = objectHeight - radius * 2;

    for (var y1 = 0; y1 < objectHeight; y1++) {
      for (var x1 = 0; x1 < objectWidth; x1++) {
        var idx = (y1 * objectWidth + x1) * 4;
        var isOnLeftSide = x1 < radius;
        var isOnRightSide = x1 >= objectWidth - radius;
        var isOnTopSide = y1 < radius;
        var isOnBottomSide = y1 >= objectHeight - radius;
        var x = isOnLeftSide ? x1 - radius : isOnRightSide ? x1 - radius - widthBetweenRadiuses : 0;
        var y = isOnTopSide ? y1 - radius : isOnBottomSide ? y1 - radius - heightBetweenRadiuses : 0;
        var distanceToCenterSquared = x * x + y * y;
        var isNearEdge =
          distanceToCenterSquared <= radiusPlusOneSquared &&
          distanceToCenterSquared >= radiusMinusSpecularSquared;

        if (!isNearEdge) continue;

        var distanceFromCenter = Math.sqrt(distanceToCenterSquared);
        var distanceFromSide = radius - distanceFromCenter;
        var opacity =
          distanceToCenterSquared < radiusSquared
            ? 1
            : 1 -
              (distanceFromCenter - Math.sqrt(radiusSquared)) /
                (Math.sqrt(radiusPlusOneSquared) - Math.sqrt(radiusSquared));
        var cos = distanceFromCenter > 0 ? x / distanceFromCenter : 0;
        var sin = distanceFromCenter > 0 ? -y / distanceFromCenter : 0;
        var dotProduct = Math.abs(cos * specularVector[0] + sin * specularVector[1]);
        var edgeRatio = Math.max(0, Math.min(1, distanceFromSide / specularThickness));
        var sharpFalloff = Math.sqrt(1 - (1 - edgeRatio) * (1 - edgeRatio));
        var coefficient = dotProduct * sharpFalloff;
        var color = Math.min(255, 255 * coefficient);
        var finalOpacity = Math.min(255, color * coefficient * opacity);

        imageData.data[idx] = color;
        imageData.data[idx + 1] = color;
        imageData.data[idx + 2] = color;
        imageData.data[idx + 3] = finalOpacity;
      }
    }

    return imageData;
  }

  function imageDataToDataURL(imageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  }

  function createFilterElement(id, width, height, radius) {
    var minDim = Math.min(width, height);
    var bezelWidth = Math.round(
      Math.max(CONFIG.minBezel, Math.min(CONFIG.maxBezel, minDim * CONFIG.bezelRatio))
    );
    var surfaceFn = SURFACE_FNS[CONFIG.surfaceType] || SURFACE_FNS.convex_squircle;
    var precomputed = calculateDisplacementMap1D(
      CONFIG.glassThickness,
      bezelWidth,
      surfaceFn,
      CONFIG.refractiveIndex,
      CONFIG.samples
    );
    var maximumDisplacement = Math.max.apply(
      null,
      precomputed.map(function (v) {
        return Math.abs(v);
      })
    );
    var displacementData = calculateDisplacementMap2D(
      width,
      height,
      width,
      height,
      radius,
      bezelWidth,
      maximumDisplacement || 1,
      precomputed
    );
    var specularData = calculateSpecularHighlight(width, height, radius, bezelWidth);
    var displacementUrl = imageDataToDataURL(displacementData);
    var specularUrl = imageDataToDataURL(specularData);
    var scale = maximumDisplacement * CONFIG.refractionScale;

    var ns = 'http://www.w3.org/2000/svg';
    var filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('x', '-12%');
    filter.setAttribute('y', '-12%');
    filter.setAttribute('width', '124%');
    filter.setAttribute('height', '124%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    function el(name, attrs) {
      var node = document.createElementNS(ns, name);
      Object.keys(attrs).forEach(function (key) {
        node.setAttribute(key, attrs[key]);
      });
      return node;
    }

    filter.appendChild(
      el('feImage', {
        href: displacementUrl,
        x: '0',
        y: '0',
        width: String(width),
        height: String(height),
        preserveAspectRatio: 'none',
        result: 'displacement_map',
      })
    );
    /* Refraction first on sharp source — deformation stays visible */
    filter.appendChild(
      el('feDisplacementMap', {
        in: 'SourceGraphic',
        in2: 'displacement_map',
        scale: String(scale),
        xChannelSelector: 'R',
        yChannelSelector: 'G',
        result: 'displaced',
      })
    );
    /* Frost after displacement — subtle blur, not before */
    filter.appendChild(
      el('feGaussianBlur', {
        in: 'displaced',
        stdDeviation: String(CONFIG.frostBlur),
        result: 'frosted',
      })
    );
    filter.appendChild(
      el('feColorMatrix', {
        in: 'frosted',
        type: 'saturate',
        values: '1.35',
        result: 'displaced_saturated',
      })
    );
    filter.appendChild(
      el('feImage', {
        href: specularUrl,
        x: '0',
        y: '0',
        width: String(width),
        height: String(height),
        preserveAspectRatio: 'none',
        result: 'specular_layer',
      })
    );

    var transfer = el('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' });
    var funcA = el('feFuncA', { type: 'linear', slope: String(CONFIG.specularOpacity) });
    transfer.appendChild(funcA);
    filter.appendChild(transfer);
    filter.appendChild(
      el('feBlend', {
        in: 'specular_faded',
        in2: 'displaced_saturated',
        mode: CONFIG.specularBlendMode,
      })
    );

    return filter;
  }

  var CARD_SELECTOR = [
    '.b__card:not(.b--bg-image):not(.b--no-glass):not(.sol-hero__video):not(.sol-final-cta):not(:has(> [class$="__bg"]))',
    '.testimonial-card:not(.b--no-glass)',
    '.glass-card',
    '.benefit-float',
    '.vs-benefit-float',
    '.cta-bento',
    '.cta-card',
  ].join(', ');

  function clearModes(el) {
    el.classList.remove('glass-card--liquid', 'benefit-float--liquid');
    el.style.removeProperty('--glass-liquid-filter');
    el.style.removeProperty('--benefit-liquid-filter');
  }

  function destroyInstance(el) {
    var state = instances.get(el);
    if (!state) return;
    if (state.filter && state.filter.parentNode) {
      state.filter.parentNode.removeChild(state.filter);
    }
    if (state.observer) state.observer.disconnect();
    clearModes(el);
    instances.delete(el);
  }

  function mountInstance(el) {
    if (!el.isConnected) return;
    if (!defsRoot) return;

    if (!supportsSvgBackdropFilter() || prefersReducedMotion()) {
      destroyInstance(el);
      clearModes(el);
      return;
    }

    var width = Math.max(1, Math.round(el.offsetWidth));
    var height = Math.max(1, Math.round(el.offsetHeight));

    if (width < 8 || height < 8) {
      var pendingObserver = new ResizeObserver(
        debounce(function () {
          if (el.offsetWidth >= 8 && el.offsetHeight >= 8) {
            mountInstance(el);
          }
        }, 150)
      );
      pendingObserver.observe(el);
      instances.set(el, { filter: null, observer: pendingObserver, id: null, pending: true });
      return;
    }

    var radius = Math.min(parseRadius(el), Math.min(width, height) / 2);
    var existing = instances.get(el);
    if (
      existing &&
      existing.filter &&
      !existing.pending &&
      existing.width === width &&
      existing.height === height &&
      existing.radius === radius
    ) {
      return;
    }

    destroyInstance(el);

    var id = 'lg-' + Math.random().toString(36).slice(2, 10);
    var filter = createFilterElement(id, width, height, radius);

    defsRoot.appendChild(filter);
    el.classList.add('glass-card--liquid', 'benefit-float--liquid');
    var filterUrl = 'url(#' + id + ')';
    el.style.setProperty('--glass-liquid-filter', filterUrl);
    el.style.setProperty('--benefit-liquid-filter', filterUrl);

    var observer = new ResizeObserver(
      debounce(function () {
        mountInstance(el);
      }, 150)
    );
    observer.observe(el);

    instances.set(el, { filter: filter, observer: observer, id: id, width: width, height: height, radius: radius });
  }

  function init() {
    defsRoot = document.getElementById('liquid-glass-defs');
    if (!defsRoot) return;

    document.querySelectorAll(CARD_SELECTOR).forEach(function (el) {
      mountInstance(el);
    });
  }

  var initDebounced = debounce(init, 100);

  function scheduleInits() {
    initDebounced();
    requestAnimationFrame(initDebounced);
    window.setTimeout(initDebounced, 320);
  }

  function deferredCssAlreadyLoaded() {
    var link = document.getElementById('hp-deferred-css');
    return !!(link && (link.rel === 'stylesheet' || link.sheet));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInits);
  } else {
    scheduleInits();
  }

  document.addEventListener('homepage-css-ready', initDebounced);
  if (deferredCssAlreadyLoaded()) initDebounced();

  window.addEventListener('load', initDebounced);
  window.__liquidGlassRefresh = initDebounced;
})();
