// "How we work": a pinned, full-screen journey.
// A particle sculpture (3D-tilted dot field) morphs into a shape for each step as you scroll.
// Dots move on springs, sweep across in a wave, part around the pointer, and glow additively.
// Without JS, or with reduced motion, the section is a plain list of steps (see CSS).
(function () {
  var sec = document.getElementById('how');
  if (!sec) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.classList.add('live');

  var steps = Array.prototype.slice.call(sec.querySelectorAll('.j-step'));
  var N = steps.length;
  var stage = sec.querySelector('.j-stage');
  var textBox = sec.querySelector('.j-text'), copy = sec.querySelector('.j-copy'), kEl = sec.querySelector('.j-k');
  var numEl = sec.querySelector('.j-num'), phEl = sec.querySelector('.j-ph'), titleEl = sec.querySelector('.j-title'), lineEl = sec.querySelector('.j-line');
  var fill = sec.querySelector('.j-fill'), pct = sec.querySelector('.j-pct');
  var curNum = sec.querySelector('.j-cur-n'), curName = sec.querySelector('.j-cur-name'), phaseEl = sec.querySelector('.j-phase');
  var nodesBox = sec.querySelector('.j-nodes');
  var canvas = sec.querySelector('.j-canvas'), ctx = canvas.getContext('2d');
  var pad = function (n) { return String(n).padStart(2, '0'); };

  // ---------- Progress nodes ----------
  var nodes = steps.map(function (st, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'j-node';
    b.style.left = (i / (N - 1)) * 100 + '%';
    b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + st.getAttribute('data-title'));
    b.innerHTML = '<span>' + pad(i + 1) + '</span>';
    b.addEventListener('click', function () {
      var top = sec.getBoundingClientRect().top + window.scrollY;
      var span = sec.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + span * ((i + 0.3) / N), behavior: 'smooth' });
    });
    nodesBox.appendChild(b);
    return b;
  });

  // ---------- Shapes, drawn once and sampled into dot grids ----------
  var S = 400;
  var off = document.createElement('canvas'); off.width = off.height = S;
  var o = off.getContext('2d');
  function line(w) { o.lineWidth = w; o.lineCap = 'round'; o.lineJoin = 'round'; o.strokeStyle = '#000'; }
  function rr(x, y, w, h, r) { o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r); o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath(); }
  var draw = [
    function () { // 01 We ask first: a question in a speech bubble
      line(26); rr(40, 50, 320, 230, 60); o.stroke();
      o.beginPath(); o.moveTo(120, 270); o.lineTo(95, 350); o.lineTo(185, 278); o.stroke();
      line(30); o.beginPath(); o.arc(200, 135, 42, Math.PI * 1.05, Math.PI * 2.25); o.lineTo(200, 200); o.stroke();
      o.beginPath(); o.arc(200, 238, 17, 0, Math.PI * 2); o.fill();
    },
    function () { // 02 We write it down: a page with lines
      line(24); rr(80, 30, 240, 340, 26); o.stroke();
      line(22); [110, 160, 210, 260].forEach(function (y, i) { o.beginPath(); o.moveTo(130, y); o.lineTo(i === 3 ? 220 : 270, y); o.stroke(); });
      o.beginPath(); o.moveTo(130, 310); o.lineTo(180, 310); o.stroke();
    },
    function () { // 03 You see it: a phone with a screen
      line(24); rr(110, 20, 180, 360, 36); o.stroke();
      rr(145, 70, 110, 70, 14); o.fill();
      line(20); [175, 215, 255].forEach(function (y, i) { o.beginPath(); o.moveTo(150, y); o.lineTo(i === 2 ? 205 : 250, y); o.stroke(); });
      o.beginPath(); o.arc(200, 330, 12, 0, Math.PI * 2); o.fill();
    },
    function () { // 04 You choose: three options, one ticked
      line(22); rr(40, 190, 90, 150, 18); o.stroke(); rr(270, 150, 90, 190, 18); o.stroke();
      rr(155, 100, 90, 240, 18); o.fill();
      line(26); o.beginPath(); o.moveTo(165, 45); o.lineTo(192, 72); o.lineTo(240, 18); o.stroke();
    },
    function () { // 05 We build it: </>
      line(40); o.beginPath(); o.moveTo(120, 100); o.lineTo(40, 200); o.lineTo(120, 300); o.moveTo(280, 100); o.lineTo(360, 200); o.lineTo(280, 300); o.moveTo(228, 70); o.lineTo(172, 330); o.stroke();
    },
    function () { // 06 We launch it: a rocket
      o.beginPath(); o.moveTo(200, 20); o.bezierCurveTo(265, 70, 270, 170, 250, 260); o.lineTo(150, 260); o.bezierCurveTo(130, 170, 135, 70, 200, 20); o.closePath(); o.fill();
      o.globalCompositeOperation = 'destination-out'; o.beginPath(); o.arc(200, 130, 26, 0, Math.PI * 2); o.fill(); o.globalCompositeOperation = 'source-over';
      o.beginPath(); o.moveTo(150, 200); o.lineTo(105, 280); o.lineTo(155, 262); o.closePath(); o.fill();
      o.beginPath(); o.moveTo(250, 200); o.lineTo(295, 280); o.lineTo(245, 262); o.closePath(); o.fill();
      line(20); [[175, 300, 165, 360], [200, 300, 200, 385], [225, 300, 235, 360]].forEach(function (l) { o.beginPath(); o.moveTo(l[0], l[1]); o.lineTo(l[2], l[3]); o.stroke(); });
    },
    function () { // 07 We take care of it: a heart
      o.beginPath(); o.moveTo(200, 350); o.bezierCurveTo(40, 245, 25, 120, 105, 75); o.bezierCurveTo(155, 48, 192, 80, 200, 118); o.bezierCurveTo(208, 80, 245, 48, 295, 75); o.bezierCurveTo(375, 120, 360, 245, 200, 350); o.closePath(); o.fill();
    }
  ];

  var small = window.innerWidth < 720;
  var GAP = small ? 9.5 : 7;
  var shapes = draw.slice(0, N).map(function (fn) {
    o.clearRect(0, 0, S, S); o.fillStyle = '#000'; o.globalCompositeOperation = 'source-over'; fn();
    var data = o.getImageData(0, 0, S, S).data, pts = [], row = 0;
    for (var y = GAP / 2; y < S; y += GAP, row++) {
      for (var x = GAP / 2 + (row % 2 ? GAP / 2 : 0); x < S; x += GAP) { // hex-offset rows read finer
        if (data[((y | 0) * S + (x | 0)) * 4 + 3] > 128) pts.push([x / S - 0.5, y / S - 0.5]);
      }
    }
    return pts;
  });
  var M = Math.max.apply(null, shapes.map(function (s) { return s.length; }));
  var targets = shapes.map(function (pts) {
    var out = [];
    for (var i = 0; i < M; i++) {
      if (i < pts.length) out.push({ x: pts[i][0], y: pts[i][1], s: 1 });
      else { var q = pts[(i * 7919) % pts.length]; out.push({ x: q[0], y: q[1], s: 0 }); }
    }
    return out.sort(function (a, b) { return (a.x * 1.0 + a.y * 0.25) - (b.x * 1.0 + b.y * 0.25); });
  });

  // Per-dot state
  var P = [];
  for (var k = 0; k < M; k++) {
    var t0 = targets[0][k];
    P.push({ x: t0.x + (Math.random() - 0.5) * 0.6, y: t0.y + (Math.random() - 0.5) * 0.6, vx: 0, vy: 0, s: 0,
      z: (Math.random() - 0.5) * 0.12, ph: Math.random() * Math.PI * 2, sw: Math.random() * Math.PI * 2, sz: 0.7 + Math.random() * 0.6 });
  }
  // Drifting dust in the background
  var dust = [];
  for (var d = 0; d < (small ? 40 : 90); d++) dust.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, v: 0.00004 + Math.random() * 0.00012, a: 0.15 + Math.random() * 0.35 });

  // ---------- Glow sprites: Signal on the left, warming to fog on the right ----------
  var BINS = 12, sprites = [];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  var SIGNAL = [255, 90, 31], EMBER = [255, 145, 100], FOG = [215, 221, 229];
  for (var bi = 0; bi < BINS; bi++) {
    var u = bi / (BINS - 1), c = u < 0.55 ? mix(SIGNAL, EMBER, u / 0.55) : mix(EMBER, FOG, (u - 0.55) / 0.45);
    var sc = document.createElement('canvas'); sc.width = sc.height = 64;
    var g = sc.getContext('2d'), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    var cs = (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0);
    rg.addColorStop(0, 'rgba(255,240,230,1)');
    rg.addColorStop(0.1, 'rgba(' + cs + ',1)');
    rg.addColorStop(0.2, 'rgba(' + cs + ',.85)');
    rg.addColorStop(0.27, 'rgba(' + cs + ',.18)');
    rg.addColorStop(0.6, 'rgba(' + cs + ',.05)');
    rg.addColorStop(1, 'rgba(' + cs + ',0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    sprites.push(sc);
  }

  // ---------- Layout ----------
  var W = 0, H = 0, dpr = 1, box = { cx: 0, cy: 0, size: 0 }, goal = { cx: 0, cy: 0, size: 0 }, placed = false;
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sr = stage.getBoundingClientRect();
    var tr = copy.getBoundingClientRect();
    var label = sec.querySelector('.j-label').getBoundingClientRect();
    var barTop = sec.querySelector('.j-bar').getBoundingClientRect().top - sr.top;
    if (W >= 960) { // sculpture on the right half
      var left = tr.right - sr.left + 40, top = label.bottom - sr.top + 10;
      goal.size = Math.min(W - left - 40, barTop - top - 20) * 0.8;
      goal.cx = left + (W - left) / 2; goal.cy = top + (barTop - top) / 2;
    } else { // sculpture above the text
      var t = label.bottom - sr.top + 6, b = tr.top - sr.top - 10;
      goal.size = Math.max(120, Math.min(W * 0.82, b - t) * 0.86);
      goal.cx = W / 2; goal.cy = t + (b - t) / 2;
    }
  }

  // ---------- Pointer ----------
  var mouse = { x: 9, y: 9, tx: 0 };
  stage.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left - box.cx) / box.size;
    mouse.y = (e.clientY - r.top - box.cy) / box.size;
    mouse.tx = (e.clientX - r.left) / W - 0.5;
  });
  stage.addEventListener('pointerleave', function () { mouse.x = mouse.y = 9; mouse.tx = 0; });

  // ---------- Scroll state ----------
  var f = 0, shown = -1, visible = false, rot = 0;
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function frame(time) {
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);
    if (!placed) { box.cx = goal.cx; box.cy = goal.cy; box.size = goal.size; placed = true; }
    box.cx += (goal.cx - box.cx) * 0.06; box.cy += (goal.cy - box.cy) * 0.06; box.size += (goal.size - box.size) * 0.06;
    var size = box.size, cx = box.cx, cy = box.cy;

    // breathing light behind the sculpture
    var breathe = 0.5 + 0.5 * Math.sin(time / 1800);
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.75);
    glow.addColorStop(0, 'rgba(255,90,31,' + (0.10 + 0.06 * breathe) + ')');
    glow.addColorStop(1, 'rgba(255,90,31,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // dust
    for (var q = 0; q < dust.length; q++) {
      var du = dust[q]; du.y -= du.v * 16; if (du.y < -0.02) { du.y = 1.02; du.x = Math.random(); }
      ctx.fillStyle = 'rgba(213,218,225,' + du.a + ')';
      ctx.fillRect(du.x * W, du.y * H, du.r, du.r);
    }

    var i = Math.min(N - 1, Math.floor(f)), local = f - i;
    var t = i >= N - 1 ? 0 : clamp((local - 0.5) / 0.5);
    var A = targets[i], B = targets[Math.min(N - 1, i + 1)];
    rot += ((Math.sin(time / 5200) * 0.32 + mouse.tx * 0.5) - rot) * 0.05;
    var cr = Math.cos(rot), sr = Math.sin(rot);
    var r0 = Math.max(small ? 3.2 : 3.6, size / (small ? 48 : 64));

    var bh = size * 0.6, bl = Math.max(14, size * 0.06);
    ctx.strokeStyle = 'rgba(195,202,211,.22)'; ctx.lineWidth = 1;
    ctx.beginPath();
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) {
      var x = cx + c[0] * bh, y = cy + c[1] * bh;
      ctx.moveTo(x - c[0] * bl, y); ctx.lineTo(x, y); ctx.lineTo(x, y - c[1] * bl);
    });
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';
    for (var d = 0; d < M; d++) {
      var p = P[d], a = A[d], b = B[d];
      // each dot starts its move a little later than the one to its left: a sweep
      var nx = a.x + 0.5;
      var td = ease(clamp((t * 1.6) - nx * 0.6));
      var swirl = Math.sin(td * Math.PI);
      var tx = a.x + (b.x - a.x) * td + Math.cos(p.sw) * swirl * 0.12;
      var ty = a.y + (b.y - a.y) * td + Math.sin(p.sw) * swirl * 0.12;
      var ts = a.s + (b.s - a.s) * td;
      tx += Math.sin(time / 1300 + p.ph) * 0.003; ty += Math.cos(time / 1500 + p.ph) * 0.003;
      // part around the pointer
      var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
      if (md < 0.018) { var push = (0.018 - md) * 2.2; tx += mx * push * 9; ty += my * push * 9; }
      // spring
      p.vx = p.vx * 0.84 + (tx - p.x) * 0.075; p.vy = p.vy * 0.84 + (ty - p.y) * 0.075;
      p.x += p.vx; p.y += p.vy; p.s += (ts - p.s) * 0.1;
      if (p.s < 0.03) continue;
      // 3D tilt around the vertical axis, with a little depth per dot
      var x3 = p.x * cr - p.z * sr, z3 = p.x * sr + p.z * cr;
      var persp = 1 / (1 + z3 * 0.9);
      var sx = cx + x3 * size * persp, sy = cy + p.y * size * persp;
      var rad = r0 * p.sz * p.s * persp * (0.85 + 0.15 * Math.sin(time / 600 + p.ph));
      var bin = Math.max(0, Math.min(BINS - 1, ((x3 + 0.5) * (BINS - 1)) | 0));
      ctx.globalAlpha = (0.2 + 0.6 * p.s) * (0.7 + 0.3 * persp);
      ctx.drawImage(sprites[bin], sx - rad * 2, sy - rad * 2, rad * 4, rad * 4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    requestAnimationFrame(frame);
  }

  // ---------- Text: masked word-by-word reveal ----------
  function words(el, text) {
    el.innerHTML = text.split(' ').map(function (w, k) { return '<span class="m"><span style="--d:' + (k * 55) + 'ms">' + w + '</span></span>'; }).join(' ');
  }
  function setText(i) {
    if (i === shown) return;
    var first = shown === -1;
    shown = i;
    var st = steps[i];
    textBox.classList.add('out');
    setTimeout(function () {
      words(numEl, pad(i + 1));
      phEl.textContent = st.getAttribute('data-phase');
      kEl.textContent = pad(i + 1);
      words(titleEl, st.getAttribute('data-title'));
      lineEl.textContent = st.getAttribute('data-line');
      curNum.textContent = pad(i + 1);
      curName.textContent = st.getAttribute('data-title');
      if (phaseEl) phaseEl.textContent = st.getAttribute('data-phase');
      textBox.classList.remove('out');
      textBox.classList.remove('in'); void textBox.offsetWidth; textBox.classList.add('in');
      layout();
    }, first ? 0 : 260);
    nodes.forEach(function (n, k) { n.classList.toggle('done', k < i); n.classList.toggle('cur', k === i); });
  }

  function onScroll() {
    var r = sec.getBoundingClientRect();
    var span = sec.offsetHeight - window.innerHeight;
    var p = clamp(-r.top / span);
    f = Math.min(N - 0.001, p * N);
    var fl = Math.floor(f), local = f - fl;
    setText(fl + (local > 0.72 && fl < N - 1 ? 1 : 0));
    var prog = Math.min(1, f / (N - 1));
    fill.style.width = (prog * 100) + '%';
    pct.textContent = Math.round(prog * 100);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { layout(); onScroll(); });
  onScroll();
  layout();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var was = visible; visible = es[0].isIntersecting;
      if (visible && !was) { layout(); requestAnimationFrame(frame); }
    }).observe(sec);
  } else { visible = true; requestAnimationFrame(frame); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
