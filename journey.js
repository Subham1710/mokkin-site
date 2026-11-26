// "How we work": a pinned, full-screen journey.
// Each step is a small 3D object drawn in lines of light: a question, a page, a phone, three options,
// code, a rocket and a heart. Scrolling plays a short story between them (the question unrolls into
// the page, the page spins into the phone, the phone splits into options, the options swirl into code,
// the code assembles a rocket, the rocket lifts off and comes back down as a heart).
// Without JS, or with reduced motion, the section is a plain list of steps (see CSS).
(function () {
  var sec = document.getElementById('how');
  if (!sec) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.classList.add('live');

  var steps = Array.prototype.slice.call(sec.querySelectorAll('.j-step'));
  var N = steps.length;
  var stage = sec.querySelector('.j-stage');
  var textBox = sec.querySelector('.j-text'), copy = sec.querySelector('.j-copy');
  var numEl = sec.querySelector('.j-num'), phEl = sec.querySelector('.j-ph'), kEl = sec.querySelector('.j-k');
  var titleEl = sec.querySelector('.j-title'), lineEl = sec.querySelector('.j-line');
  var fill = sec.querySelector('.j-fill'), pct = sec.querySelector('.j-pct');
  var curNum = sec.querySelector('.j-cur-n'), curName = sec.querySelector('.j-cur-name'), phaseEl = sec.querySelector('.j-phase');
  var nodesBox = sec.querySelector('.j-nodes');
  var canvas = sec.querySelector('.j-canvas'), ctx = canvas.getContext('2d');
  var lay = document.createElement('canvas'), lctx = lay.getContext('2d');
  var pad = function (n) { return String(n).padStart(2, '0'); };
  function clamp(v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  var small = window.innerWidth < 720;

  // ---------- Rolling step number: "0" + a strip of digits that scrolls with the morph ----------
  var strip = '';
  for (var n = 1; n <= N; n++) strip += '<span>' + n + '</span>';
  numEl.innerHTML = '<span class="j-z">0</span><span class="j-dig"><span class="j-strip">' + strip + '</span></span>';
  var stripEl = numEl.querySelector('.j-strip');

  // ---------- Progress nodes ----------
  function stepTop(i) {
    var top = sec.getBoundingClientRect().top + window.scrollY;
    return top + (sec.offsetHeight - window.innerHeight) * ((i + 0.3) / N);
  }
  var nodes = steps.map(function (st, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'j-node';
    b.style.left = (i / (N - 1)) * 100 + '%';
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + st.getAttribute('data-title'));
    b.innerHTML = '<span>' + pad(i + 1) + '</span>';
    b.addEventListener('click', function () { window.scrollTo({ top: stepTop(i), behavior: 'smooth' }); });
    nodesBox.appendChild(b);
    return b;
  });

  // ---------- Geometry: every object is lines of evenly spaced points, in 3D ----------
  // Units: the object fits roughly in -0.5..0.5. y points down, negative z faces the viewer.
  function path(poly, sp, out) { // walk a 3D polyline and drop a point every `sp`
    out.push(poly[0].slice());
    var need = sp;
    for (var k = 1; k < poly.length; k++) {
      var a = poly[k - 1], b = poly[k];
      var dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz), pos = 0;
      while (d - pos >= need) { pos += need; var r = pos / d; out.push([a[0] + dx * r, a[1] + dy * r, a[2] + dz * r]); need = sp; }
      need -= d - pos;
    }
  }
  function z3(poly2, z) { return poly2.map(function (p) { return [p[0], p[1], z]; }); }
  function curve(fn, n) { var o = []; for (var k = 0; k <= n; k++) o.push(fn(k / n)); return o; }
  function circle(cx, cy, r) { return curve(function (u) { return [cx + r * Math.cos(u * Math.PI * 2), cy + r * Math.sin(u * Math.PI * 2)]; }, 48); }
  function rrect(x0, y0, x1, y1, r) {
    var o = [], c = [[x1 - r, y0 + r, -0.5], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, 0.5], [x0 + r, y0 + r, 1]];
    c.forEach(function (q) { for (var k = 0; k <= 10; k++) { var a = (q[2] + k / 20) * Math.PI; o.push([q[0] + r * Math.cos(a), q[1] + r * Math.sin(a)]); } });
    o.push(o[0]);
    return o;
  }
  function offset(poly2, w) { // shift a 2D polyline sideways by w (mitred joints)
    return poly2.map(function (p, k) {
      var a = poly2[Math.max(0, k - 1)], b = poly2[Math.min(poly2.length - 1, k + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
      return [p[0] - dy / l * w, p[1] + dx / l * w];
    });
  }
  function slab(poly2, d, sp, out, mid) { // an outline with thickness: front, back and (sparser) middle
    path(z3(poly2, -d), sp, out); path(z3(poly2, d), sp, out);
    if (mid) path(z3(poly2, 0), sp * 2.2, out);
  }
  function tube(poly2, w, d, sp, out) { // a square-section stroke: four rails
    [-w, w].forEach(function (o) { var q = offset(poly2, o); path(z3(q, -d), sp, out); path(z3(q, d), sp, out); });
  }
  function grid(x0, y0, x1, y1, z, sp, out) {
    for (var y = y0; y <= y1 + 1e-6; y += sp) for (var x = x0; x <= x1 + 1e-6; x += sp) out.push([x, y, z]);
  }
  function disk(cx, cy, r, z, sp, out) { for (var rr = r; rr > sp * 0.4; rr -= sp) path(z3(circle(cx, cy, rr), z), sp, out); out.push([cx, cy, z]); }
  function hline(x0, x1, y, z, sp, out) { path([[x0, y, z], [x1, y, z]], sp, out); }

  var build = [
    function (sp, o) { // 01 We ask first: a speech bubble with a question mark
      slab(rrect(-0.44, -0.38, 0.44, 0.16, 0.14), 0.055, sp, o, true);
      slab([[-0.24, 0.16], [-0.3, 0.38], [-0.06, 0.16]], 0.055, sp, o);
      var q = curve(function (u) { var a = Math.PI * (1.1 + 1.4 * u); return [0.085 * Math.cos(a), -0.16 + 0.085 * Math.sin(a)]; }, 30);
      q.push([0, -0.02]); q.push([0, 0.02]);
      tube(q, 0.016, 0.03, sp, o);
      disk(0, 0.085, 0.026, -0.03, sp, o); disk(0, 0.085, 0.026, 0.03, sp, o);
    },
    function (sp, o) { // 02 We write it down: a page with a folded corner and lines
      slab([[-0.3, -0.44], [0.15, -0.44], [0.3, -0.29], [0.3, 0.44], [-0.3, 0.44], [-0.3, -0.44]], 0.025, sp, o);
      path(z3([[0.15, -0.44], [0.15, -0.29], [0.3, -0.29]], -0.025), sp, o);
      [[-0.2, 0.18, -0.24], [-0.2, 0.2, -0.13], [-0.2, 0.2, -0.02], [-0.2, 0.2, 0.09], [-0.2, 0.06, 0.2]].forEach(function (l) {
        hline(l[0], l[1], l[2], -0.025, sp, o); hline(l[0], l[1], l[2] + 0.018, -0.025, sp, o);
      });
      path(z3(curve(function (u) { return [0.06 + 0.14 * u, 0.33 - 0.03 * Math.sin(u * Math.PI * 3)]; }, 30), -0.025), sp, o); // signature
    },
    function (sp, o) { // 03 You see it: a phone with an app on screen
      slab(rrect(-0.23, -0.46, 0.23, 0.46, 0.09), 0.045, sp, o, true);
      path(z3(rrect(-0.2, -0.43, 0.2, 0.43, 0.065), -0.045), sp, o);
      hline(-0.04, 0.04, -0.395, -0.045, sp, o);
      grid(-0.15, -0.33, 0.15, -0.13, -0.045, sp * 1.15, o);
      hline(-0.15, 0.15, -0.05, -0.045, sp, o); hline(-0.15, 0.1, 0.03, -0.045, sp, o); hline(-0.15, 0.05, 0.11, -0.045, sp, o);
      path(z3(rrect(-0.15, 0.24, 0.15, 0.33, 0.045), -0.045), sp, o);
      disk(-0.12, -0.36, 0.035, 0.045, sp, o); // camera on the back
    },
    function (sp, o) { // 04 You choose: three options, the middle one picked
      [[-0.32, 0.3], [0, 0.48], [0.32, 0.38]].forEach(function (b, k) {
        var x0 = b[0] - 0.1, x1 = b[0] + 0.1, y0 = 0.4 - b[1], y1 = 0.4, d = 0.1;
        var C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
        path(z3(C.concat([C[0]]), -d), sp, o); path(z3(C.concat([C[0]]), d), sp, o);
        C.forEach(function (c) { path([[c[0], c[1], -d], [c[0], c[1], d]], sp, o); });
        if (k === 1) grid(x0 + sp, y0 + sp, x1 - sp, y1 - sp, -d, sp * 1.2, o);
      });
      tube([[-0.07, -0.2], [-0.015, -0.145], [0.09, -0.26]], 0.014, 0.025, sp, o);
    },
    function (sp, o) { // 05 We build it: </>
      tube([[-0.18, -0.26], [-0.43, 0], [-0.18, 0.26]], 0.024, 0.05, sp, o);
      tube([[0.18, -0.26], [0.43, 0], [0.18, 0.26]], 0.024, 0.05, sp, o);
      tube([[0.09, -0.34], [-0.09, 0.34]], 0.024, 0.05, sp, o);
    },
    function (sp, o) { // 06 We launch it: a rocket, drawn as a wireframe body of revolution
      var prof = function (y) { var u = clamp((y + 0.46) / 0.66); return 0.15 * Math.pow(Math.sin(u * Math.PI / 2), 0.6) * (1 - 0.18 * u * u * u); };
      var lat = [-0.4, -0.32, -0.22, -0.1, 0.02, 0.12, 0.2];
      lat.forEach(function (y) { var r = prof(y); path(curve(function (u) { var a = u * Math.PI * 2; return [r * Math.cos(a), y, r * Math.sin(a)]; }, 48), sp, o); });
      for (var m = 0; m < 10; m++) {
        var a = m / 10 * Math.PI * 2;
        path(curve(function (u) { var y = -0.46 + 0.66 * u, r = prof(y); return [r * Math.cos(a), y, r * Math.sin(a)]; }, 40), sp, o);
      }
      path(curve(function (u) { var a = u * Math.PI * 2; return [0.05 * Math.cos(a), -0.14 + 0.05 * Math.sin(a), -prof(-0.14) - 0.005]; }, 40), sp, o);
      [Math.PI / 2, Math.PI / 2 + 2.094, Math.PI / 2 - 2.094].forEach(function (a) {
        var rb = prof(0.1), c = Math.cos(a), s = Math.sin(a);
        path([[rb, 0.0], [rb + 0.13, 0.22], [rb + 0.13, 0.3], [rb, 0.2]].map(function (p) { return [p[0] * c, p[1], p[0] * s]; }), sp, o);
      });
      var seed = 7;
      var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (var k = 0; k < Math.round(0.9 / sp); k++) { // exhaust
        var y = 0.24 + rnd() * 0.22, rr = 0.1 * (1 - (y - 0.24) / 0.24) * Math.sqrt(rnd()), aa = rnd() * Math.PI * 2;
        o.push([rr * Math.cos(aa), y, rr * Math.sin(aa)]);
      }
    },
    function (sp, o) { // 07 We take care of it: a puffy 3D heart, in layers
      var heart = function (sc, z) {
        return curve(function (u) {
          var t = u * Math.PI * 2, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          return [x / 34 * sc, (y / 34 - 0.07) * sc, z];
        }, 120);
      };
      for (var L = -4; L <= 4; L++) { var zz = L / 4.4, s = Math.sqrt(1 - zz * zz); path(heart(0.18 + 0.82 * s, zz * 0.17), sp, o); }
    }
  ].slice(0, N);

  var T = small ? 760 : 1300; // fewer, bigger dots on phones
  var shapes = build.map(function (fn) {
    var sp = small ? 0.02 : 0.0105, pts = [];
    fn(sp, pts);
    sp *= pts.length / T; pts = []; fn(sp, pts); // respace so every object has about T points
    var out = [];
    for (var k = 0; k < T; k++) {
      if (k < pts.length) { var q = pts[pts.length > T ? Math.floor(k * pts.length / T) : k]; out.push({ x: q[0], y: q[1], z: q[2], s: 1 }); }
      else { var r = pts[(k * 7919) % pts.length]; out.push({ x: r[0], y: r[1], z: r[2], s: 0 }); }
    }
    return out;
  });

  // ---------- Story between steps ----------
  // Each transition pairs dots by a sort key (so they travel coherently), follows a curved path
  // through a control point, and staggers the start by a key (so it reads as one gesture).
  var kx = function (p) { return p.x; }, ky = function (p) { return p.y; };
  var kang = function (p) { return Math.atan2(p.y, p.x); };
  var moves = [
    { key: ky, type: 'unroll' },   // question -> page
    { key: kx, type: 'spin' },     // page -> phone
    { key: kx, type: 'split' },    // phone -> options
    { key: kang, type: 'swirl' },  // options -> code
    { key: ky, type: 'assemble' }, // code -> rocket
    { key: ky, type: 'liftoff' }   // rocket -> heart
  ];
  var TG = [shapes[0].slice()];
  for (var s = 0; s < N - 1; s++) {
    var key = moves[s].key, A0 = TG[s], B0 = shapes[s + 1];
    var di = A0.map(function (_, d) { return d; }).sort(function (a, b) { return key(A0[a]) - key(A0[b]); });
    var bi = B0.map(function (_, j) { return j; }).sort(function (a, b) { return key(B0[a]) - key(B0[b]); });
    var next = new Array(T);
    for (var r = 0; r < T; r++) next[di[r]] = B0[bi[r]];
    TG.push(next);
  }

  // Per-dot state
  var seed2 = 11;
  var rnd2 = function () { seed2 = (seed2 * 16807) % 2147483647; return seed2 / 2147483647; };
  var P = [];
  for (var k = 0; k < T; k++) {
    var t0 = TG[0][k];
    P.push({ x: t0.x * 2.5, y: t0.y * 2.5, z: t0.z, vx: 0, vy: 0, vz: 0, s: 0, ph: rnd2() * 6.283, sz: 0.75 + rnd2() * 0.5,
      r1: rnd2() - 0.5, r2: rnd2() - 0.5, r3: rnd2() - 0.5 });
  }
  var dust = [];
  for (var d = 0; d < (small ? 40 : 90); d++) dust.push({ x: rnd2(), y: rnd2(), r: rnd2() * 1.4 + 0.3, v: 0.00004 + rnd2() * 0.00012, a: 0.12 + rnd2() * 0.3 });

  // ---------- Sprites: white, coloured later. Three focus levels for depth of field ----------
  function sprite(core, halo, edge) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(core, 'rgba(255,255,255,.95)');
    rg.addColorStop(core + 0.06, 'rgba(255,255,255,' + halo + ')');
    rg.addColorStop(edge, 'rgba(255,255,255,' + (halo * 0.25) + ')');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return c;
  }
  var SPR = [sprite(0.2, 0.22, 0.55), sprite(0.3, 0.3, 0.7), sprite(0.42, 0.22, 0.85)];
  var SPARK = sprite(0.1, 0.4, 0.4);

  // Stage colours: cool while we shape it, Signal orange while we build, warm while we care for it
  var COOL = [[238, 242, 247], [140, 164, 196]], HOT = [[255, 90, 31], [255, 178, 145]], WARM = [[255, 216, 198], [255, 112, 64]];
  var PAL = [COOL, COOL, COOL, COOL, HOT, HOT, WARM];
  var GLOW = [[120, 150, 196], [120, 150, 196], [120, 150, 196], [120, 150, 196], [255, 90, 31], [255, 90, 31], [255, 130, 90]];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }

  // ---------- Layout ----------
  var W = 0, H = 0, dpr = 1, box = { cx: 0, cy: 0, size: 0 }, goal = { cx: 0, cy: 0, size: 0 }, placed = false;
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = lay.width = Math.round(W * dpr); canvas.height = lay.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sr = stage.getBoundingClientRect(), tr = copy.getBoundingClientRect();
    var label = sec.querySelector('.j-label').getBoundingClientRect();
    var barTop = sec.querySelector('.j-bar').getBoundingClientRect().top - sr.top;
    if (W >= 960) { // object on the right
      var left = tr.right - sr.left + 40, top = label.bottom - sr.top + 10;
      goal.size = Math.min(W - left - 40, barTop - top - 20) * 0.8;
      goal.cx = left + (W - left) / 2; goal.cy = top + (barTop - top) / 2;
    } else { // object above the text
      var t = label.bottom - sr.top + 6, b = tr.top - sr.top - 10;
      goal.size = Math.max(120, Math.min(W * 0.82, b - t) * 0.86);
      goal.cx = W / 2; goal.cy = t + (b - t) / 2;
    }
  }

  // ---------- Pointer and phone tilt ----------
  var mouse = { x: 9, y: 9, tx: 0, ty: 0 }, tilt = { x: 0, y: 0 };
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left - box.cx) / box.size;
    mouse.y = (e.clientY - r.top - box.cy) / box.size;
    mouse.tx = (e.clientX - r.left) / W - 0.5; mouse.ty = (e.clientY - r.top) / H - 0.5;
  });
  stage.addEventListener('pointerleave', function () { mouse.x = mouse.y = 9; mouse.tx = mouse.ty = 0; });
  if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      tilt.x = clamp(e.gamma / 35, -1, 1); tilt.y = clamp((e.beta - 50) / 40, -1, 1);
    });
  }

  // ---------- Scroll position -> step, morph progress ----------
  var f = 0, visible = false, yaw = 0, pitch = -0.12;
  function where() {
    var i = Math.min(N - 1, Math.floor(f)), local = f - i;
    return { i: i, local: local, t: i >= N - 1 ? 0 : clamp((local - 0.5) / 0.5) };
  }

  function frame(time) {
    if (!visible) return;
    var w = where(), i = w.i, t = w.t;
    if (!placed) { box.cx = goal.cx; box.cy = goal.cy; box.size = goal.size; placed = true; }
    box.cx += (goal.cx - box.cx) * 0.06; box.cy += (goal.cy - box.cy) * 0.06; box.size += (goal.size - box.size) * 0.06;
    var size = box.size, cx = box.cx, cy = box.cy;
    var j = Math.min(N - 1, i + 1), te = ease(t);
    var pal = [mix(PAL[i][0], PAL[j][0], te), mix(PAL[i][1], PAL[j][1], te)], gc = mix(GLOW[i], GLOW[j], te);

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, W, H);
    var breathe = 0.5 + 0.5 * Math.sin(time / 1800);
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
    glow.addColorStop(0, rgb(gc, 0.1 + 0.06 * breathe)); glow.addColorStop(1, rgb(gc, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    for (var q = 0; q < dust.length; q++) {
      var du = dust[q]; du.y -= du.v * 16; if (du.y < -0.02) { du.y = 1.02; du.x = Math.random(); }
      ctx.fillStyle = 'rgba(213,218,225,' + du.a + ')'; ctx.fillRect(du.x * W, du.y * H, du.r, du.r);
    }
    var bh = size * 0.6, bl = Math.max(14, size * 0.06);
    ctx.strokeStyle = 'rgba(195,202,211,.2)'; ctx.lineWidth = 1; ctx.beginPath();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) {
      var x = cx + c[0] * bh, y = cy + c[1] * bh;
      ctx.moveTo(x - c[0] * bl, y); ctx.lineTo(x, y); ctx.lineTo(x, y - c[1] * bl);
    });
    ctx.stroke();

    // camera: sways as you scroll, follows the mouse or the phone's tilt, spins on the page -> phone move
    var spin = (i === 1 ? te * Math.PI * 2 : 0);
    var yawT = Math.sin(f * Math.PI) * 0.38 + Math.sin(time / 4200) * 0.1 + mouse.tx * 0.9 + tilt.x * 0.6;
    var pitchT = -0.14 + mouse.ty * 0.5 + tilt.y * 0.3;
    yaw += (yawT - yaw) * 0.06; pitch += (pitchT - pitch) * 0.06;
    var Y = yaw + spin, cyw = Math.cos(Y), syw = Math.sin(Y), cp = Math.cos(pitch), spt = Math.sin(pitch), CAM = 2.4;
    var r0 = Math.max(1.6, size * (small ? 0.006 : 0.0046));
    var A = TG[i], B = TG[j], type = i < N - 1 ? moves[i].type : '';

    lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'lighter';
    ctx.globalCompositeOperation = 'lighter';
    for (var d = 0; d < T; d++) {
      var p = P[d], a = A[d], b = B[d], key01, Cx, Cy, Cz;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, mz = (a.z + b.z) / 2;
      switch (type) {
        case 'unroll': key01 = a.y + 0.5; Cx = mx; Cy = my; Cz = mz - 0.35; break;
        case 'spin': key01 = (a.x + 0.5) * 0.3; Cx = mx; Cy = my; Cz = mz; break;
        case 'split': key01 = Math.abs(a.x) * 1.6; Cx = mx + (a.x < 0 ? -0.3 : 0.3); Cy = my; Cz = mz - 0.2; break;
        case 'swirl': key01 = (Math.atan2(a.y, a.x) + Math.PI) / 6.283; Cx = -my * 1.4; Cy = mx * 1.4; Cz = mz; break;
        case 'assemble': key01 = 0.5 - b.y; Cx = p.r1 * 0.25; Cy = p.r2 * 0.25; Cz = p.r3 * 0.25; break;
        case 'liftoff': key01 = a.y + 0.5; Cx = a.x * 0.4; Cy = -1.6; Cz = a.z; break;
        default: key01 = 0; Cx = mx; Cy = my; Cz = mz;
      }
      var u = ease(clamp((t - clamp(key01) * 0.4) / 0.6)), iu = 1 - u;
      var tx = iu * iu * a.x + 2 * u * iu * Cx + u * u * b.x;
      var ty = iu * iu * a.y + 2 * u * iu * Cy + u * u * b.y;
      var tz = iu * iu * a.z + 2 * u * iu * Cz + u * u * b.z;
      var ts = a.s + (b.s - a.s) * u;
      tx += Math.sin(time / 1300 + p.ph) * 0.002; ty += Math.cos(time / 1500 + p.ph) * 0.002;
      if (i === 5 && t === 0 && a.y > 0.23) { ty += Math.sin(time / 90 + p.ph) * 0.01; } // exhaust flicker
      var ex = p.x - mouse.x, ey = p.y - mouse.y, ed = ex * ex + ey * ey;
      if (ed < 0.016) { var push = (0.016 - ed) * 20; tx += ex * push; ty += ey * push; }
      p.vx = p.vx * 0.82 + (tx - p.x) * 0.09; p.vy = p.vy * 0.82 + (ty - p.y) * 0.09; p.vz = p.vz * 0.82 + (tz - p.z) * 0.09;
      p.x += p.vx; p.y += p.vy; p.z += p.vz; p.s += (ts - p.s) * 0.12;
      if (p.s < 0.04) continue;
      // rotate (yaw, then pitch) and project
      var x1 = p.x * cyw - p.z * syw, z1 = p.x * syw + p.z * cyw;
      var y2 = p.y * cp - z1 * spt, z2 = p.y * spt + z1 * cp;
      var per = CAM / (CAM + z2);
      var sx = cx + x1 * size * per, sy = cy + y2 * size * per;
      // depth of field: the focal plane is the object's centre
      var blur = clamp(Math.abs(z2) * 3.4), lv = blur < 0.34 ? 0 : blur < 0.67 ? 1 : 2;
      var rad = r0 * p.sz * p.s * per * (1 + blur * 1.5);
      var al = clamp(0.5 + (per - 0.85) * 1.2, 0.3, 1) * (1 - blur * 0.5) * (0.35 + 0.65 * p.s);
      lctx.globalAlpha = al;
      lctx.drawImage(SPR[lv], sx - rad * 3, sy - rad * 3, rad * 6, rad * 6);
      if (lv === 0 && per > 1.04) { // a white glint on the nearest edges
        ctx.globalAlpha = al * 0.35 * (0.6 + 0.4 * Math.sin(time / 400 + p.ph));
        ctx.drawImage(SPARK, sx - rad * 2, sy - rad * 2, rad * 4, rad * 4);
      }
    }
    lctx.globalAlpha = 1; ctx.globalAlpha = 1;
    // colour the whole object with the stage gradient, then add it to the scene
    lctx.globalCompositeOperation = 'source-atop';
    var lg = lctx.createLinearGradient(cx - size * 0.5, cy - size * 0.3, cx + size * 0.5, cy + size * 0.3);
    lg.addColorStop(0, rgb(pal[0], 1)); lg.addColorStop(1, rgb(pal[1], 1));
    lctx.fillStyle = lg; lctx.fillRect(0, 0, W, H);
    ctx.drawImage(lay, 0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  // ---------- Text: lands as the dots arrive ----------
  function words(el, text) {
    el.innerHTML = text.split(' ').map(function (w, k) { return '<span class="m"><span style="--d:' + (k * 55) + 'ms">' + w + '</span></span>'; }).join(' ');
  }
  var shown = -1, hidden = true;
  function showText(want) {
    if (want < 0) { // mid-morph: words step aside
      if (!hidden) { hidden = true; textBox.classList.remove('in'); textBox.classList.add('out'); }
      return;
    }
    if (want !== shown) {
      shown = want;
      var st = steps[want];
      phEl.textContent = st.getAttribute('data-phase');
      kEl.textContent = pad(want + 1);
      words(titleEl, st.getAttribute('data-title'));
      lineEl.textContent = st.getAttribute('data-line');
      curNum.textContent = pad(want + 1);
      curName.textContent = st.getAttribute('data-title');
      if (phaseEl) phaseEl.textContent = st.getAttribute('data-phase');
      nodes.forEach(function (n, k) { n.classList.toggle('done', k < want); n.classList.toggle('cur', k === want); });
      hidden = true;
      layout();
    }
    if (hidden) {
      hidden = false;
      textBox.classList.remove('out', 'in'); void textBox.offsetWidth; textBox.classList.add('in');
    }
  }

  function onScroll() {
    var r = sec.getBoundingClientRect();
    var span = sec.offsetHeight - window.innerHeight;
    var p = clamp(-r.top / span);
    f = Math.min(N - 0.001, p * N);
    var w = where();
    showText(w.t < 0.15 ? w.i : w.t > 0.8 ? w.i + 1 : -1);
    stripEl.style.transform = 'translateY(' + (-(w.i + ease(w.t)) * 0.86) + 'em)';
    var prog = Math.min(1, f / (N - 1));
    fill.style.width = (prog * 100) + '%';
    pct.textContent = Math.round(prog * 100);
  }

  // ---------- Gentle snap: never leave a step half-way through a change ----------
  var snapping = false, touching = false, idle = null;
  function settle() {
    if (snapping || touching) return;
    var r = sec.getBoundingClientRect();
    if (r.top > 0 || r.bottom < window.innerHeight) return;
    var w = where();
    if (w.t <= 0.02 || w.t >= 0.98) return;
    snapping = true;
    window.scrollTo({ top: stepTop(w.t < 0.5 ? w.i : w.i + 1), behavior: 'smooth' });
    setTimeout(function () { snapping = false; }, 700);
  }
  window.addEventListener('touchstart', function () { touching = true; }, { passive: true });
  window.addEventListener('touchend', function () { touching = false; clearTimeout(idle); idle = setTimeout(settle, 260); }, { passive: true });
  window.addEventListener('scroll', function () { onScroll(); clearTimeout(idle); idle = setTimeout(settle, 220); }, { passive: true });
  window.addEventListener('resize', function () { layout(); onScroll(); });
  layout();
  onScroll();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var was = visible; visible = es[0].isIntersecting;
      if (visible && !was) { layout(); requestAnimationFrame(frame); }
    }).observe(sec);
  } else { visible = true; requestAnimationFrame(frame); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
