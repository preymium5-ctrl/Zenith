/* Concentric circles hero — canvas-based */
(function () {
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  canvas.classList.add('hero-canvas-enter');
  /* TEMP: disable all circles except the black core/eclipse */
  var ONLY_BLACK = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 768px)').matches;
  var ctx = canvas.getContext('2d');
  var dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  var W, H;
  var rafId = 0;
  var drawComplete = reduced;
  var lastFrameTs = 0;
  var LINE_SEGS = isMobile ? 16 : 24;
  var RING_SEGS = isMobile ? 16 : 24;
  var TANGENT_SEGS = isMobile ? 24 : 32;

  var bgCanvas = document.createElement('canvas');
  var bgCtx = bgCanvas.getContext('2d');
  var lastBgR = -99, lastBgG = -99, lastBgB = -99;
  var lastBgW = 0, lastBgH = 0;

  function resize() {
    var p = canvas.parentElement;
    if (!p) return;
    W = p.offsetWidth; H = p.offsetHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bgCanvas.width = W * dpr; bgCanvas.height = H * dpr;
    bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastBgR = -99;
  }

  var resizeRaf = 0;
  function scheduleResize() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(function () {
      resizeRaf = 0;
      resize();
      if (W && H) render(performance.now());
    });
  }

  var rto;
  var parent = canvas.parentElement;
  if (parent && typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(scheduleResize).observe(parent);
  }
  window.addEventListener('resize', function () {
    clearTimeout(rto); rto = setTimeout(scheduleResize, 120);
  });
  resize();


  function sr(s) { var x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  var TAU = Math.PI * 2;
  var RING_RADII = [0.14, 0.22, 0.60];
  var DOTS = [
    { ring: 0, angle: 0.15, size: 3, shape: 'circle' },
    { ring: 1, angle: 0.1,  size: 4, shape: 'circle' },
    { ring: 1, angle: 0.6,  size: 3, shape: 'square' },
    { ring: 2, angle: 0.4,  size: 4, shape: 'solar', orbitR: 10 },
    { ring: 2, angle: 0.75, size: 3, shape: 'circle' },
    { ring: 0, angle: 0.55, size: 3, shape: 'solar', orbitR: 8 }
  ];
  var LINE_DOTS = [
    { line: 0, t: 0.35, size: 3, shape: 'solar', orbitR: 9 },
    { line: 1, t: 0.5,  size: 3, shape: 'circle' }
  ];
  var LABELS = [
    '48.8566°N', '2.3522°E', '37.7749°N', '122.4194°W',
    '51.5074°N', '0.1278°W', '35.6762°N', '139.6503°E',
    'node_17', 'node_42', 'node_03', 'audio.in',
    'stream.ok', 'lat:48.85', 'lng:2.35', 'EU-west-1',
    'freq:44.1k', 'ch:stereo', 'bit:24', 'sr:16000',
    'ping:12ms', 'up:99.95%', 'lang:fr', 'lang:en',
    'spk:02', 'seg:147', 'wrd:2841', 'conf:0.97'
  ];
  var LINES = [{ angle: -8 }, { angle: 12 }];
  var drawStart = Date.now() / 1000;
  var DRAW_DUR = 2.4;
  /* Rotation starts after draw-in completes, then freezes (no infinite loop). */
  var ROT_STEPS = 2;
  var STEP_INTERVAL = 1.25;
  var STEP_ANGLE = Math.PI / 8;
  var ROT_SETTLE = STEP_INTERVAL * 0.4;
  var INTRO_END = DRAW_DUR + ROT_STEPS * STEP_INTERVAL + ROT_SETTLE;

  var stars = [];
  var STAR_COUNT = isMobile ? 120 : 250;
  for (var i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: sr(i), y: sr(i + 3e3),
      rad: 0.3 + sr(i + 6e3) * 0.8,
      oBase: 0.04 + sr(i + 9e3) * 0.15,
      ts: 1 + sr(i + 12e3) * 2,
      tp: sr(i + 15e3) * TAU
    });
  }



    function render(ts) {
      rafId = 0;
      ts = ts || performance.now();
      var t = drawComplete ? drawStart + INTRO_END : Date.now() / 1000;
    var drawRaw = Math.min(1, (t - drawStart) / DRAW_DUR);
    /* Smootherstep (quintic) — stronger ease-in/ease-out than smoothstep,
       giving a smoother "settle" at both ends of the draw. */
    var drawP = drawRaw * drawRaw * drawRaw * (drawRaw * (drawRaw * 6 - 15) + 10);
    var minFrameDelta = 16;
    if (!drawComplete && lastFrameTs && ts - lastFrameTs < minFrameDelta) {
      rafId = requestAnimationFrame(render);
      return;
    }
    lastFrameTs = ts;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '9px "Suisse Intl", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    /* Lerp ambiance state (intro only — frozen after draw completes) */
    var amb = window._heroAmb;
    if (amb && !drawComplete) {
      amb.hR += (amb.tR - amb.hR) * 0.18;
      amb.hG += (amb.tG - amb.hG) * 0.18;
      amb.hB += (amb.tB - amb.hB) * 0.18;
      amb.dotSpeed += (amb.tDotSpeed - amb.dotSpeed) * 0.06;
      amb.angleOff += (amb.tAngleOff - amb.angleOff) * 0.05;
      var dt = t - amb.lastT;
      amb.lastT = t;
      /* Orbit dots only once tracés are drawn (drawP >= 1). */
      if (drawRaw >= 1) amb.dotAccum += dt * amb.dotSpeed;
    }
    var aR = amb ? Math.round(amb.hR) : 120;
    var aG = amb ? Math.round(amb.hG) : 60;
    var aB = amb ? Math.round(amb.hB) : 220;
    var dotT = amb ? amb.dotAccum : t;
    var aOff = amb ? amb.angleOff : 0;
    /* Stepped rotation — begins after draw-in (DRAW_DUR), then holds final angle */
    var rotElapsed = Math.max(0, (t - drawStart) - DRAW_DUR);
    var stepCount = Math.min(ROT_STEPS, Math.floor(rotElapsed / STEP_INTERVAL));
    var stepP = Math.min(1, (rotElapsed - stepCount * STEP_INTERVAL) / STEP_INTERVAL);
    var stepEased = stepP >= 1 ? 1 : 1 - Math.pow(2, -10 * stepP);
    var steppedRotation = stepCount * STEP_ANGLE +
      (stepCount < ROT_STEPS ? stepEased * STEP_ANGLE : 0);
    var lineAoff = (aOff - Math.PI / 4) + steppedRotation;

    var cx = W / 2;
    var cy = H * 0.95;
    var maxR = Math.min(W, H) * 1.25;
    var eclCy = H + maxR * 0.9;
    var eclR = maxR * 1.6;

    /* Pre-render expensive blurred layers to offscreen canvas (only when color changes) */
      var bgDirty = Math.abs(aR - lastBgR) > 2 || Math.abs(aG - lastBgG) > 2 || Math.abs(aB - lastBgB) > 2;
      if (bgDirty) {
        lastBgR = aR; lastBgG = aG; lastBgB = aB;
      bgCtx.clearRect(0, 0, W, H);

      if (!ONLY_BLACK) {
        var grd = bgCtx.createRadialGradient(cx, cy, maxR * 0.05, cx, cy, maxR * 1.1);
        grd.addColorStop(0, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.35)');
        grd.addColorStop(0.3, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.2)');
        grd.addColorStop(0.6, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.08)');
        grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
        bgCtx.fillStyle = grd;
        bgCtx.fillRect(0, 0, W, H);

        bgCtx.save();
        bgCtx.filter = 'blur(40px)';
        var purpGrd = bgCtx.createRadialGradient(cx, eclCy, eclR * 0.15, cx, eclCy, eclR);
        purpGrd.addColorStop(0, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.7)');
        purpGrd.addColorStop(0.6, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.7)');
        purpGrd.addColorStop(0.72, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.5)');
        purpGrd.addColorStop(0.82, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.25)');
        purpGrd.addColorStop(0.9, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.07)');
        purpGrd.addColorStop(0.96, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.01)');
        purpGrd.addColorStop(1, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0)');
        bgCtx.fillStyle = purpGrd;
        bgCtx.beginPath();
        bgCtx.arc(cx, eclCy, eclR, 0, TAU);
        bgCtx.fill();
        bgCtx.restore();

        var colorLayers = [
          { size: 0.65, r: Math.round(aR * 0.50), g: Math.round(aG * 0.50), b: Math.round(aB * 0.71), a: 0.55 }, // [4] violet dense
          { size: 0.52, r: Math.round(aR * 0.39), g: Math.round(aG * 0.25), b: Math.round(aB * 0.63), a: 0.70 }, // [5] violet riche
          { size: 0.40, r: Math.round(aR * 0.29), g: Math.round(aG * 0.12), b: Math.round(aB * 0.55), a: 0.85 }  // [6] cœur profond
        ];
        bgCtx.save();
        bgCtx.filter = 'blur(100px)';
        for (var ci = 0; ci < colorLayers.length; ci++) {
          var cl = colorLayers[ci];
          var cRad = eclR * cl.size;
          bgCtx.fillStyle = 'rgba(' + cl.r + ',' + cl.g + ',' + cl.b + ',' + cl.a + ')';
          bgCtx.beginPath();
          bgCtx.arc(cx, eclCy, cRad, 0, TAU);
          bgCtx.fill();
        }
        bgCtx.restore();
      }

      var coreGrd = bgCtx.createRadialGradient(cx, eclCy, eclR * 0.15, cx, eclCy, eclR * 0.7);
      coreGrd.addColorStop(0, 'rgba(0, 0, 0, 1)');
      coreGrd.addColorStop(0.8, 'rgba(0, 0, 0, 1)');
      coreGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bgCtx.fillStyle = coreGrd;
      bgCtx.beginPath();
      bgCtx.arc(cx, eclCy, eclR * 0.7, 0, TAU);
      bgCtx.fill();

      bgCtx.save();
      bgCtx.filter = 'blur(40px)';
      var eclGrd = bgCtx.createRadialGradient(cx, eclCy, eclR * 0.15, cx, eclCy, eclR);
      var purpR = Math.round(aR * 0.38);
      var purpG = Math.round(aG * 0.28);
      var purpB = Math.round(aB * 0.6);
      eclGrd.addColorStop(0, 'rgba(0, 0, 0, 1)');
      eclGrd.addColorStop(0.6, 'rgba(0, 0, 0, 1)');
      eclGrd.addColorStop(0.72, 'rgba(' + purpR + ',' + purpG + ',' + purpB + ', 0.7)');
      eclGrd.addColorStop(0.82, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.32)');
      eclGrd.addColorStop(0.9, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.12)');
      eclGrd.addColorStop(0.96, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0.03)');
      eclGrd.addColorStop(1, 'rgba(' + aR + ',' + aG + ',' + aB + ', 0)');
      bgCtx.fillStyle = eclGrd;
      bgCtx.beginPath();
      bgCtx.arc(cx, eclCy, eclR, 0, TAU);
      bgCtx.fill();
      bgCtx.restore();

      /* Halo blanc très diffus entre le noir (éclipse) et les couches violettes */
      bgCtx.save();
      bgCtx.filter = 'blur(70px)';
      var whiteHaloGrd = bgCtx.createRadialGradient(cx, eclCy, eclR * 0.68, cx, eclCy, eclR * 1.08);
      whiteHaloGrd.addColorStop(0, 'rgba(255, 255, 255, 0)');
      whiteHaloGrd.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
      whiteHaloGrd.addColorStop(0.65, 'rgba(255, 255, 255, 0.3)');
      whiteHaloGrd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      bgCtx.fillStyle = whiteHaloGrd;
      bgCtx.beginPath();
      bgCtx.arc(cx, eclCy, eclR * 1.08, 0, TAU);
      bgCtx.fill();
      bgCtx.restore();
    }

    ctx.drawImage(bgCanvas, 0, 0, W, H);

    if (ONLY_BLACK) {
      if (drawRaw >= 1) drawComplete = true;
      if (!drawComplete && !reduced) rafId = requestAnimationFrame(render);
      return;
    }

    /* Star particles in the purple zone */
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var sx = s.x * W;
      var sy = H * 0.35 + s.y * H * 0.6;
      var dist = Math.sqrt((sx - cx) * (sx - cx) + (sy - cy) * (sy - cy));
      if (dist > maxR * 1.1) continue;
      var tw = 0.5 + 0.5 * Math.sin(t * s.ts + s.tp);
      var alpha = s.oBase * (0.4 + 0.6 * tw) * (1 - Math.min(1, dist / (maxR * 1.1)));
      if (alpha < 0.01) continue;
      ctx.fillStyle = 'rgba(' + Math.round(aR + 40) + ',' + Math.round(aG + 80) + ',' + Math.min(255, Math.round(aB + 20)) + ',' + alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, s.rad, 0, TAU);
      ctx.fill();
    }

    /* Helper: darkness factor at a point (0 = light zone, 1 = dark zone) */
    function darkAt(px, py) {
      var d = Math.sqrt((px - cx) * (px - cx) + (py - eclCy) * (py - eclCy));
      return 1 - Math.min(1, Math.max(0, (d - eclR * 0.5) / (eclR * 0.25)));
    }

    /* Diagonal lines — segmented for gradient */
    var RING_ALPHAS = [0.35, 0.25, 0.15];
    for (var i = 0; i < LINES.length; i++) {
      var la = LINES[i].angle * Math.PI / 180 + lineAoff;
      var lx1 = cx + Math.cos(la) * maxR * 1.15;
      var ly1 = cy + Math.sin(la) * maxR * 1.15;
      var lx2 = cx + Math.cos(la + Math.PI) * maxR * 0.12;
      var ly2 = cy + Math.sin(la + Math.PI) * maxR * 0.12;
      var segs = LINE_SEGS;
      ctx.lineWidth = 1.5;
      for (var j = 0; j < segs; j++) {
        var t1 = j / segs, t2 = (j + 1) / segs;
        var mx = lx1 + (lx2 - lx1) * (t1 + t2) * 0.5;
        var my = ly1 + (ly2 - ly1) * (t1 + t2) * 0.5;
        var dk = darkAt(mx, my);
        var al = 0.25 * (1 - dk);
        if (al < 0.01) continue;
        ctx.strokeStyle = 'rgba(0, 0, 0,' + al.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(lx1 + (lx2 - lx1) * t1, ly1 + (ly2 - ly1) * t1);
        ctx.lineTo(lx1 + (lx2 - lx1) * t2, ly1 + (ly2 - ly1) * t2);
        ctx.stroke();
      }
    }

    /* Dots traveling along diagonal lines */
    for (var i = 0; i < LINE_DOTS.length; i++) {
      var ld = LINE_DOTS[i];
      var la = LINES[ld.line].angle * Math.PI / 180 + lineAoff;
      var lx1 = cx + Math.cos(la) * maxR * 1.15;
      var ly1 = cy + Math.sin(la) * maxR * 1.15;
      var lx2 = cx + Math.cos(la + Math.PI) * maxR * 0.12;
      var ly2 = cy + Math.sin(la + Math.PI) * maxR * 0.12;
      var speed = 0.015 * (1 + ld.line * 0.5);
      var prog = drawRaw < 1 ? ld.t : ((t * speed + ld.t) % 1);
      var px = lx1 + (lx2 - lx1) * prog;
      var py = ly1 + (ly2 - ly1) * prog;
      var dk = darkAt(px, py);
      var dotA = 1 - dk;
      if (dotA < 0.02) continue;
      ctx.fillStyle = 'rgba(0, 0, 0,' + dotA.toFixed(3) + ')';
      if (ld.shape === 'solar') {
        ctx.beginPath();
        ctx.arc(px, py, ld.size, 0, TAU);
        ctx.fill();
        var oR = ld.orbitR || 10;
        ctx.strokeStyle = 'rgba(0, 0, 0,' + (dotA * 0.4).toFixed(3) + ')';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(px, py, oR, 0, TAU);
        ctx.stroke();
        var satAngle = rotElapsed * 1.5 + i * 4.1;
        var satX = px + Math.cos(satAngle) * oR;
        var satY = py + Math.sin(satAngle) * oR;
        ctx.fillStyle = 'rgba(0, 0, 0,' + (dotA * 0.7).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(satX, satY, 1.5, 0, TAU);
        ctx.fill();
      } else if (ld.shape === 'square') {
        var s = ld.size;
        ctx.fillRect(px - s, py - s, s * 2, s * 2);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, ld.size, 0, TAU);
        ctx.fill();
      }

      var lblIdx = Math.floor(rotElapsed * 0.8 + i * 5.1 + ld.line * 7) % LABELS.length;
      ctx.fillStyle = 'rgba(0, 0, 0,' + (dotA * 0.55).toFixed(3) + ')';
      ctx.fillText(LABELS[lblIdx], px, py - (ld.shape === 'solar' ? (ld.orbitR + 8) : 13));
    }

    /* Concentric circles — continuous arc draw-on from 3 origins.
       The last segment of each third is clamped to the exact progress,
       so growth is truly smooth (no visible stepping). */
    for (var i = 0; i < RING_RADII.length; i++) {
      var r = maxR * RING_RADII[i];
      var baseA = RING_ALPHAS[i] || 0.15;
      var isInner = (i < 2);
      ctx.lineWidth = isInner ? 2.5 : 2;
      var segs = RING_SEGS;
      var thirdSpan = TAU / 3;
      var segAngle = thirdSpan / segs;
      var coveredAngle = thirdSpan * drawP;
      var origins = [0, thirdSpan, thirdSpan * 2];
      for (var oi = 0; oi < 3; oi++) {
        var oStart = origins[oi];
        for (var j = 0; j < segs; j++) {
          var jAngle = j * segAngle;
          if (jAngle >= coveredAngle) break;
          var a1 = oStart + jAngle;
          var a2 = oStart + Math.min(jAngle + segAngle, coveredAngle);
          var am = (a1 + a2) * 0.5;
          var mx = cx + Math.cos(am) * r;
          var my = cy + Math.sin(am) * r;
          var dk = darkAt(mx, my);
          var al = baseA * (1 - dk);
          if (al < 0.01) continue;
          ctx.strokeStyle = 'rgba(0, 0, 0,' + al.toFixed(3) + ')';
          ctx.beginPath();
          ctx.arc(cx, cy, r, a1, a2);
          ctx.stroke();
        }
      }
    }

    /* Rotating tangent lines — grow smoothly from both ends.
       Uses an accelerated progress (lineP) so the lines appear
       early alongside the circle opening, finishing well before
       the full draw-in completes. Each half is drawn with a
       clamped last segment for continuous (non-staccato) growth. */
    (function () {
      var sqR = maxR * RING_RADII[2];
      var baseAngle = aOff * 2 + steppedRotation;
      var corners = [];
      for (var ci = 0; ci < 4; ci++) {
        var ca = baseAngle + ci * Math.PI / 2;
        corners.push([cx + Math.cos(ca) * sqR * 1.414, cy + Math.sin(ca) * sqR * 1.414]);
      }
      /* Fully synchronized with the circle — same easing curve (drawP
         is already smootherstep-eased), same timeline, so lines and
         circle grow at exactly the same rate. */
      var halfP = drawP * 0.5;

      function strokeSegment(ex1, ey1, ex2, ey2, t1, t2) {
        if (t2 <= t1) return;
        var mx = ex1 + (ex2 - ex1) * (t1 + t2) * 0.5;
        var my = ey1 + (ey2 - ey1) * (t1 + t2) * 0.5;
        var dk = darkAt(mx, my);
        var al = 0.15 * (1 - dk);
        if (al < 0.01) return;
        ctx.strokeStyle = 'rgba(0, 0, 0,' + al.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(ex1 + (ex2 - ex1) * t1, ey1 + (ey2 - ey1) * t1);
        ctx.lineTo(ex1 + (ex2 - ex1) * t2, ey1 + (ey2 - ey1) * t2);
        ctx.stroke();
      }

      function drawHalf(ex1, ey1, ex2, ey2, start, end) {
        if (end <= start) return;
        var segs = TANGENT_SEGS;
        var segStep = 1 / segs;
        for (var j = 0; j < segs; j++) {
          var t1 = j * segStep;
          var t2 = (j + 1) * segStep;
          if (t2 <= start) continue;
          if (t1 >= end) break;
          var clippedT1 = Math.max(t1, start);
          var clippedT2 = Math.min(t2, end);
          strokeSegment(ex1, ey1, ex2, ey2, clippedT1, clippedT2);
        }
      }

      /* Clip each infinite tangent line to the viewport bounds so the
         endpoints sit right at the screen edges. Since the halves grow
         from the endpoints inward, visible motion appears immediately. */
      function clipLineToViewport(x1, y1, x2, y2) {
        var margin = 40;
        var dx = x2 - x1, dy = y2 - y1;
        var tMin = -Infinity, tMax = Infinity;
        if (Math.abs(dx) > 1e-6) {
          var t1x = (-margin - x1) / dx;
          var t2x = (W + margin - x1) / dx;
          tMin = Math.max(tMin, Math.min(t1x, t2x));
          tMax = Math.min(tMax, Math.max(t1x, t2x));
        } else if (x1 < -margin || x1 > W + margin) {
          return null;
        }
        if (Math.abs(dy) > 1e-6) {
          var t1y = (-margin - y1) / dy;
          var t2y = (H + margin - y1) / dy;
          tMin = Math.max(tMin, Math.min(t1y, t2y));
          tMax = Math.min(tMax, Math.max(t1y, t2y));
        } else if (y1 < -margin || y1 > H + margin) {
          return null;
        }
        if (tMin >= tMax) return null;
        return { tMin: tMin, tMax: tMax };
      }

      for (var side = 0; side < 4; side++) {
        var x1 = corners[side][0], y1 = corners[side][1];
        var x2 = corners[(side + 1) % 4][0], y2 = corners[(side + 1) % 4][1];
        var sdx = x2 - x1, sdy = y2 - y1;
        var ex1, ey1, ex2, ey2;
        var clip = clipLineToViewport(x1, y1, x2, y2);
        if (clip) {
          ex1 = x1 + clip.tMin * sdx;
          ey1 = y1 + clip.tMin * sdy;
          ex2 = x1 + clip.tMax * sdx;
          ey2 = y1 + clip.tMax * sdy;
        } else {
          /* Fallback for sides that never cross the viewport:
             short extension so we still render something consistent. */
          ex1 = x1 - sdx * 0.4; ey1 = y1 - sdy * 0.4;
          ex2 = x2 + sdx * 0.4; ey2 = y2 + sdy * 0.4;
        }
        ctx.lineWidth = 2;
        /* First half: from t=0 up to halfP */
        drawHalf(ex1, ey1, ex2, ey2, 0, halfP);
        /* Second half: from t=1-halfP up to 1 */
        drawHalf(ex1, ey1, ex2, ey2, 1 - halfP, 1);
      }
    })();

    /* Dots on rings — orbiting, fade to transparent in dark zone */
    for (var i = 0; i < DOTS.length; i++) {
      var d = DOTS[i];
      var r = maxR * RING_RADII[d.ring];
      var a = d.angle * TAU + dotT * 0.015 * (1 + d.ring * 0.5) + aOff;
      var dx = cx + Math.cos(a) * r;
      var dy = cy + Math.sin(a) * r;
      var dk = darkAt(dx, dy);
      var dotA = 1 - dk;
      if (dotA < 0.02) continue;
      ctx.fillStyle = 'rgba(0, 0, 0,' + dotA.toFixed(3) + ')';
      if (d.shape === 'solar') {
        ctx.beginPath();
        ctx.arc(dx, dy, d.size, 0, TAU);
        ctx.fill();
        var oR = d.orbitR || 10;
        ctx.strokeStyle = 'rgba(0, 0, 0,' + (dotA * 0.4).toFixed(3) + ')';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(dx, dy, oR, 0, TAU);
        ctx.stroke();
        var satAngle = rotElapsed * 1.5 + i * 2.5;
        var satX = dx + Math.cos(satAngle) * oR;
        var satY = dy + Math.sin(satAngle) * oR;
        ctx.fillStyle = 'rgba(0, 0, 0,' + (dotA * 0.7).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(satX, satY, 1.5, 0, TAU);
        ctx.fill();
      } else if (d.shape === 'square') {
        var s = d.size;
        ctx.fillRect(dx - s, dy - s, s * 2, s * 2);
      } else {
        ctx.beginPath();
        ctx.arc(dx, dy, d.size, 0, TAU);
        ctx.fill();
      }

      var lblIdx = Math.floor(rotElapsed * 0.8 + i * 3.3) % LABELS.length;
      var lbl = LABELS[lblIdx];
      ctx.fillStyle = 'rgba(0, 0, 0,' + (dotA * 0.55).toFixed(3) + ')';
      ctx.fillText(lbl, dx, dy - (d.shape === 'solar' ? (d.orbitR + 8) : 13));
    }

    if (!reduced && (t - drawStart) >= INTRO_END) drawComplete = true;
    if (!drawComplete && !reduced) rafId = requestAnimationFrame(render);
  }

  if (reduced) drawStart = Date.now() / 1000 - INTRO_END;
  render(performance.now());
  if (!drawComplete && !reduced) rafId = requestAnimationFrame(render);
  })();